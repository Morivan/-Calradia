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
