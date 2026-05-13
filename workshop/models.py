from django.contrib.auth.models import User
from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Product(TimestampedModel):
    class Status(models.TextChoices):
        READY = "Готовый комплект", "Готовый комплект"
        CUSTOM = "Под заказ", "Под заказ"
        REPLICA = "Реконструкция", "Реконструкция"

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255)
    status = models.CharField(max_length=32, choices=Status.choices)
    category = models.CharField(max_length=128)
    era = models.CharField(max_length=64)
    material = models.CharField(max_length=128)
    sizes = models.JSONField(default=list)
    price_from = models.PositiveIntegerField()
    lead_time = models.CharField(max_length=64)
    weight = models.CharField(max_length=64)
    popularity = models.PositiveIntegerField(default=0)
    protection_class = models.CharField(max_length=64)
    history = models.TextField()
    description = models.JSONField(default=list)
    image = models.URLField(max_length=1000)
    gallery = models.JSONField(default=list)
    badge = models.CharField(max_length=64, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Review(TimestampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    author = models.CharField(max_length=128)
    text = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5)
    review_date = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ["-created_at"]


class IntegrationLink(TimestampedModel):
    key = models.CharField(max_length=64, unique=True)
    label = models.CharField(max_length=128)
    url = models.URLField(max_length=1000)

    class Meta:
        ordering = ["key"]


class Client(TimestampedModel):
    class Status(models.TextChoices):
        POTENTIAL = "Потенциальный", "Потенциальный"
        ACTIVE = "Действующий", "Действующий"
        COMPLETED = "Завершён", "Завершён"

    name = models.CharField(max_length=255)
    vk_url = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.POTENTIAL)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name


class Order(TimestampedModel):
    class Status(models.TextChoices):
        NEW = "Новый", "Новый"
        IN_PROGRESS = "В работе", "В работе"
        DONE = "Выполнен", "Выполнен"
        CANCELLED = "Отменён", "Отменён"

    client = models.ForeignKey("Client", null=True, blank=True, on_delete=models.SET_NULL, related_name="orders")
    client_name = models.CharField(max_length=255)
    product = models.CharField(max_length=255)
    configuration = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.NEW)
    deadline = models.DateField(null=True, blank=True)
    total = models.PositiveIntegerField(default=0)
    advance = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.client_name} — {self.product}"


class Material(TimestampedModel):
    class Type(models.TextChoices):
        MATERIAL = "Материал", "Материал"
        CONSUMABLE = "Расходник", "Расходник"

    class Direction(models.TextChoices):
        WOOD = "Дерево", "Дерево"
        LIMBS = "Плечи", "Плечи"
        IRON = "Железо", "Железо"
        ARMOR = "Броня", "Броня"

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=32, choices=Type.choices)
    direction = models.CharField(max_length=32, choices=Direction.choices)
    unit = models.CharField(max_length=32)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    supplier = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["direction", "name"]

    def __str__(self) -> str:
        return self.name


class Colleague(TimestampedModel):
    class Direction(models.TextChoices):
        WOOD = "Дерево", "Дерево"
        LIMBS = "Плечи", "Плечи"
        IRON = "Железо", "Железо"
        ARMOR = "Броня", "Броня"

    name = models.CharField(max_length=255)
    direction = models.CharField(max_length=32, choices=Direction.choices)
    specialization = models.CharField(max_length=255)
    contact = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["direction", "name"]

    def __str__(self) -> str:
        return self.name
