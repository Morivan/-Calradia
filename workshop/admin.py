from django.contrib import admin

from .models import Client, Colleague, IntegrationLink, Material, Order, Product, Review


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "material", "status", "price_from", "created_by", "updated_by")
    search_fields = ("name", "subtitle", "category", "material")
    list_filter = ("status", "category", "material", "era")
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "author", "rating", "review_date")
    search_fields = ("author", "text", "product__name")


@admin.register(IntegrationLink)
class IntegrationLinkAdmin(admin.ModelAdmin):
    list_display = ("key", "label", "url")


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "vk_url", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "notes")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("client_name", "product", "status", "total", "advance", "deadline", "created_at")
    list_filter = ("status",)
    search_fields = ("client_name", "product", "notes")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "direction", "unit", "price", "stock", "min_stock")
    list_filter = ("type", "direction")
    search_fields = ("name", "supplier")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Colleague)
class ColleagueAdmin(admin.ModelAdmin):
    list_display = ("name", "direction", "specialization", "contact")
    list_filter = ("direction",)
    search_fields = ("name", "specialization")
    readonly_fields = ("created_at", "updated_at")
