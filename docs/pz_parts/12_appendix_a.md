# ПРИЛОЖЕНИЕ А
## Листинги ключевых модулей серверной части

### А.1 Модуль моделей данных (workshop/models.py)

Листинг А.1 — Базовый абстрактный класс и модель товара

```python
from django.contrib.auth.models import User
from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Product(TimestampedModel):
    class Status(models.TextChoices):
        READY    = "В наличии",          "В наличии"
        CUSTOM   = "Изготовим на заказ", "Изготовим на заказ"
        ARCHIVED = "Снят с производства","Снят с производства"

    slug             = models.SlugField(unique=True)
    name             = models.CharField(max_length=255)
    subtitle         = models.CharField(max_length=255)
    status           = models.CharField(max_length=32, choices=Status.choices)
    category         = models.CharField(max_length=128)
    era              = models.CharField(max_length=64)
    material         = models.CharField(max_length=128)
    sizes            = models.JSONField(default=list)
    price_from       = models.PositiveIntegerField()
    lead_time        = models.CharField(max_length=64)
    weight           = models.CharField(max_length=64)
    popularity       = models.PositiveIntegerField(default=0)
    protection_class = models.CharField(max_length=64)
    history          = models.TextField()
    description      = models.JSONField(default=list)
    image            = models.URLField(max_length=1000)
    gallery          = models.JSONField(default=list)
    badge            = models.CharField(max_length=64, blank=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="+"
    )
    updated_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
```

Листинг А.2 — Модели заказа и задачи

```python
class Order(TimestampedModel):
    class Status(models.TextChoices):
        NEW         = "Новый",    "Новый"
        IN_PROGRESS = "В работе", "В работе"
        DONE        = "Выполнен", "Выполнен"
        CANCELLED   = "Отменён",  "Отменён"

    client       = models.ForeignKey("Client", null=True, blank=True,
                       on_delete=models.SET_NULL, related_name="orders")
    client_name  = models.CharField(max_length=255)
    product_name = models.CharField(max_length=255, blank=True)
    product      = models.ForeignKey("Product", null=True, blank=True,
                       on_delete=models.SET_NULL, related_name="orders")
    configuration = models.TextField(blank=True)
    status       = models.CharField(max_length=32, choices=Status.choices,
                       default=Status.NEW, db_index=True)
    deadline     = models.DateField(null=True, blank=True, db_index=True)
    total        = models.PositiveIntegerField(default=0)
    advance      = models.PositiveIntegerField(default=0)
    notes        = models.TextField(blank=True)
    assigned_to  = models.ForeignKey(User, null=True, blank=True,
                       on_delete=models.SET_NULL, related_name='assigned_orders')
    order_type   = models.CharField(
        max_length=16,
        choices=[('product','Предмет'),('set','Комплект'),('service','Услуга')],
        default='product',
    )
    product_set = models.ForeignKey(
        'ProductSet', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='orders'
    )

    class Meta:
        ordering = ["-created_at"]


class Task(TimestampedModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Ожидает'
        TAKEN   = 'taken',   'Взята'
        DONE    = 'done',    'Выполнена'

    order        = models.ForeignKey(Order, on_delete=models.CASCADE,
                       related_name='tasks')
    product      = models.ForeignKey(Product, null=True, blank=True,
                       on_delete=models.SET_NULL, related_name='tasks')
    product_name = models.CharField(max_length=255, blank=True)
    status       = models.CharField(max_length=20, choices=Status.choices,
                       default=Status.PENDING, db_index=True)
    assigned_to  = models.ForeignKey(User, null=True, blank=True,
                       on_delete=models.SET_NULL, related_name='tasks')
    notes        = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']


class MasterApproval(models.Model):
    master  = models.ForeignKey(User, on_delete=models.CASCADE,
                  related_name='approvals')
    product = models.ForeignKey(Product, on_delete=models.CASCADE,
                  related_name='approved_masters')

    class Meta:
        unique_together = ('master', 'product')
```

### А.2 Сериализаторы (workshop/serializers.py)

Листинг А.3 — Сериализаторы товара и отзыва

```python
from rest_framework import serializers
from .models import IntegrationLink, Product, Review


class ReviewSerializer(serializers.ModelSerializer):
    date   = serializers.CharField(source="review_date", read_only=True)
    photos = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = ("id", "author", "text", "date",
                  "review_date", "vk_url", "photos")

    def get_photos(self, obj) -> list:
        urls = list(obj.photos) if obj.photos else []
        if obj.photo_url and obj.photo_url not in urls:
            urls.insert(0, obj.photo_url)
        return urls


class ProductSerializer(serializers.ModelSerializer):
    id              = serializers.CharField()
    priceFrom       = serializers.IntegerField(source="price_from")
    leadTime        = serializers.CharField(source="lead_time")
    protectionClass = serializers.CharField(source="protection_class")
    createdBy       = serializers.SerializerMethodField()
    updatedBy       = serializers.SerializerMethodField()
    setDiscounts    = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = (
            "id", "slug", "name", "subtitle", "status",
            "category", "era", "material", "sizes",
            "priceFrom", "leadTime", "weight", "popularity",
            "protectionClass", "history", "description",
            "image", "gallery", "badge",
            "createdBy", "updatedBy",
            "created_at", "updated_at", "setDiscounts",
        )

    def get_createdBy(self, obj):
        return (obj.created_by.get_full_name() or obj.created_by.username
                if obj.created_by else None)

    def get_updatedBy(self, obj):
        return (obj.updated_by.get_full_name() or obj.updated_by.username
                if obj.updated_by else None)

    def get_setDiscounts(self, obj) -> list:
        result = []
        for ps in obj.product_sets.all():
            products = list(ps.products.all())
            price_individual = sum(p.price_from for p in products)
            if ps.price_from:
                discount_pct = (
                    round((price_individual - ps.price_from)
                          / price_individual * 100)
                    if price_individual else 0
                )
            elif ps.discount_percent is not None:
                discount_pct = ps.discount_percent
            else:
                discount_pct = 0
            result.append({
                'slug':             ps.slug,
                'name':             ps.name,
                'discount_percent': discount_pct,
            })
        return result
```

### А.3 Ключевые представления (workshop/views.py)

Листинг А.4 — Представление начальной загрузки BootstrapView

```python
class BootstrapView(APIView):
    def get(self, request):
        try:
            page      = max(int(request.query_params.get("page", 1)), 1)
            page_size = min(
                max(int(request.query_params.get("pageSize", 200)), 1),
                200
            )
        except (ValueError, TypeError):
            page, page_size = 1, 200

        offset      = (page - 1) * page_size
        all_products = Product.objects.prefetch_related(
            'product_sets__products'
        ).all()
        total        = all_products.count()
        products_qs  = all_products[offset:offset + page_size]

        links = {
            item["key"]: item["url"]
            for item in IntegrationLinkSerializer(
                IntegrationLink.objects.all(), many=True
            ).data
        }

        payload = {
            "products": ProductSerializer(products_qs, many=True).data,
            "total":    total,
            "page":     page,
            "hasNext":  (offset + page_size) < total,
            "reviews":  ReviewSerializer(
                            Review.objects.all(), many=True
                        ).data,
            "links": {
                "telegramOrder":  links.get("telegram_order",
                                            settings.TELEGRAM_PUBLIC_URL),
                "telegramPublic": links.get("telegram_public",
                                            settings.TELEGRAM_PUBLIC_URL),
                "vkCommunity":    links.get("vk_community",
                                            settings.VK_COMMUNITY_URL),
                "vkMessages":     links.get("vk_messages",
                                            settings.VK_MESSAGES_URL),
            },
        }
        return Response(payload)
```

Листинг А.5 — Представление авторизации

```python
class AuthView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response(
                {"detail": "Неверный логин или пароль."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        login(request, user)
        _get_csrf_token(request._request)
        return Response({
            "id":          user.id,
            "username":    user.username,
            "fullName":    user.get_full_name() or user.username,
            "isStaff":     user.is_staff,
            "isSuperuser": user.is_superuser,
        })
```

Листинг А.6 — Функция автоматического пересчёта статуса заказа

```python
def _sync_order_status(order: Order):
    tasks    = list(order.tasks.all())
    if not tasks:
        return
    all_done  = all(t.status == Task.Status.DONE  for t in tasks)
    any_taken = any(t.status == Task.Status.TAKEN  for t in tasks)
    any_done  = any(t.status == Task.Status.DONE   for t in tasks)

    if all_done:
        new_status = Order.Status.DONE
    elif any_taken or any_done:
        new_status = Order.Status.IN_PROGRESS
    else:
        new_status = Order.Status.NEW

    if (order.status != new_status
            and order.status not in (Order.Status.DONE,
                                     Order.Status.CANCELLED)):
        order.status = new_status
        order.save(update_fields=['status'])
```

Листинг А.7 — Представление управления задачами WorkshopTaskDetailView

```python
class WorkshopTaskDetailView(APIView):
    def patch(self, request, task_id):
        if not _is_staff(request):
            return Response(
                {"detail": "Требуется авторизация."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        task = Task.objects.select_related(
            'order', 'product', 'assigned_to'
        ).filter(pk=task_id).first()
        if not task:
            return Response(
                {"detail": "Задача не найдена."},
                status=status.HTTP_404_NOT_FOUND
            )
        action = request.data.get('action')

        if action == 'take':
            if task.status != Task.Status.PENDING:
                return Response(
                    {"detail": "Задача уже взята."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if task.product is not None and not request.user.is_superuser:
                approved = MasterApproval.objects.filter(
                    master=request.user, product=task.product
                ).exists()
                if not approved:
                    return Response(
                        {"detail": "Нет допуска к этому предмету."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            task.status      = Task.Status.TAKEN
            task.assigned_to = request.user
            task.save()
            _sync_order_status(task.order)

        elif action == 'done':
            if (task.assigned_to != request.user
                    and not request.user.is_superuser):
                return Response(
                    {"detail": "Нельзя закрыть чужую задачу."},
                    status=status.HTTP_403_FORBIDDEN
                )
            task.status = Task.Status.DONE
            task.save()
            _sync_order_status(task.order)

        elif action == 'release':
            if (task.assigned_to == request.user
                    or request.user.is_superuser):
                task.status      = Task.Status.PENDING
                task.assigned_to = None
                task.save()
                _sync_order_status(task.order)

        else:
            if 'notes' in request.data:
                task.notes = request.data['notes']
                task.save()

        return Response(_task_to_dict(task))
```

### А.4 Сервис парсинга постов ВКонтакте (workshop/services/vk.py)

Листинг А.8 — Функции парсинга поста ВКонтакте

```python
import re


def _largest_photo_url(photo: dict) -> str:
    sizes = photo.get("sizes", [])
    if not sizes:
        return ""
    best = max(sizes, key=lambda s: s.get("width", 0) * s.get("height", 0))
    return best.get("url", "")


def _clean_text(text: str) -> str:
    text = re.sub(r'\[(?:id|club|public)\d+\|([^\]]+)\]', r'\1', text)
    text = re.sub(r'\[[^\]]{1,64}\]', '', text)
    return text.strip()


def parse_post(post: dict) -> tuple[str, list[str]]:
    """Вернуть (текст, список URL фотографий) для объекта поста VK."""
    text   = _clean_text(post.get("text", ""))
    photos: list[str] = []

    for att in post.get("attachments", []):
        if att.get("type") == "photo":
            url = _largest_photo_url(att["photo"])
            if url:
                photos.append(url)
        elif att.get("type") == "link":
            link_url = att["link"].get("url", "")
            title    = att["link"].get("title", "")
            if link_url and link_url not in text:
                text = (f"{text}\n"
                        f"{title + ': ' if title else ''}{link_url}").strip()

    owner_id = post.get("owner_id", "")
    post_id  = post.get("id", "")
    if owner_id and post_id:
        vk_url = f"https://vk.com/wall{owner_id}_{post_id}"
        text   = f"{text}\n\n🔗 {vk_url}".strip()

    limit = 1024 if photos else 4096
    if len(text) > limit:
        text = text[: limit - 3] + "..."

    return text, photos
```
