from collections import defaultdict
from uuid import uuid4
import logging

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Client, Colleague, IntegrationLink, Material, Order, Product, Review
from .serializers import IntegrationLinkSerializer, ProductSerializer, ReviewSerializer
from .services.telegram import TelegramConfigError, repost_to_channel, store_update
from .services.vk import parse_post
from .services.yandex_disk import YandexDiskError, append_row

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

        reviews_by_product = defaultdict(list)
        for review in Review.objects.filter(product_id__in=product_ids).select_related("product"):
            reviews_by_product[str(review.product_id)].append(ReviewSerializer(review).data)

        links = {
            item["key"]: item["url"]
            for item in IntegrationLinkSerializer(IntegrationLink.objects.all(), many=True).data
        }

        payload = {
            "products": ProductSerializer(products_qs, many=True).data,
            "total": total,
            "page": page,
            "hasNext": (offset + page_size) < total,
            "reviewsByProduct": reviews_by_product,
            "links": {
                "telegramOrder": links.get("telegram_order", settings.TELEGRAM_PUBLIC_URL),
                "telegramPublic": links.get("telegram_public", settings.TELEGRAM_PUBLIC_URL),
                "vkCommunity": links.get("vk_community", settings.VK_COMMUNITY_URL),
                "vkMessages": links.get("vk_messages", settings.VK_MESSAGES_URL),
                "yandexForm": links.get("yandex_form", ""),
            },
        }
        return Response(payload)


class ReviewCreateView(APIView):
    def post(self, request, product_id: int):
        product = Product.objects.filter(pk=product_id).first()
        if not product:
            return Response({"detail": "Товар не найден."}, status=status.HTTP_404_NOT_FOUND)

        author = request.data.get("author", "").strip()
        if not author:
            return Response({"detail": "Поле author обязательно."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rating = int(request.data.get("rating", 5))
        except (ValueError, TypeError):
            rating = 5
        if not (1 <= rating <= 5):
            return Response({"detail": "Рейтинг должен быть от 1 до 5."}, status=status.HTTP_400_BAD_REQUEST)

        review = Review.objects.create(
            product=product,
            author=author,
            text=request.data.get("text", "").strip(),
            rating=rating,
            review_date=request.data.get("date") or timezone.localtime().strftime("%d.%m.%Y"),
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class ProductListCreateView(APIView):
    def get(self, request):
        return Response(ProductSerializer(Product.objects.all(), many=True).data)

    def post(self, request):
        if not request.user.is_authenticated:
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
        if not request.user.is_authenticated:
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
        if not request.user.is_authenticated:
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
        return Response({
            "id": user.id,
            "username": user.username,
            "fullName": user.get_full_name() or user.username,
            "isStaff": user.is_staff,
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
        })


def _check_webhook_token(request) -> bool:
    expected = settings.WEBHOOK_TOKEN
    if not expected:
        return True
    return request.query_params.get("token") == expected


class ClientWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not _check_webhook_token(request):
            return Response({"detail": "Неверный токен."}, status=status.HTTP_403_FORBIDDEN)
        client = Client.objects.create(
            name=request.data.get("name", "").strip(),
            vk_url=request.data.get("vk_url", "").strip(),
            status=request.data.get("status", Client.Status.POTENTIAL),
            notes=request.data.get("notes", "").strip(),
        )
        path = getattr(settings, "YANDEX_CLIENTS_TABLE_PATH", "")
        if path:
            try:
                from django.utils import timezone as tz
                append_row(path, [client.id, client.name, client.vk_url, client.status, client.notes, tz.localtime().strftime("%d.%m.%Y")])
            except Exception as exc:
                logger.error("Yandex Disk append error: %s", exc, exc_info=True)
        return Response({"ok": True, "id": client.id}, status=status.HTTP_201_CREATED)


class ClientWithOrderWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not _check_webhook_token(request):
            return Response({"detail": "Неверный токен."}, status=status.HTTP_403_FORBIDDEN)

        from datetime import datetime

        with transaction.atomic():
            client_id = request.data.get("client_id")
            client = Client.objects.filter(pk=client_id).first() if client_id else None
            if not client:
                client = Client.objects.create(
                    name=request.data.get("name", "").strip(),
                    vk_url=request.data.get("vk_url", "").strip(),
                    status=request.data.get("client_status", Client.Status.ACTIVE),
                    notes=request.data.get("notes", "").strip(),
                )

            result = {"ok": True, "client_id": client.id, "order_id": None}

            product = request.data.get("product", "").strip()
            if product:
                deadline_raw = request.data.get("deadline", "").strip()
                deadline = None
                for fmt in ("%d.%m.%Y", "%Y-%m-%d"):
                    try:
                        deadline = datetime.strptime(deadline_raw, fmt).date()
                        break
                    except (ValueError, TypeError):
                        pass
                order = Order.objects.create(
                    client=client,
                    client_name=client.name,
                    product_name=product,
                    configuration=request.data.get("configuration", "").strip(),
                    status=request.data.get("order_status", Order.Status.NEW),
                    deadline=deadline,
                    total=_parse_int(request.data.get("total")),
                    advance=_parse_int(request.data.get("advance")),
                    notes=request.data.get("order_notes", "").strip(),
                )
                result["order_id"] = order.id

        # Append new order row to Yandex Disk spreadsheet if configured
        orders_path = getattr(settings, "YANDEX_ORDERS_TABLE_PATH", "")
        if orders_path and result.get("order_id"):
            try:
                from django.utils import timezone as tz
                append_row(orders_path, [
                    result["order_id"],
                    result["client_id"],
                    client.name,
                    request.data.get("product", "").strip(),
                    request.data.get("configuration", "").strip(),
                    Order.Status.NEW,
                    "",
                    0,
                    0,
                    "",
                    tz.localtime().strftime("%d.%m.%Y"),
                ])
            except YandexDiskError:
                pass  # token not configured — skip silently
            except Exception as exc:
                logger.error("Yandex Disk append error: %s", exc, exc_info=True)

        return Response(result, status=status.HTTP_201_CREATED)


class OrderWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not _check_webhook_token(request):
            return Response({"detail": "Неверный токен."}, status=status.HTTP_403_FORBIDDEN)
        deadline_raw = request.data.get("deadline", "").strip()
        from datetime import datetime
        deadline = None
        for fmt in ("%d.%m.%Y", "%Y-%m-%d"):
            try:
                deadline = datetime.strptime(deadline_raw, fmt).date()
                break
            except (ValueError, TypeError):
                pass
        client_name = request.data.get("client_name", "").strip()
        client_id = request.data.get("client_id")
        client = Client.objects.filter(pk=client_id).first() if client_id else None
        if client and not client_name:
            client_name = client.name

        order = Order.objects.create(
            client=client,
            client_name=client_name,
            product_name=request.data.get("product", "").strip(),
            configuration=request.data.get("configuration", "").strip(),
            status=request.data.get("status", Order.Status.NEW),
            deadline=deadline,
            total=_parse_int(request.data.get("total")),
            advance=_parse_int(request.data.get("advance")),
            notes=request.data.get("notes", "").strip(),
        )
        return Response({"ok": True, "id": order.id}, status=status.HTTP_201_CREATED)


class MaterialWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not _check_webhook_token(request):
            return Response({"detail": "Неверный токен."}, status=status.HTTP_403_FORBIDDEN)
        material = Material.objects.create(
            name=request.data.get("name", "").strip(),
            type=request.data.get("type", Material.Type.MATERIAL),
            direction=request.data.get("direction", Material.Direction.IRON),
            unit=request.data.get("unit", "шт").strip(),
            price=request.data.get("price") or None,
            stock=request.data.get("stock", 0) or 0,
            min_stock=request.data.get("min_stock", 0) or 0,
            supplier=request.data.get("supplier", "").strip(),
            notes=request.data.get("notes", "").strip(),
        )
        path = getattr(settings, "YANDEX_MATERIALS_TABLE_PATH", "")
        if path:
            try:
                append_row(path, [
                    material.id, material.name, material.type, material.direction,
                    material.unit, float(material.price) if material.price else "",
                    float(material.stock), float(material.min_stock), material.supplier, material.notes,
                ])
            except Exception as exc:
                logger.error("Yandex Disk append error: %s", exc, exc_info=True)
        return Response({"ok": True, "id": material.id}, status=status.HTTP_201_CREATED)


class ColleagueWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not _check_webhook_token(request):
            return Response({"detail": "Неверный токен."}, status=status.HTTP_403_FORBIDDEN)
        colleague = Colleague.objects.create(
            name=request.data.get("name", "").strip(),
            direction=request.data.get("direction", Colleague.Direction.IRON),
            specialization=request.data.get("specialization", "").strip(),
            contact=request.data.get("contact", "").strip(),
        )
        path = getattr(settings, "YANDEX_COLLEAGUES_TABLE_PATH", "")
        if path:
            try:
                append_row(path, [colleague.id, colleague.name, colleague.direction, colleague.specialization, colleague.contact])
            except Exception as exc:
                logger.error("Yandex Disk append error: %s", exc, exc_info=True)
        return Response({"ok": True, "id": colleague.id}, status=status.HTTP_201_CREATED)


class TelegramWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
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
            return Response(token, content_type="text/plain")

        # Verify secret key
        if settings.VK_CALLBACK_SECRET and data.get("secret") != settings.VK_CALLBACK_SECRET:
            return Response({"detail": "Неверный секретный ключ."}, status=status.HTTP_403_FORBIDDEN)

        event_type = data.get("type")

        if event_type == "wall_post_new":
            post = data.get("object", {})

            # Skip reposts (copy_history present means it's a repost, not original)
            if post.get("copy_history"):
                return Response("ok")

            # Skip postponed posts that aren't published yet
            if post.get("post_type") == "postpone":
                return Response("ok")

            channel_id = settings.TELEGRAM_CHANNEL_ID
            if not channel_id:
                return Response("ok")

            text, photos = parse_post(post)

            if not text and not photos:
                return Response("ok")

            try:
                repost_to_channel(channel_id, text, photos)
            except TelegramConfigError:
                pass  # Bot not configured — silently skip, VK still gets "ok"
            except Exception as exc:
                logger.error("VK→TG repost error: %s", exc, exc_info=True)

        # VK expects plain "ok" for all handled events
        return Response("ok")
