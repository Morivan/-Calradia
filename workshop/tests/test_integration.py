from io import StringIO
from unittest.mock import Mock, patch

from django.core.management import call_command
from django.test import TestCase, tag, override_settings
from rest_framework.test import APIClient

from workshop.models import Client, FinanceCalculation, MarketingPublication, MaterialReference, Message, Order, Review


@tag("e2e")
class WorkshopIntegrationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_demo_data")

    def setUp(self):
        self.client_api = APIClient()

    def test_bootstrap_endpoint_returns_aggregated_payload(self):
        response = self.client_api.get("/api/bootstrap/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(sorted(payload.keys()), ["crmClients", "financeHistory", "links", "marketingPosts", "materials", "products", "reviewsByProduct"])
        self.assertGreaterEqual(len(payload["products"]), 4)

    def test_review_create_endpoint_persists_review(self):
        product_id = Review.objects.first().product_id
        response = self.client_api.post(
            f"/api/catalog/products/{product_id}/reviews/",
            {"author": "Тестер", "text": "Проверка", "rating": 4, "date": "11.03.2026"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Review.objects.filter(product_id=product_id, author="Тестер").exists())

    @patch("workshop.views.fetch_csv_rows")
    def test_finance_sync_endpoint_imports_full_data(self, mocked_fetch):
        mocked_fetch.side_effect = [
            [
                ["Название материала", "Цена за единицу", "Единица измерения", "Текущий остаток на складе", "Примечание"],
                ["Сталь", "600 руб/кг", "кг", "100 кг", "Новая партия"],
            ],
            [
                ["Дата расчета", "Товар", "Материал", "Вес", "Часы", "Себестоимость", "Наценка", "Итоговая цена"],
                ["11.03.2026", "Кираса", "Сталь", "2 кг", "20 ч", "7000 руб", "300%", "28000 руб"],
            ],
        ]
        response = self.client_api.post(
            "/api/finance/sync-google-sheets/",
            {"sheetUrl": "https://docs.google.com/spreadsheets/d/test/edit", "materialsSheet": "Материалы", "historySheet": "История"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["synced"], {"materials": True, "history": True})
        self.assertTrue(MaterialReference.objects.filter(name="Сталь", unit_price="600 руб/кг").exists())
        self.assertTrue(FinanceCalculation.objects.filter(product_name="Кираса").exists())

    @patch("workshop.views.fetch_csv_rows", side_effect=RuntimeError("boom"))
    def test_finance_sync_endpoint_returns_400_when_source_unavailable(self, _mocked_fetch):
        response = self.client_api.post(
            "/api/finance/sync-google-sheets/",
            {"sheetUrl": "https://docs.google.com/spreadsheets/d/test/edit"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Не удалось прочитать Google Sheets", response.json()["detail"])

    def test_client_reply_endpoint_saves_message_for_demo_client(self):
        demo_client = Client.objects.filter(external_id__startswith="demo_").first()
        response = self.client_api.post(
            f"/api/crm/clients/{demo_client.id}/reply/",
            {"text": "Спасибо за заказ"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Message.objects.filter(client=demo_client, direction=Message.Direction.MANAGER, text="Спасибо за заказ").exists())

    @patch("workshop.views.send_message")
    def test_client_reply_endpoint_calls_telegram_for_real_client(self, mocked_send_message):
        client = Client.objects.create(
            name="Реальный клиент",
            source=Client.Source.TELEGRAM,
            handle="@real",
            contact="@real",
            external_id="123456",
            last_message="Привет",
            last_time="10:00",
        )
        mocked_send_message.return_value = {"ok": True}
        response = self.client_api.post(
            f"/api/crm/clients/{client.id}/reply/",
            {"text": "Ответ"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        mocked_send_message.assert_called_once_with("123456", "Ответ")

    def test_order_create_endpoint_creates_order(self):
        client = Client.objects.first()
        product = client.orders.model.product.field.related_model.objects.first()
        response = self.client_api.post(
            "/api/crm/orders/",
            {"clientId": client.id, "productId": product.id, "totalCost": 25000, "status": "Подтверждён", "items": ["Кираса"]},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Order.objects.filter(id=response.json()["id"], client=client).exists())

    @override_settings(TELEGRAM_BOT_TOKEN="123:token", TELEGRAM_MARKETING_CHAT_ID="@BandKalrad")
    @patch("workshop.services.marketing.requests.post")
    def test_marketing_publish_endpoint_updates_publication(self, mocked_post):
        mocked_post.return_value = Mock(
            json=Mock(return_value={"ok": True, "result": {"message_id": 99}}),
            raise_for_status=Mock(),
            status_code=200,
        )
        publication = MarketingPublication.objects.create(
            title="Тестовый пост",
            day="12",
            month_label="марта",
            text="Текст публикации",
            channels=["Telegram"],
            publish_time="12:00",
            status=MarketingPublication.Status.SCHEDULED,
        )
        response = self.client_api.post(f"/api/marketing/publications/{publication.id}/publish/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        publication.refresh_from_db()
        self.assertEqual(publication.status, MarketingPublication.Status.PUBLISHED)
        self.assertEqual(publication.published_url, "https://t.me/BandKalrad/99")

    def test_telegram_webhook_endpoint_creates_client_and_message(self):
        response = self.client_api.post(
            "/api/integrations/telegram/webhook/",
            {
                "message": {
                    "message_id": 900,
                    "date": 1234567,
                    "text": "Нужен шлем",
                    "chat": {"id": 555},
                    "from": {"first_name": "Павел", "username": "pavel"},
                }
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Client.objects.filter(external_id="555", handle="@pavel").exists())

    @override_settings(TELEGRAM_BOT_TOKEN="123:token", TELEGRAM_MARKETING_CHAT_ID="@BandKalrad")
    @patch("workshop.services.marketing.requests.post")
    def test_publish_scheduled_marketing_command_publishes_due_post(self, mocked_post):
        mocked_post.return_value = Mock(
            json=Mock(return_value={"ok": True, "result": {"message_id": 100}}),
            raise_for_status=Mock(),
            status_code=200,
        )
        publication = MarketingPublication.objects.create(
            title="Тестовая публикация",
            day="1",
            month_label="января",
            text="Текст",
            channels=["Telegram"],
            publish_time="00:00",
            status=MarketingPublication.Status.SCHEDULED,
        )
        out = StringIO()
        call_command("publish_scheduled_marketing", "--force", "--post-id", str(publication.id), stdout=out)
        publication.refresh_from_db()
        self.assertEqual(publication.status, MarketingPublication.Status.PUBLISHED)
        self.assertIn("Опубликовано", out.getvalue())
