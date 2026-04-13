from collections import defaultdict

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Client, FinanceCalculation, IntegrationLink, MarketingPublication, MaterialReference, Message, Order, Product, Review
from .serializers import ClientSerializer, FinanceCalculationSerializer, IntegrationLinkSerializer, MarketingPublicationSerializer, MaterialReferenceSerializer, ProductSerializer, ReviewSerializer
from .services.google_sheets import fetch_csv_rows
from .services.marketing import send_publication_to_telegram
from .services.telegram import TelegramConfigError, send_message, store_update


def _normalize_header(value: str) -> str:
    return value.strip().lower().replace("ё", "е")


def _row_to_dict(headers: list[str], row: list[str]) -> dict[str, str]:
    return {_normalize_header(header): row[index] if index < len(row) else "" for index, header in enumerate(headers)}


class BootstrapView(APIView):
    def get(self, request):
        reviews_by_product = defaultdict(list)
        for review in Review.objects.select_related("product").all():
            reviews_by_product[str(review.product_id)].append(ReviewSerializer(review).data)

        links = {
            item["key"]: item["url"]
            for item in IntegrationLinkSerializer(IntegrationLink.objects.all(), many=True).data
        }

        payload = {
            "products": ProductSerializer(Product.objects.all(), many=True).data,
            "reviewsByProduct": reviews_by_product,
            "materials": MaterialReferenceSerializer(MaterialReference.objects.all(), many=True).data,
            "financeHistory": FinanceCalculationSerializer(FinanceCalculation.objects.all(), many=True).data,
            "marketingPosts": MarketingPublicationSerializer(MarketingPublication.objects.all(), many=True).data,
            "crmClients": ClientSerializer(
                Client.objects.all().prefetch_related("messages", "orders__product"),
                many=True,
            ).data,
            "links": {
                "telegramOrder": links.get("telegram_order", settings.TELEGRAM_PUBLIC_URL),
                "telegramPublic": links.get("telegram_public", settings.TELEGRAM_PUBLIC_URL),
                "vkCommunity": links.get("vk_community", settings.VK_COMMUNITY_URL),
                "vkMessages": links.get("vk_messages", settings.VK_MESSAGES_URL),
                "googleSheets": links.get("google_sheets", settings.GOOGLE_SHEETS_URL),
            },
        }
        return Response(payload)


class ReviewCreateView(APIView):
    def post(self, request, product_id: int):
        product = Product.objects.filter(pk=product_id).first()
        if not product:
            return Response({"detail": "Товар не найден."}, status=status.HTTP_404_NOT_FOUND)

        review = Review.objects.create(
            product=product,
            author=request.data.get("author", "").strip(),
            text=request.data.get("text", "").strip(),
            rating=int(request.data.get("rating", 5)),
            review_date=request.data.get("date") or timezone.localtime().strftime("%d.%m.%Y"),
        )
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class FinanceGoogleSheetsSyncView(APIView):
    @transaction.atomic
    def post(self, request):
        sheet_url = request.data.get("sheetUrl", "").strip()
        materials_sheet = request.data.get("materialsSheet", "Справочник материалов").strip()
        history_sheet = request.data.get("historySheet", "История расчётов").strip()
        if not sheet_url:
            return Response({"detail": "Не передана ссылка на Google Sheets."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            materials_rows = fetch_csv_rows(sheet_url, materials_sheet)
            history_rows = fetch_csv_rows(sheet_url, history_sheet)
        except Exception as exc:
            return Response(
                {
                    "detail": (
                        "Не удалось прочитать Google Sheets. Проверьте, что таблица доступна по ссылке "
                        "или опубликована для чтения, а имена листов указаны верно."
                    ),
                    "error": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        materials_synced = False
        history_synced = False

        if len(materials_rows) >= 2:
            material_headers = materials_rows[0]
            MaterialReference.objects.all().delete()
            for row in materials_rows[1:]:
                values = _row_to_dict(material_headers, row)
                MaterialReference.objects.create(
                    name=values.get("название материала") or values.get("материал") or values.get("name") or "Материал",
                    unit_price=values.get("цена за единицу") or values.get("цена") or values.get("unit_price") or "-",
                    stock=values.get("текущий остаток на складе") or values.get("остаток") or values.get("stock") or "-",
                    note=values.get("примечание") or values.get("note") or values.get("единица измерения") or "",
                )
            materials_synced = True

        if len(history_rows) >= 2:
            history_headers = history_rows[0]
            FinanceCalculation.objects.all().delete()
            for row in history_rows[1:]:
                values = _row_to_dict(history_headers, row)
                FinanceCalculation.objects.create(
                    calculation_date=values.get("дата расчета") or values.get("дата") or values.get("date") or "",
                    product_name=values.get("товар") or values.get("изделие") or values.get("product") or "",
                    material=values.get("материал") or "",
                    weight=values.get("вес") or values.get("количество материала") or values.get("weight") or "",
                    hours=values.get("часы") or values.get("трудозатраты") or values.get("hours") or "",
                    cost=values.get("себестоимость") or values.get("cost") or "",
                    markup=values.get("наценка") or values.get("процент наценки") or values.get("markup") or "",
                    total=values.get("итоговая цена") or values.get("итог") or values.get("total") or "",
                )
            history_synced = True

        if not materials_synced and not history_synced:
            return Response(
                {"detail": "В таблице недостаточно данных для синхронизации."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        IntegrationLink.objects.update_or_create(
            key="google_sheets",
            defaults={"label": "Google Sheets", "url": sheet_url},
        )

        return Response(
            {
                "synced": {
                    "materials": materials_synced,
                    "history": history_synced,
                },
                "materials": MaterialReferenceSerializer(MaterialReference.objects.all(), many=True).data,
                "financeHistory": FinanceCalculationSerializer(FinanceCalculation.objects.all(), many=True).data,
            }
        )


class ClientReplyView(APIView):
    def post(self, request, client_id: int):
        client = Client.objects.filter(pk=client_id).first()
        if not client:
            return Response({"detail": "Клиент не найден."}, status=status.HTTP_404_NOT_FOUND)

        text = request.data.get("text", "").strip()
        if not text:
            return Response({"detail": "Текст сообщения пуст."}, status=status.HTTP_400_BAD_REQUEST)

        if client.source == Client.Source.TELEGRAM and client.external_id and not client.external_id.startswith("demo_"):
            try:
                send_message(client.external_id, text)
            except TelegramConfigError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as exc:
                return Response({"detail": f"Не удалось отправить сообщение: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        message = Message.objects.create(
            client=client,
            direction=Message.Direction.MANAGER,
            text=text,
            sent_at_label=timezone.localtime().strftime("%H:%M"),
            is_read=True,
        )
        client.last_message = text
        client.last_time = message.sent_at_label
        client.unread = 0
        client.save(update_fields=["last_message", "last_time", "unread"])
        return Response({"ok": True})


class OrderCreateView(APIView):
    def post(self, request):
        client = Client.objects.filter(pk=request.data.get("clientId")).first()
        if not client:
            return Response({"detail": "Клиент не найден."}, status=status.HTTP_400_BAD_REQUEST)

        product = Product.objects.filter(pk=request.data.get("productId")).first()
        order = Order.objects.create(
            client=client,
            product=product,
            status=request.data.get("status") or Order.Status.CONFIRMED,
            total_cost=int(request.data.get("totalCost") or 0),
            notes=request.data.get("notes", ""),
            items=request.data.get("items") or ([product.name] if product else []),
        )
        return Response({"id": order.id, "status": order.status}, status=status.HTTP_201_CREATED)


class MarketingPublicationPublishView(APIView):
    def post(self, request, publication_id: int):
        publication = MarketingPublication.objects.filter(pk=publication_id).first()
        if not publication:
            return Response({"detail": "Публикация не найдена."}, status=status.HTTP_404_NOT_FOUND)

        if "Telegram" not in publication.channels:
            return Response(
                {"detail": "Для этой публикации не выбран канал Telegram."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = send_publication_to_telegram(publication, force=True)
        except TelegramConfigError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"detail": f"Ошибка публикации: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        return Response(
            {
                "ok": True,
                "status": publication.status,
                "publishedUrl": publication.published_url,
                "telegram": result,
            }
        )


class TelegramWebhookView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        client = store_update(request.data)
        return Response({"ok": True, "client": client.id if client else None})
