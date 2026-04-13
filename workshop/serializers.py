from rest_framework import serializers

from .models import Client, FinanceCalculation, IntegrationLink, MarketingPublication, MaterialReference, Product, Review


class ReviewSerializer(serializers.ModelSerializer):
    date = serializers.CharField(source="review_date", read_only=True)

    class Meta:
        model = Review
        fields = ("author", "text", "rating", "date")


class ProductSerializer(serializers.ModelSerializer):
    priceFrom = serializers.IntegerField(source="price_from")
    leadTime = serializers.CharField(source="lead_time")
    protectionClass = serializers.CharField(source="protection_class")

    class Meta:
        model = Product
        fields = (
            "id",
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
        )


class MaterialReferenceSerializer(serializers.ModelSerializer):
    unitPrice = serializers.CharField(source="unit_price")

    class Meta:
        model = MaterialReference
        fields = ("name", "unitPrice", "stock", "note")


class FinanceCalculationSerializer(serializers.ModelSerializer):
    date = serializers.CharField(source="calculation_date")
    product = serializers.CharField(source="product_name")

    class Meta:
        model = FinanceCalculation
        fields = ("date", "product", "material", "weight", "hours", "cost", "markup", "total")


class ClientSerializer(serializers.ModelSerializer):
    orderHistory = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()
    lastMessage = serializers.CharField(source="last_message")
    lastTime = serializers.CharField(source="last_time")

    class Meta:
        model = Client
        fields = (
            "id",
            "name",
            "source",
            "handle",
            "contact",
            "lastMessage",
            "lastTime",
            "unread",
            "orderHistory",
            "messages",
        )

    def get_orderHistory(self, obj):
        return [
            f"{order.product.name if order.product else 'Индивидуальный заказ'}, {order.created_at.strftime('%m.%Y')}"
            for order in obj.orders.all()[:5]
        ]

    def get_messages(self, obj):
        return [
            {
                "from": message.direction,
                "text": message.text,
                "time": message.sent_at_label or message.created_at.strftime("%H:%M"),
            }
            for message in obj.messages.all()
        ]


class MarketingPublicationSerializer(serializers.ModelSerializer):
    monthLabel = serializers.CharField(source="month_label")
    product = serializers.SerializerMethodField()
    time = serializers.CharField(source="publish_time")
    colorClass = serializers.CharField(source="color_class")

    class Meta:
        model = MarketingPublication
        fields = ("id", "day", "monthLabel", "title", "text", "product", "channels", "time", "status", "colorClass")

    def get_product(self, obj):
        return obj.product.name if obj.product else "Каталог"


class IntegrationLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationLink
        fields = ("key", "label", "url")
