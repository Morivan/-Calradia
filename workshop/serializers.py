from rest_framework import serializers

from .models import IntegrationLink, Product, Review


class ReviewSerializer(serializers.ModelSerializer):
    date = serializers.CharField(source="review_date", read_only=True)

    class Meta:
        model = Review
        fields = ("id", "author", "text", "rating", "date")


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
