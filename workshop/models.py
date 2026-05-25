from django.contrib.auth.models import User
from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Product(TimestampedModel):
    class Status(models.TextChoices):
        READY = "В наличии", "В наличии"
        CUSTOM = "Изготовим на заказ", "Изготовим на заказ"
        ARCHIVED = "Снят с производства", "Снят с производства"

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
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews")
    author = models.CharField(max_length=128)
    text = models.TextField()
    review_date = models.CharField(max_length=64, blank=True)
    vk_url = models.CharField(max_length=512, blank=True)
    photo_url = models.CharField(max_length=1024, blank=True)

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
    product_name = models.CharField(max_length=255, blank=True)
    product = models.ForeignKey("Product", null=True, blank=True, on_delete=models.SET_NULL, related_name="orders")
    configuration = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.NEW)
    deadline = models.DateField(null=True, blank=True)
    total = models.PositiveIntegerField(default=0)
    advance = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_orders', verbose_name="Ответственный")
    client_vk = models.CharField(max_length=255, blank=True)
    order_type = models.CharField(
        max_length=16,
        choices=[('product', 'Предмет'), ('set', 'Комплект'), ('service', 'Услуга')],
        default='product',
    )
    product_set = models.ForeignKey(
        'ProductSet', null=True, blank=True, on_delete=models.SET_NULL, related_name='orders'
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        product_display = self.product_name or (self.product.name if self.product else "—")
        return f"{self.client_name} — {product_display}"



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


class ProductSet(TimestampedModel):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    image = models.URLField(max_length=1000, blank=True)
    gallery = models.JSONField(default=list)
    products = models.ManyToManyField(Product, blank=True, related_name='product_sets')
    price_from = models.PositiveIntegerField(null=True, blank=True)
    badge = models.CharField(max_length=64, blank=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='+')
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='+')

    class Meta:
        ordering = ['name']
        verbose_name = 'Комплект'
        verbose_name_plural = 'Комплекты'

    def price_individual(self):
        return sum(p.price_from for p in self.products.all())

    def price_from_total(self):
        return self.price_from if self.price_from else self.price_individual()

    def __str__(self):
        return self.name


class MasterApproval(models.Model):
    master = models.ForeignKey(User, on_delete=models.CASCADE, related_name='approvals')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='approved_masters')

    class Meta:
        unique_together = ('master', 'product')
        verbose_name = 'Допуск мастера'
        verbose_name_plural = 'Допуски мастеров'

    def __str__(self):
        return f"{self.master} → {self.product}"


class Task(TimestampedModel):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Ожидает'
        TAKEN = 'taken', 'Взята'
        DONE = 'done', 'Выполнена'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='tasks')
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks')
    product_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks')
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'

    def __str__(self):
        name = self.product_name or (self.product.name if self.product else '—')
        return f"#{self.id}: {name}"


class VKPost(models.Model):
    post_id = models.BigIntegerField(unique=True)
    owner_id = models.BigIntegerField()
    text = models.TextField(blank=True)
    photo_url = models.URLField(blank=True)
    posted_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-posted_at']
