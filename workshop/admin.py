from django.contrib import admin

from .models import (
    Client,
    FinanceCalculation,
    IntegrationLink,
    MarketingPublication,
    MaterialReference,
    Message,
    Order,
    Product,
    Review,
)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "material", "status", "price_from")
    search_fields = ("name", "subtitle", "category", "material")
    list_filter = ("status", "category", "material", "era")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "author", "rating", "review_date")
    search_fields = ("author", "text", "product__name")


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "source", "handle", "unread")
    search_fields = ("name", "handle", "contact")
    list_filter = ("source",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "client", "product", "status", "total_cost", "due_date")
    list_filter = ("status",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("client", "direction", "sent_at_label", "is_read")
    search_fields = ("client__name", "text")
    list_filter = ("direction", "is_read")


@admin.register(MaterialReference)
class MaterialReferenceAdmin(admin.ModelAdmin):
    list_display = ("name", "unit_price", "stock")


@admin.register(FinanceCalculation)
class FinanceCalculationAdmin(admin.ModelAdmin):
    list_display = ("product_name", "material", "cost", "markup", "total", "calculation_date")


@admin.register(MarketingPublication)
class MarketingPublicationAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "publish_time")
    list_filter = ("status",)


@admin.register(IntegrationLink)
class IntegrationLinkAdmin(admin.ModelAdmin):
    list_display = ("label", "url")
