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


class Client(TimestampedModel):
    class Source(models.TextChoices):
        TELEGRAM = "Telegram", "Telegram"
        VK = "VK", "VK"

    name = models.CharField(max_length=255)
    source = models.CharField(max_length=32, choices=Source.choices)
    handle = models.CharField(max_length=255, blank=True)
    contact = models.CharField(max_length=255, blank=True)
    external_id = models.CharField(max_length=128, blank=True)
    last_message = models.TextField(blank=True)
    last_time = models.CharField(max_length=64, blank=True)
    unread = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["name"]


class Order(TimestampedModel):
    class Status(models.TextChoices):
        NEW = "Новый", "Новый"
        CONFIRMED = "Подтверждён", "Подтверждён"
        PRODUCTION = "В производстве", "В производстве"
        READY = "Готов", "Готов"
        DELIVERED = "Доставлен", "Доставлен"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="orders")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.NEW)
    total_cost = models.PositiveIntegerField(default=0)
    due_date = models.DateField(null=True, blank=True)
    items = models.JSONField(default=list)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]


class Message(TimestampedModel):
    class Direction(models.TextChoices):
        CLIENT = "client", "client"
        MANAGER = "manager", "manager"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="messages")
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name="messages")
    direction = models.CharField(max_length=16, choices=Direction.choices)
    text = models.TextField()
    external_message_id = models.CharField(max_length=128, blank=True)
    sent_at_label = models.CharField(max_length=64, blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]


class MaterialReference(TimestampedModel):
    name = models.CharField(max_length=128, unique=True)
    unit_price = models.CharField(max_length=64)
    stock = models.CharField(max_length=64)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]


class FinanceCalculation(TimestampedModel):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="calculations")
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name="calculations")
    calculation_date = models.CharField(max_length=64)
    product_name = models.CharField(max_length=255)
    material = models.CharField(max_length=128)
    weight = models.CharField(max_length=64)
    hours = models.CharField(max_length=64)
    cost = models.CharField(max_length=64)
    markup = models.CharField(max_length=64)
    total = models.CharField(max_length=64)

    class Meta:
        ordering = ["-created_at"]


class MarketingPublication(TimestampedModel):
    class Status(models.TextChoices):
        DRAFT = "Черновик", "Черновик"
        SCHEDULED = "Запланирован", "Запланирован"
        PUBLISHED = "Опубликован", "Опубликован"
        ERROR = "Ошибка", "Ошибка"

    title = models.CharField(max_length=255)
    day = models.CharField(max_length=16)
    month_label = models.CharField(max_length=64)
    text = models.TextField()
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="publications")
    channels = models.JSONField(default=list)
    publish_time = models.CharField(max_length=32)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.DRAFT)
    color_class = models.CharField(max_length=64, blank=True)
    published_url = models.URLField(max_length=1000, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]


class IntegrationLink(TimestampedModel):
    key = models.CharField(max_length=64, unique=True)
    label = models.CharField(max_length=128)
    url = models.URLField(max_length=1000)

    class Meta:
        ordering = ["key"]
