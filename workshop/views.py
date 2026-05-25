from uuid import uuid4
import json
import logging
import datetime as _dt

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token as _get_csrf_token
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.views import View
from django.utils import timezone
from django.db.models import Count as _Count
from django.contrib.auth.models import User as _User
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Client, Colleague, IntegrationLink, MasterApproval, Order, Product, ProductSet, Review, Task, VKPost
from .serializers import IntegrationLinkSerializer, ProductSerializer, ReviewSerializer
from .services.telegram import TelegramConfigError, repost_to_channel, store_update
from .services.vk import parse_post

logger = logging.getLogger(__name__)


def _parse_int(value, default: int = 0) -> int:
    try:
        return int(value or default)
    except (ValueError, TypeError):
        return default

_CAMEL_TO_SNAKE = {
    "priceFrom": "price_from",
    "leadTime": "lead_time",
    "protectionClass": "protection_class",
}

_PRODUCT_FIELDS = {
    "name", "subtitle", "status", "category", "era", "material",
    "sizes", "weight", "popularity", "history", "description",
    "image", "gallery", "badge",
}


def _product_kwargs(data: dict) -> dict:
    kwargs: dict = {}
    for key, value in data.items():
        field = _CAMEL_TO_SNAKE.get(key, key)
        if field in _PRODUCT_FIELDS | set(_CAMEL_TO_SNAKE.values()):
            kwargs[field] = value
    return kwargs


def _unique_slug(name: str) -> str:
    suffix = uuid4().hex[:8]
    base = "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-") or "product"
    slug = f"{base}-{suffix}"
    return slug[:50]


class BootstrapView(APIView):
    def get(self, request):
        try:
            page = max(int(request.query_params.get("page", 1)), 1)
            page_size = min(max(int(request.query_params.get("pageSize", 200)), 1), 200)
        except (ValueError, TypeError):
            page, page_size = 1, 200

        offset = (page - 1) * page_size
        all_products = Product.objects.all()
        total = all_products.count()
        products_qs = all_products[offset:offset + page_size]
        product_ids = [p.id for p in products_qs]

        links = {
            item["key"]: item["url"]
            for item in IntegrationLinkSerializer(IntegrationLink.objects.all(), many=True).data
        }

        payload = {
            "products": ProductSerializer(products_qs, many=True).data,
            "total": total,
            "page": page,
            "hasNext": (offset + page_size) < total,
            "reviews": ReviewSerializer(Review.objects.all(), many=True).data,
            "links": {
                "telegramOrder": links.get("telegram_order", settings.TELEGRAM_PUBLIC_URL),
                "telegramPublic": links.get("telegram_public", settings.TELEGRAM_PUBLIC_URL),
                "vkCommunity": links.get("vk_community", settings.VK_COMMUNITY_URL),
                "vkMessages": links.get("vk_messages", settings.VK_MESSAGES_URL),
            },
        }
        return Response(payload)


class ReviewCreateView(APIView):
    def post(self, request, product_id: int):
        product = Product.objects.filter(pk=product_id).first()
        if not product:
            return Response({"detail": "Товар не найден."}, status=status.HTTP_404_NOT_FOUND)
        review = Review.objects.create(
            product=product,
            text=request.data.get("text", "").strip(),
            review_date=request.data.get("date") or timezone.localtime().strftime("%d.%m.%Y"),
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class WorkshopReviewsView(APIView):
    def get(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(ReviewSerializer(Review.objects.all(), many=True).data)

    def post(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        review = Review.objects.create(
            text=request.data.get("text", "").strip(),
            review_date=request.data.get("review_date", "") or timezone.localtime().strftime("%d.%m.%Y"),
            vk_url=request.data.get("vk_url", "").strip(),
            photo_url=request.data.get("photo_url", "").strip(),
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class WorkshopReviewDetailView(APIView):
    def patch(self, request, review_id: int):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        review = Review.objects.filter(pk=review_id).first()
        if not review:
            return Response({"detail": "Отзыв не найден."}, status=status.HTTP_404_NOT_FOUND)
        for field in ("text", "review_date", "vk_url", "photo_url"):
            if field in request.data:
                setattr(review, field, request.data[field])
        review.save()
        return Response(ReviewSerializer(review).data)

    def delete(self, request, review_id: int):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        review = Review.objects.filter(pk=review_id).first()
        if not review:
            return Response({"detail": "Отзыв не найден."}, status=status.HTTP_404_NOT_FOUND)
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductListCreateView(APIView):
    def get(self, request):
        return Response(ProductSerializer(Product.objects.all(), many=True).data)

    def post(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)

        kwargs = _product_kwargs(request.data)
        if not kwargs.get("name"):
            return Response({"detail": "Поле name обязательно."}, status=status.HTTP_400_BAD_REQUEST)

        kwargs.setdefault("popularity", 0)
        kwargs.setdefault("badge", "")
        kwargs.setdefault("sizes", [])
        kwargs.setdefault("description", [])
        kwargs.setdefault("gallery", [])
        kwargs["slug"] = _unique_slug(kwargs["name"])

        product = Product.objects.create(**kwargs, created_by=request.user, updated_by=request.user)
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class ProductDetailView(APIView):
    def get_product(self, pk):
        return Product.objects.filter(pk=pk).first()

    def get(self, request, product_id: int):
        product = self.get_product(product_id)
        if not product:
            return Response({"detail": "Товар не найден."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(product).data)

    def patch(self, request, product_id: int):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)

        product = self.get_product(product_id)
        if not product:
            return Response({"detail": "Товар не найден."}, status=status.HTTP_404_NOT_FOUND)

        kwargs = _product_kwargs(request.data)
        for field, value in kwargs.items():
            setattr(product, field, value)
        product.updated_by = request.user
        product.save()
        return Response(ProductSerializer(product).data)

    def delete(self, request, product_id: int):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)

        product = self.get_product(product_id)
        if not product:
            return Response({"detail": "Товар не найден."}, status=status.HTTP_404_NOT_FOUND)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AuthView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"detail": "Неверный логин или пароль."}, status=status.HTTP_401_UNAUTHORIZED)
        login(request, user)
        _get_csrf_token(request._request)  # ensure csrftoken cookie is set in response
        return Response({
            "id": user.id,
            "username": user.username,
            "fullName": user.get_full_name() or user.username,
            "isStaff": user.is_staff,
            "isSuperuser": user.is_superuser,
        })


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"ok": True})


class MeView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Не авторизован."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "fullName": request.user.get_full_name() or request.user.username,
            "isStaff": request.user.is_staff,
            "isSuperuser": request.user.is_superuser,
        })


class TelegramWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        secret = settings.TELEGRAM_BOT_TOKEN
        if secret:
            header = request.META.get("HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN", "")
            if header and header != secret:
                return Response({"ok": False}, status=status.HTTP_403_FORBIDDEN)
        client = store_update(request.data)
        return Response({"ok": True, "client": client.id if client else None})


class VkCallbackView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        data = request.data

        # VK sends this once to verify the endpoint
        if data.get("type") == "confirmation":
            token = settings.VK_CONFIRMATION_TOKEN
            if not token:
                return Response({"detail": "VK_CONFIRMATION_TOKEN не настроен."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return HttpResponse(token, content_type="text/plain")

        # Verify secret key
        if settings.VK_CALLBACK_SECRET and data.get("secret") != settings.VK_CALLBACK_SECRET:
            return HttpResponse("forbidden", content_type="text/plain", status=403)

        event_type = data.get("type")

        if event_type == "wall_post_new":
            post = data.get("object", {})

            # Skip reposts (copy_history present means it's a repost, not original)
            if post.get("copy_history"):
                return HttpResponse("ok", content_type="text/plain")

            # Skip postponed posts that aren't published yet
            if post.get("post_type") == "postpone":
                return HttpResponse("ok", content_type="text/plain")

            # Deduplicate by post ID using Django cache
            from django.core.cache import cache
            post_key = f"vk_post_{post.get('owner_id')}_{post.get('id')}"
            if cache.get(post_key):
                return HttpResponse("ok", content_type="text/plain")
            cache.set(post_key, True, timeout=86400)  # 24 hours

            # Save to DB
            try:
                import datetime
                from django.utils.timezone import make_aware
                photo_url = ''
                attachments = post.get('attachments', [])
                for att in attachments:
                    if att.get('type') == 'photo':
                        sizes = att['photo'].get('sizes', [])
                        if sizes:
                            best = max(sizes, key=lambda s: s.get('width', 0))
                            photo_url = best.get('url', '')
                        break
                posted_at = make_aware(datetime.datetime.fromtimestamp(post.get('date', 0)))
                VKPost.objects.get_or_create(
                    post_id=post.get('id'),
                    defaults={
                        'owner_id': post.get('owner_id', 0),
                        'text': post.get('text', '')[:2000],
                        'photo_url': photo_url,
                        'posted_at': posted_at,
                    }
                )
            except Exception:
                pass

            channel_id = settings.TELEGRAM_CHANNEL_ID
            if not channel_id:
                return HttpResponse("ok", content_type="text/plain")

            text, photos = parse_post(post)

            if not text and not photos:
                return HttpResponse("ok", content_type="text/plain")

            try:
                repost_to_channel(channel_id, text, photos)
            except TelegramConfigError:
                pass  # Bot not configured — silently skip, VK still gets "ok"
            except Exception as exc:
                logger.error("VK→TG repost error: %s", exc, exc_info=True)

        # VK expects plain "ok" for all handled events
        return HttpResponse("ok", content_type="text/plain")


class VKPostsView(View):
    VK_RSS = "https://vk.com/rss/wall-238824374.rss"

    def get(self, request):
        # Try RSS feed first (no token needed)
        try:
            data = self._fetch_rss()
            if data:
                return JsonResponse({'posts': data})
        except Exception:
            pass
        # Fallback: DB (posts captured via callback)
        posts = VKPost.objects.all()[:10]
        data = [
            {
                'id': p.post_id,
                'text': p.text,
                'photo_url': p.photo_url,
                'posted_at': p.posted_at.isoformat(),
            }
            for p in posts
        ]
        return JsonResponse({'posts': data})

    def _fetch_rss(self):
        import xml.etree.ElementTree as ET
        import requests as _req
        resp = _req.get(self.VK_RSS, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
        ns = {'media': 'http://search.yahoo.com/mrss/'}
        items = root.findall('.//item')
        posts = []
        for i, item in enumerate(items[:10]):
            title = (item.findtext('title') or '').strip()
            description = (item.findtext('description') or '').strip()
            text = description if description else title
            # strip HTML tags simply
            import re
            text = re.sub(r'<[^>]+>', '', text).strip()
            pub_date = item.findtext('pubDate') or ''
            photo_url = ''
            enc = item.find('enclosure')
            if enc is not None:
                photo_url = enc.get('url', '')
            thumb = item.find('media:thumbnail', ns)
            if not photo_url and thumb is not None:
                photo_url = thumb.get('url', '')
            link = item.findtext('link') or ''
            post_id = i
            try:
                post_id = int(link.rstrip('/').split('_')[-1])
            except (ValueError, IndexError):
                pass
            posts.append({
                'id': post_id,
                'text': text[:500],
                'photo_url': photo_url,
                'posted_at': pub_date,
            })
        return posts


class NewsPostCreateView(View):
    def post(self, request):
        if not request.user.is_staff:
            return JsonResponse({'error': 'forbidden'}, status=403)
        import json
        body = json.loads(request.body)
        post = VKPost.objects.create(
            post_id=int(timezone.now().timestamp()),
            owner_id=0,
            text=body.get('text', '')[:2000],
            photo_url=body.get('photo_url', ''),
            posted_at=timezone.now(),
        )
        return JsonResponse({'id': post.post_id, 'text': post.text, 'photo_url': post.photo_url, 'posted_at': post.posted_at.isoformat()}, status=201)


class NewsPostDeleteView(View):
    def delete(self, request, post_id):
        if not request.user.is_staff:
            return JsonResponse({'error': 'forbidden'}, status=403)
        VKPost.objects.filter(post_id=post_id).delete()
        return JsonResponse({'ok': True})


# ── Workshop API (staff only) ──────────────────────────────────────────────────

def _is_staff(request) -> bool:
    return request.user.is_authenticated and request.user.is_staff


def _parse_deadline(raw) -> '_dt.date | None':
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%d.%m.%Y"):
        try:
            return _dt.datetime.strptime(str(raw), fmt).date()
        except (ValueError, TypeError):
            pass
    return None


def _order_to_dict(order) -> dict:
    return {
        'id': order.id,
        'client_id': order.client_id,
        'client_name': order.client_name,
        'client_vk': order.client_vk if hasattr(order, 'client_vk') else '',
        'product_name': order.product_name,
        'configuration': order.configuration,
        'status': order.status,
        'deadline': order.deadline.isoformat() if order.deadline else None,
        'total': order.total or 0,
        'advance': order.advance or 0,
        'balance': (order.total or 0) - (order.advance or 0),
        'notes': order.notes,
        'assigned_to_id': order.assigned_to_id,
        'assigned_to_name': (
            order.assigned_to.get_full_name() or order.assigned_to.username
        ) if order.assigned_to else None,
        'created_at': order.created_at.strftime('%d.%m.%Y'),
        'order_type': order.order_type if hasattr(order, 'order_type') else 'product',
        'set_id': order.product_set_id if hasattr(order, 'product_set_id') else None,
        'set_name': order.product_set.name if hasattr(order, 'product_set') and order.product_set else None,
        'tasks': [
            {
                'id': t.id,
                'product_id': t.product_id,
                'product_name': t.product_name or '',
                'status': t.status,
                'assigned_to_id': t.assigned_to_id,
            }
            for t in order.tasks.all()
        ],
    }


def _client_to_dict(client) -> dict:
    return {
        'id': client.id,
        'name': client.name,
        'vk_url': client.vk_url,
        'status': client.status,
        'notes': client.notes,
        'order_count': client.orders.count(),
        'created_at': client.created_at.strftime('%d.%m.%Y'),
    }


class WorkshopDashboardView(APIView):
    def get(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)

        today = timezone.localdate()
        active_statuses = [Order.Status.NEW, Order.Status.IN_PROGRESS]

        status_counts = {s: 0 for s in [Order.Status.NEW, Order.Status.IN_PROGRESS, Order.Status.DONE, Order.Status.CANCELLED]}
        for row in Order.objects.values('status').annotate(n=_Count('id')):
            if row['status'] in status_counts:
                status_counts[row['status']] = row['n']

        upcoming = []
        for order in (
            Order.objects.filter(
                status__in=active_statuses,
                deadline__gte=today,
                deadline__lte=today + _dt.timedelta(days=14),
            )
            .select_related('assigned_to')
            .order_by('deadline')
        ):
            upcoming.append({
                'id': order.id,
                'client_name': order.client_name,
                'product_name': order.product_name,
                'deadline': order.deadline.isoformat(),
                'days_left': (order.deadline - today).days,
                'status': order.status,
                'assigned_to_name': (
                    order.assigned_to.get_full_name() or order.assigned_to.username
                ) if order.assigned_to else None,
            })

        my_active = (
            Order.objects.filter(status__in=active_statuses, assigned_to=request.user).count()
        )

        return Response({
            'status_counts': status_counts,
            'upcoming_deadlines': upcoming,
            'my_active_count': my_active,
        })


class WorkshopOrdersView(APIView):
    def get(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        qs = Order.objects.select_related('assigned_to', 'product_set').prefetch_related('tasks').order_by('-created_at')
        if request.query_params.get('status'):
            qs = qs.filter(status=request.query_params['status'])
        if request.query_params.get('mine') == '1':
            qs = qs.filter(assigned_to=request.user)
        return Response([_order_to_dict(o) for o in qs])

    def post(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        client_name = (request.data.get('client_name') or '').strip()
        if not client_name:
            return Response({"detail": "Укажите имя клиента."}, status=status.HTTP_400_BAD_REQUEST)
        assigned_id = request.data.get('assigned_to_id') or None
        assigned_user = (
            _User.objects.filter(pk=assigned_id, is_staff=True).first()
            if assigned_id else None
        ) or request.user
        order = Order.objects.create(
            client_name=client_name,
            product_name=(request.data.get('product_name') or '').strip(),
            configuration=(request.data.get('configuration') or '').strip(),
            status=request.data.get('status') or Order.Status.NEW,
            deadline=_parse_deadline(request.data.get('deadline')),
            total=_parse_int(request.data.get('total')),
            advance=_parse_int(request.data.get('advance')),
            notes=(request.data.get('notes') or '').strip(),
            assigned_to=assigned_user,
        )
        return Response(_order_to_dict(order), status=status.HTTP_201_CREATED)


class WorkshopOrderDetailView(APIView):
    def get(self, request, order_id):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        order = Order.objects.select_related('assigned_to', 'product_set').prefetch_related('tasks').filter(pk=order_id).first()
        if not order:
            return Response({"detail": "Заказ не найден."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_order_to_dict(order))

    def patch(self, request, order_id):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        order = Order.objects.select_related('assigned_to', 'product_set').prefetch_related('tasks').filter(pk=order_id).first()
        if not order:
            return Response({"detail": "Заказ не найден."}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_superuser and order.assigned_to_id and order.assigned_to_id != request.user.id:
            return Response({"detail": "Можно редактировать только свои заказы."}, status=status.HTTP_403_FORBIDDEN)
        for field in ('client_name', 'product_name', 'configuration', 'status', 'notes'):
            if field in request.data:
                setattr(order, field, request.data[field])
        if 'total' in request.data:
            order.total = _parse_int(request.data['total'])
        if 'advance' in request.data:
            order.advance = _parse_int(request.data['advance'])
        if 'deadline' in request.data:
            order.deadline = _parse_deadline(request.data['deadline'])
        if 'assigned_to_id' in request.data and request.user.is_superuser:
            uid = request.data['assigned_to_id']
            order.assigned_to = _User.objects.filter(pk=uid).first() if uid else None
        order.save()
        return Response(_order_to_dict(order))

    def delete(self, request, order_id):
        if not request.user.is_authenticated or not request.user.is_superuser:
            return Response({"detail": "Только администратор может удалять заказы."}, status=status.HTTP_403_FORBIDDEN)
        order = Order.objects.prefetch_related('tasks').filter(pk=order_id).first()
        if not order:
            return Response({"detail": "Заказ не найден."}, status=status.HTTP_404_NOT_FOUND)
        order.delete()
        return Response({"ok": True})


class WorkshopClientsView(APIView):
    def get(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        q = (request.query_params.get('q') or '').strip()
        qs = Client.objects.prefetch_related('orders').order_by('-created_at')
        if q:
            qs = qs.filter(name__icontains=q)
        return Response([_client_to_dict(c) for c in qs])

    def post(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({"detail": "Укажите имя клиента."}, status=status.HTTP_400_BAD_REQUEST)
        client = Client.objects.create(
            name=name,
            vk_url=(request.data.get('vk_url') or '').strip(),
            status=request.data.get('status') or Client.Status.POTENTIAL,
            notes=(request.data.get('notes') or '').strip(),
        )
        return Response(_client_to_dict(client), status=status.HTTP_201_CREATED)


class WorkshopClientDetailView(APIView):
    def patch(self, request, client_id):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        client = Client.objects.prefetch_related('orders').filter(pk=client_id).first()
        if not client:
            return Response({"detail": "Клиент не найден."}, status=status.HTTP_404_NOT_FOUND)
        for field in ('name', 'vk_url', 'status', 'notes'):
            if field in request.data:
                setattr(client, field, request.data[field])
        client.save()
        return Response(_client_to_dict(client))


class WorkshopUsersView(APIView):
    def get(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        users = _User.objects.filter(is_staff=True, is_active=True).order_by('first_name', 'username')
        return Response([
            {'id': u.id, 'username': u.username, 'fullName': u.get_full_name() or u.username}
            for u in users
        ])


# ── Sets ──────────────────────────────────────────────────────────────────────

def _set_to_dict(ps) -> dict:
    products = list(ps.products.all())
    price_individual = sum(p.price_from for p in products)
    price_set = ps.price_from if ps.price_from else price_individual
    return {
        'id': ps.id,
        'slug': ps.slug,
        'name': ps.name,
        'subtitle': ps.subtitle,
        'description': ps.description,
        'image': ps.image,
        'gallery': ps.gallery,
        'badge': ps.badge,
        'price_from': price_set,
        'price_individual': price_individual,
        'discount': price_individual - price_set,
        'products': [{'id': p.id, 'name': p.name, 'slug': p.slug, 'price_from': p.price_from, 'image': p.image} for p in products],
    }


class WorkshopSetsView(APIView):
    def get(self, request):
        sets = ProductSet.objects.prefetch_related('products').all()
        return Response([_set_to_dict(s) for s in sets])

    def post(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({"detail": "Укажите название комплекта."}, status=status.HTTP_400_BAD_REQUEST)
        price_raw = request.data.get('price_from')
        try:
            price_from = int(price_raw) if price_raw else None
        except (ValueError, TypeError):
            return Response({"detail": "Некорректное значение цены."}, status=status.HTTP_400_BAD_REQUEST)
        ps = ProductSet.objects.create(
            slug=_unique_slug(name),
            name=name,
            subtitle=(request.data.get('subtitle') or '').strip(),
            description=(request.data.get('description') or '').strip(),
            image=(request.data.get('image') or '').strip(),
            gallery=request.data.get('gallery') or [],
            badge=(request.data.get('badge') or '').strip(),
            price_from=price_from,
            created_by=request.user,
            updated_by=request.user,
        )
        product_ids = request.data.get('product_ids') or []
        if product_ids:
            ps.products.set(Product.objects.filter(pk__in=product_ids))
        return Response(_set_to_dict(ps), status=status.HTTP_201_CREATED)


class WorkshopSetDetailView(APIView):
    def get(self, request, set_id):
        ps = ProductSet.objects.prefetch_related('products').filter(pk=set_id).first()
        if not ps:
            return Response({"detail": "Комплект не найден."}, status=status.HTTP_404_NOT_FOUND)
        return Response(_set_to_dict(ps))

    def patch(self, request, set_id):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        ps = ProductSet.objects.prefetch_related('products').filter(pk=set_id).first()
        if not ps:
            return Response({"detail": "Комплект не найден."}, status=status.HTTP_404_NOT_FOUND)
        for field in ('name', 'subtitle', 'description', 'image', 'gallery', 'badge'):
            if field in request.data:
                setattr(ps, field, request.data[field])
        if 'price_from' in request.data:
            v = request.data['price_from']
            try:
                ps.price_from = int(v) if v else None
            except (ValueError, TypeError):
                return Response({"detail": "Некорректное значение цены."}, status=status.HTTP_400_BAD_REQUEST)
        if 'product_ids' in request.data:
            ps.products.set(Product.objects.filter(pk__in=request.data['product_ids']))
        ps.updated_by = request.user
        ps.save()
        return Response(_set_to_dict(ps))

    def delete(self, request, set_id):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        ps = ProductSet.objects.filter(pk=set_id).first()
        if not ps:
            return Response({"detail": "Комплект не найден."}, status=status.HTTP_404_NOT_FOUND)
        ps.delete()
        return Response({"ok": True})


# ── Tasks ─────────────────────────────────────────────────────────────────────

def _task_to_dict(task) -> dict:
    return {
        'id': task.id,
        'order_id': task.order_id,
        'order_client': task.order.client_name,
        'order_deadline': task.order.deadline.isoformat() if task.order.deadline else None,
        'product_id': task.product_id,
        'product_name': task.product_name or (task.product.name if task.product else '—'),
        'product_image': task.product.image if task.product else '',
        'status': task.status,
        'assigned_to_id': task.assigned_to_id,
        'assigned_to_name': (task.assigned_to.get_full_name() or task.assigned_to.username) if task.assigned_to else None,
        'notes': task.notes,
        'created_at': task.created_at.strftime('%d.%m.%Y'),
    }


def _create_tasks_for_order(order: Order):
    if order.order_type == 'set' and order.product_set_id:
        ps = ProductSet.objects.prefetch_related('products').filter(pk=order.product_set_id).first()
        if ps:
            for product in ps.products.all():
                Task.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                )
    elif order.order_type == 'product' and order.product_id:
        product = order.product
        Task.objects.create(
            order=order,
            product=product,
            product_name=product.name if product else order.product_name,
        )
    elif order.order_type == 'service' or order.product_name:
        Task.objects.create(
            order=order,
            product=None,
            product_name=order.product_name,
        )


class WorkshopTasksView(APIView):
    def get(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        view = request.query_params.get('view', 'stack')
        qs = Task.objects.select_related('order', 'product', 'assigned_to')
        if view == 'stack':
            qs = qs.filter(status=Task.Status.PENDING)
            approved_product_ids = list(
                MasterApproval.objects.filter(master=request.user).values_list('product_id', flat=True)
            )
            qs = qs.filter(product_id__in=approved_product_ids)
        elif view == 'mine':
            qs = qs.filter(assigned_to=request.user).exclude(status=Task.Status.DONE)
        elif view == 'all' and request.user.is_superuser:
            pass
        else:
            qs = qs.filter(assigned_to=request.user)
        return Response([_task_to_dict(t) for t in qs])


class WorkshopTaskDetailView(APIView):
    def patch(self, request, task_id):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        task = Task.objects.select_related('order', 'product', 'assigned_to').filter(pk=task_id).first()
        if not task:
            return Response({"detail": "Задача не найдена."}, status=status.HTTP_404_NOT_FOUND)
        action = request.data.get('action')
        if action == 'take':
            if task.status != Task.Status.PENDING:
                return Response({"detail": "Задача уже взята."}, status=status.HTTP_400_BAD_REQUEST)
            approved = MasterApproval.objects.filter(master=request.user, product=task.product).exists()
            if not approved and not request.user.is_superuser:
                return Response({"detail": "Нет допуска к этому предмету."}, status=status.HTTP_403_FORBIDDEN)
            task.status = Task.Status.TAKEN
            task.assigned_to = request.user
            task.save()
        elif action == 'done':
            if task.assigned_to != request.user and not request.user.is_superuser:
                return Response({"detail": "Нельзя закрыть чужую задачу."}, status=status.HTTP_403_FORBIDDEN)
            task.status = Task.Status.DONE
            task.save()
        elif action == 'release':
            if task.assigned_to == request.user or request.user.is_superuser:
                task.status = Task.Status.PENDING
                task.assigned_to = None
                task.save()
        else:
            if 'notes' in request.data:
                task.notes = request.data['notes']
                task.save()
        return Response(_task_to_dict(task))


# ── Approvals ─────────────────────────────────────────────────────────────────

class WorkshopApprovalsView(APIView):
    def get(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        staff = _User.objects.filter(is_staff=True, is_active=True).order_by('first_name', 'username')
        result = []
        for user in staff:
            approved_ids = list(MasterApproval.objects.filter(master=user).values_list('product_id', flat=True))
            result.append({
                'user_id': user.id,
                'username': user.username,
                'fullName': user.get_full_name() or user.username,
                'approved_product_ids': approved_ids,
            })
        return Response(result)

    def post(self, request):
        if not request.user.is_superuser:
            return Response({"detail": "Только администратор."}, status=status.HTTP_403_FORBIDDEN)
        master_id = request.data.get('master_id')
        product_id = request.data.get('product_id')
        action = request.data.get('action', 'add')
        master = _User.objects.filter(pk=master_id, is_staff=True).first()
        product = Product.objects.filter(pk=product_id).first()
        if not master or not product:
            return Response({"detail": "Мастер или предмет не найден."}, status=status.HTTP_404_NOT_FOUND)
        if action == 'add':
            MasterApproval.objects.get_or_create(master=master, product=product)
        elif action == 'remove':
            MasterApproval.objects.filter(master=master, product=product).delete()
        return Response({"ok": True})


class ApprovalsMeView(APIView):
    def get(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        ids = list(MasterApproval.objects.filter(master=request.user).values_list('product_id', flat=True))
        return Response({'approved_product_ids': ids})


# ── Updated Order creation (with task auto-creation) ──────────────────────────

class WorkshopOrderCreateView(APIView):
    def post(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        data = request.data
        order_type = data.get('order_type', 'product')
        client_name = (data.get('client_name') or '').strip()
        if not client_name:
            return Response({"detail": "Укажите имя клиента."}, status=status.HTTP_400_BAD_REQUEST)

        product = None
        product_set = None
        product_name = (data.get('product_name') or '').strip()
        total = _parse_int(data.get('total'))

        if order_type == 'product':
            pid = data.get('product_id')
            if pid:
                product = Product.objects.filter(pk=pid).first()
                if product:
                    product_name = product.name
                    if not total:
                        total = product.price_from
        elif order_type == 'set':
            sid = data.get('set_id')
            if sid:
                product_set = ProductSet.objects.prefetch_related('products').filter(pk=sid).first()
                if product_set:
                    product_name = product_set.name
                    if not total:
                        total = product_set.price_from_total()
        elif order_type == 'service':
            total = _parse_int(data.get('total'))

        advance_override = data.get('advance_override')
        advance = _parse_int(advance_override, total // 2) if advance_override is not None else total // 2

        assigned_id = data.get('assigned_to_id') or None
        assigned_user = (
            _User.objects.filter(pk=assigned_id, is_staff=True).first()
            if assigned_id else None
        ) or request.user

        order = Order.objects.create(
            client_name=client_name,
            client_vk=(data.get('client_vk') or '').strip(),
            order_type=order_type,
            product=product,
            product_set=product_set,
            product_name=product_name,
            configuration=(data.get('configuration') or '').strip(),
            status=Order.Status.NEW,
            deadline=_parse_deadline(data.get('deadline')),
            total=total,
            advance=advance,
            notes=(data.get('notes') or '').strip(),
            assigned_to=assigned_user,
        )
        _create_tasks_for_order(order)
        return Response(_order_to_dict(order), status=status.HTTP_201_CREATED)
