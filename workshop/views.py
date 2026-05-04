from collections import defaultdict
from uuid import uuid4

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import IntegrationLink, Product, Review
from .serializers import IntegrationLinkSerializer, ProductSerializer, ReviewSerializer
from .services.telegram import TelegramConfigError, store_update

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
        reviews_by_product = defaultdict(list)
        for review in Review.objects.select_related("product").all():
            reviews_by_product[str(review.product_id)].append(ReviewSerializer(review).data)

        links = {
            item["key"]: item["url"]
            for item in IntegrationLinkSerializer(IntegrationLink.objects.all(), many=True).data
        }

        payload = {
            "products": ProductSerializer(Product.objects.all(), many=True).data,
            "reviewsByProduct": reviews_by_product,
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
            author=request.data.get("author", "").strip(),
            text=request.data.get("text", "").strip(),
            rating=int(request.data.get("rating", 5)),
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


class TelegramWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        client = store_update(request.data)
        return Response({"ok": True, "client": client.id if client else None})
