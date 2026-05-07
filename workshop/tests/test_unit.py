from unittest.mock import Mock, patch

from django.test import TestCase, override_settings, tag

from workshop.models import Product, Review
from workshop.serializers import ProductSerializer, ReviewSerializer
from workshop.services.telegram import TelegramConfigError, get_api_base, send_message, store_update
from workshop.services.vk import parse_post
from workshop.views import _product_kwargs, _unique_slug


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

    def test_store_update_returns_none_for_unsupported_event(self):
        self.assertIsNone(store_update({"update_id": 1}))

    def test_store_update_returns_none_for_message_update(self):
        # stub — full inbound bot planned separately
        result = store_update({
            "message": {
                "message_id": 10,
                "date": 123456,
                "text": "Здравствуйте",
                "chat": {"id": 77},
                "from": {"first_name": "Иван", "username": "ivan"},
            }
        })
        self.assertIsNone(result)


@tag("unit")
class VkServiceUnitTests(TestCase):
    def _make_photo_att(self, url: str) -> dict:
        return {
            "type": "photo",
            "photo": {"sizes": [{"width": 800, "height": 600, "url": url}]},
        }

    def test_parse_post_returns_text_and_empty_photos_for_text_only_post(self):
        text, photos = parse_post({"text": "Привет мир", "owner_id": -1, "id": 5})
        self.assertIn("Привет мир", text)
        self.assertEqual(photos, [])
        self.assertIn("vk.com/wall-1_5", text)

    def test_parse_post_extracts_photo_urls(self):
        post = {
            "text": "Новый шлем",
            "owner_id": -100,
            "id": 42,
            "attachments": [self._make_photo_att("https://example.com/photo.jpg")],
        }
        text, photos = parse_post(post)
        self.assertEqual(photos, ["https://example.com/photo.jpg"])
        self.assertIn("Новый шлем", text)

    def test_parse_post_strips_vk_mentions(self):
        text, _ = parse_post({"text": "Привет [id123|Иван]!", "owner_id": -1, "id": 1})
        self.assertNotIn("[id123|Иван]", text)
        self.assertIn("Иван", text)

    def test_parse_post_truncates_long_text(self):
        long_text = "А" * 5000
        text, _ = parse_post({"text": long_text})
        self.assertLessEqual(len(text), 4096)
        self.assertTrue(text.endswith("..."))

    def test_parse_post_truncates_caption_with_photo(self):
        long_text = "Б" * 2000
        post = {
            "text": long_text,
            "attachments": [self._make_photo_att("https://example.com/a.jpg")],
        }
        text, photos = parse_post(post)
        self.assertLessEqual(len(text), 1024)
        self.assertEqual(len(photos), 1)


@tag("unit")
class SerializerUnitTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.product = Product.objects.create(
            slug="serializer-sallet",
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
        cls.review = Review.objects.create(
            product=cls.product,
            author="Иван",
            text="Отлично",
            rating=5,
            review_date="11.03.2026",
        )

    def test_product_serializer_maps_camel_case_fields(self):
        data = ProductSerializer(self.product).data
        self.assertEqual(data["priceFrom"], 12345)
        self.assertEqual(data["leadTime"], "5 дней")
        self.assertEqual(data["protectionClass"], "Высокий")

    def test_product_serializer_includes_badge_and_gallery(self):
        data = ProductSerializer(self.product).data
        self.assertEqual(data["badge"], "Новинка")
        self.assertIsInstance(data["gallery"], list)

    def test_review_serializer_maps_date_field(self):
        data = ReviewSerializer(self.review).data
        self.assertEqual(data["date"], "11.03.2026")
        self.assertEqual(data["rating"], 5)


@tag("unit")
class ViewHelpersUnitTests(TestCase):
    def test_product_kwargs_maps_camel_case(self):
        result = _product_kwargs({"name": "Шлем", "priceFrom": 5000, "leadTime": "7 дней"})
        self.assertEqual(result["name"], "Шлем")
        self.assertEqual(result["price_from"], 5000)
        self.assertEqual(result["lead_time"], "7 дней")

    def test_product_kwargs_ignores_unknown_fields(self):
        result = _product_kwargs({"name": "Шлем", "unknown_field": "garbage"})
        self.assertNotIn("unknown_field", result)

    def test_unique_slug_is_lowercase_and_under_50_chars(self):
        slug = _unique_slug("Готический латный доспех XV века")
        self.assertLessEqual(len(slug), 50)
        self.assertEqual(slug, slug.lower())

    def test_unique_slug_differs_on_repeated_calls(self):
        slugs = {_unique_slug("Саллет") for _ in range(5)}
        self.assertEqual(len(slugs), 5)
