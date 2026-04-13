from datetime import timedelta
from unittest.mock import Mock, patch

from django.test import TestCase, override_settings, tag
from django.utils import timezone

from workshop.models import Client, FinanceCalculation, MarketingPublication, MaterialReference, Message, Order, Product, Review
from workshop.serializers import ClientSerializer, FinanceCalculationSerializer, MarketingPublicationSerializer, MaterialReferenceSerializer, ProductSerializer
from workshop.services.google_sheets import build_csv_url, extract_sheet_id, fetch_csv_rows
from workshop.services.marketing import build_publication_text, publication_is_due, publication_scheduled_for, resolve_marketing_chat_id, send_publication_to_telegram
from workshop.services.telegram import TelegramConfigError, get_api_base, send_message, store_update


@tag("unit")
class GoogleSheetsUnitTests(TestCase):
    def test_extract_sheet_id_returns_id_for_standard_url(self):
        value = extract_sheet_id("https://docs.google.com/spreadsheets/d/abc123/edit?usp=sharing")
        self.assertEqual(value, "abc123")

    def test_extract_sheet_id_returns_none_for_invalid_url(self):
        self.assertIsNone(extract_sheet_id("https://example.com/not-a-sheet"))

    def test_build_csv_url_builds_gviz_url(self):
        url = build_csv_url("https://docs.google.com/spreadsheets/d/abc123/edit?usp=sharing", "Лист 1")
        self.assertIn("/d/abc123/gviz/tq", url)
        self.assertIn("sheet=%D0%9B%D0%B8%D1%81%D1%82%201", url)

    def test_build_csv_url_returns_existing_export_url(self):
        source = "https://docs.google.com/spreadsheets/d/abc123/gviz/tq?tqx=out:csv&sheet=One"
        self.assertEqual(build_csv_url(source, "One"), source)

    @patch("workshop.services.google_sheets.requests.get")
    def test_fetch_csv_rows_parses_csv_and_strips_blank_rows(self, mocked_get):
        mocked_get.return_value = Mock(text='\ufeff"A","B"\n"1","2"\n\n', raise_for_status=Mock())
        rows = fetch_csv_rows("https://docs.google.com/spreadsheets/d/abc123/edit", "Лист")
        self.assertEqual(rows, [["A", "B"], ["1", "2"]])


@tag("unit")
class TelegramUnitTests(TestCase):
    @override_settings(TELEGRAM_BOT_TOKEN="")
    def test_get_api_base_raises_when_token_missing(self):
        with self.assertRaises(TelegramConfigError):
            get_api_base()

    @override_settings(TELEGRAM_BOT_TOKEN="123:token")
    def test_get_api_base_returns_bot_url_when_token_set(self):
        self.assertEqual(get_api_base(), "https://api.telegram.org/bot123:token")

    @override_settings(TELEGRAM_BOT_TOKEN="123:token")
    @patch("workshop.services.telegram.requests.post")
    def test_send_message_posts_json_payload(self, mocked_post):
        mocked_post.return_value = Mock(json=Mock(return_value={"ok": True}), raise_for_status=Mock())
        result = send_message("42", "Привет")
        self.assertEqual(result, {"ok": True})
        self.assertEqual(mocked_post.call_args.kwargs["json"], {"chat_id": "42", "text": "Привет"})

    def test_store_update_creates_client_and_message(self):
        client = store_update(
            {
                "message": {
                    "message_id": 10,
                    "date": 123456,
                    "text": "Здравствуйте",
                    "chat": {"id": 77},
                    "from": {"first_name": "Иван", "last_name": "Петров", "username": "ivan"},
                }
            }
        )
        self.assertEqual(client.name, "Иван Петров")
        self.assertEqual(client.handle, "@ivan")
        self.assertEqual(client.unread, 1)
        self.assertEqual(client.messages.count(), 1)

    def test_store_update_returns_none_without_supported_message(self):
        self.assertIsNone(store_update({"update_id": 1}))


@tag("unit")
class MarketingUnitTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.product_with_image = Product.objects.create(
            slug="unit-product-image",
            name="Тестовый шлем",
            subtitle="Тест",
            status=Product.Status.READY,
            category="Шлемы",
            era="XV век",
            material="Сталь",
            sizes=["M"],
            price_from=1000,
            lead_time="7 дней",
            weight="2 кг",
            popularity=1,
            protection_class="Высокий",
            history="История",
            description=["Описание"],
            image="https://example.com/helmet.jpg",
            gallery=["https://example.com/helmet.jpg"],
            badge="",
        )
        cls.product_without_image = Product.objects.create(
            slug="unit-product-no-image",
            name="Тестовые перчатки",
            subtitle="Тест",
            status=Product.Status.CUSTOM,
            category="Рукавицы",
            era="XIV век",
            material="Кожа",
            sizes=["L"],
            price_from=500,
            lead_time="14 дней",
            weight="1 кг",
            popularity=1,
            protection_class="Средний",
            history="История",
            description=["Описание"],
            image="https://example.com/mittens.jpg",
            gallery=["https://example.com/mittens.jpg"],
            badge="",
        )

    @override_settings(TELEGRAM_MARKETING_CHAT_ID="@BandKalrad")
    def test_resolve_marketing_chat_id_uses_explicit_setting(self):
        self.assertEqual(resolve_marketing_chat_id(), "@BandKalrad")

    def test_publication_scheduled_for_returns_datetime(self):
        publication = MarketingPublication(day="25", month_label="декабря", publish_time="14:00", title="Тест", text="Текст")
        scheduled = publication_scheduled_for(publication)
        self.assertIsNotNone(scheduled)
        self.assertEqual(scheduled.month, 12)
        self.assertEqual(scheduled.day, 25)

    def test_publication_is_due_true_when_time_passed(self):
        now = timezone.localtime()
        publication = MarketingPublication(
            day=str(now.day),
            month_label={
                1: "января",
                2: "февраля",
                3: "марта",
                4: "апреля",
                5: "мая",
                6: "июня",
                7: "июля",
                8: "августа",
                9: "сентября",
                10: "октября",
                11: "ноября",
                12: "декабря",
            }[now.month],
            publish_time=(now - timedelta(minutes=10)).strftime("%H:%M"),
            title="Тест",
            text="Текст",
        )
        self.assertTrue(publication_is_due(publication, now=now))

    def test_build_publication_text_escapes_html_and_includes_product(self):
        publication = MarketingPublication(title="<Кираса>", text="Описание & детали", product=self.product_with_image)
        text = build_publication_text(publication)
        self.assertIn("&lt;Кираса&gt;", text)
        self.assertIn("Описание &amp; детали", text)
        self.assertIn(self.product_with_image.name, text)

    @override_settings(TELEGRAM_BOT_TOKEN="123:token", TELEGRAM_MARKETING_CHAT_ID="@BandKalrad")
    @patch("workshop.services.marketing.requests.post")
    def test_send_publication_to_telegram_uses_send_photo_with_image(self, mocked_post):
        mocked_post.return_value = Mock(
            json=Mock(return_value={"ok": True, "result": {"message_id": 88}}),
            raise_for_status=Mock(),
            status_code=200,
        )
        publication = MarketingPublication.objects.create(
            title="Пост с фото",
            text="С картинкой",
            product=self.product_with_image,
            day="10",
            month_label="марта",
            publish_time="12:00",
            status=MarketingPublication.Status.SCHEDULED,
            channels=["Telegram"],
        )
        send_publication_to_telegram(publication, force=True)
        self.assertEqual(mocked_post.call_args.args[0], "https://api.telegram.org/bot123:token/sendPhoto")
        publication.refresh_from_db()
        self.assertEqual(publication.status, MarketingPublication.Status.PUBLISHED)


@tag("unit")
class SerializerUnitTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.product = Product.objects.create(
            slug="serializer-product",
            name="Саллет",
            subtitle="Тестовый",
            status=Product.Status.READY,
            category="Шлемы",
            era="XV век",
            material="Сталь",
            sizes=["M"],
            price_from=12345,
            lead_time="5 дней",
            weight="3 кг",
            popularity=90,
            protection_class="Высокий",
            history="История",
            description=["Описание"],
            image="https://example.com/image.jpg",
            gallery=["https://example.com/image.jpg"],
            badge="Новинка",
        )
        cls.review = Review.objects.create(product=cls.product, author="Иван", text="Отлично", rating=5, review_date="11.03.2026")
        cls.material = MaterialReference.objects.create(name="Кожа", unit_price="200 руб/м2", stock="10 м2", note="Тест")
        cls.calculation = FinanceCalculation.objects.create(
            product=cls.product,
            calculation_date="11.03.2026",
            product_name="Саллет",
            material="Сталь",
            weight="3 кг",
            hours="10 ч",
            cost="5 000 руб",
            markup="200%",
            total="15 000 руб",
        )
        cls.crm_client = Client.objects.create(
            name="Тестовый клиент",
            source=Client.Source.TELEGRAM,
            handle="@client",
            contact="@client",
            last_message="Привет",
            last_time="10:00",
            unread=1,
        )
        cls.order = Order.objects.create(client=cls.crm_client, product=cls.product, items=["Саллет"])
        Message.objects.create(client=cls.crm_client, order=cls.order, direction=Message.Direction.CLIENT, text="Привет", sent_at_label="10:00")
        cls.publication = MarketingPublication.objects.create(
            title="Пост",
            day="11",
            month_label="марта",
            text="Текст",
            product=cls.product,
            channels=["Telegram"],
            publish_time="12:00",
            status=MarketingPublication.Status.DRAFT,
            color_class="marketing-status-draft",
        )

    def test_product_serializer_maps_camel_case_fields(self):
        data = ProductSerializer(self.product).data
        self.assertEqual(data["priceFrom"], 12345)
        self.assertEqual(data["leadTime"], "5 дней")
        self.assertEqual(data["protectionClass"], "Высокий")

    def test_material_reference_serializer_maps_unit_price(self):
        data = MaterialReferenceSerializer(self.material).data
        self.assertEqual(data["unitPrice"], "200 руб/м2")

    def test_finance_calculation_serializer_maps_date_and_product(self):
        data = FinanceCalculationSerializer(self.calculation).data
        self.assertEqual(data["date"], "11.03.2026")
        self.assertEqual(data["product"], "Саллет")

    def test_client_serializer_returns_order_history_and_messages(self):
        data = ClientSerializer(self.crm_client).data
        self.assertEqual(data["lastMessage"], "Привет")
        self.assertEqual(len(data["messages"]), 1)
        self.assertEqual(len(data["orderHistory"]), 1)

    def test_marketing_publication_serializer_returns_product_and_fields(self):
        data = MarketingPublicationSerializer(self.publication).data
        self.assertEqual(data["monthLabel"], "марта")
        self.assertEqual(data["product"], "Саллет")
        self.assertEqual(data["colorClass"], "marketing-status-draft")
