from django.contrib import admin

from .models import IntegrationLink, Product, Review


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
