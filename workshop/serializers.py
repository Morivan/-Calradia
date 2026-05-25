from rest_framework import serializers

from .models import IntegrationLink, Product, Review


class ReviewSerializer(serializers.ModelSerializer):
    date = serializers.CharField(source="review_date", read_only=True)
    photos = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ("id", "text", "date", "review_date", "vk_url", "photos")

    def get_photos(self, obj) -> list:
        """Return merged list: photos JSONField + legacy photo_url."""
        urls = list(obj.photos) if obj.photos else []
        if obj.photo_url and obj.photo_url not in urls:
            urls.insert(0, obj.photo_url)
        return urls


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    priceFrom = serializers.IntegerField(source="price_from")
    leadTime = serializers.CharField(source="lead_time")
    protectionClass = serializers.CharField(source="protection_class")
    createdBy = serializers.SerializerMethodField()
    updatedBy = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "name",
            "subtitle",
            "status",
            "category",
            "era",
            "material",
            "sizes",
            "priceFrom",
            "leadTime",
            "weight",
            "popularity",
            "protectionClass",
            "history",
            "description",
            "image",
            "gallery",
            "badge",
            "createdBy",
            "updatedBy",
            "created_at",
            "updated_at",
        )

    def get_createdBy(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username if obj.created_by else None

    def get_updatedBy(self, obj):
        return obj.updated_by.get_full_name() or obj.updated_by.username if obj.updated_by else None


class IntegrationLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationLink
        fields = ("key", "label", "url")
