from unittest.mock import patch, Mock

from django.contrib.auth.models import User
from django.test import TestCase, override_settings, tag
from rest_framework.test import APIClient

from workshop.models import IntegrationLink, Product, Review


def _make_product(**kwargs) -> Product:
    defaults = dict(
        slug="test-product-abc1",
        name="Тестовый шлем",
        subtitle="Для теста",
        status=Product.Status.READY,
        category="Шлемы",
        era="XV век",
        material="Сталь",
        sizes=["M"],
        price_from=10000,
        lead_time="7 дней",
        weight="3 кг",
        popularity=50,
        protection_class="Высокий",
        history="История",
        description=["Описание"],
        image="https://example.com/img.jpg",
        gallery=["https://example.com/img.jpg"],
        badge="",
    )
    defaults.update(kwargs)
    return Product.objects.create(**defaults)


@tag("integration")
class BootstrapIntegrationTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        _make_product()
        IntegrationLink.objects.create(key="telegram_order", label="Telegram", url="https://t.me/test")

    def test_bootstrap_returns_products_reviews_and_links(self):
        response = self.api.get("/api/bootstrap/")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("products", payload)
        self.assertIn("reviewsByProduct", payload)
        self.assertIn("links", payload)

    def test_bootstrap_links_contains_expected_keys(self):
        response = self.api.get("/api/bootstrap/")
        links = response.json()["links"]
        for key in ("telegramOrder", "telegramPublic", "vkCommunity", "vkMessages", "yandexForm"):
            self.assertIn(key, links)

    def test_bootstrap_uses_db_link_over_settings_default(self):
        response = self.api.get("/api/bootstrap/")
        self.assertEqual(response.json()["links"]["telegramOrder"], "https://t.me/test")


@tag("integration")
class ReviewIntegrationTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.product = _make_product()

    def test_create_review_returns_201_and_persists(self):
        response = self.api.post(
            f"/api/catalog/products/{self.product.id}/reviews/",
            {"author": "Тестер", "text": "Хорошая работа", "rating": 5, "date": "01.01.2026"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Review.objects.filter(product=self.product, author="Тестер").exists())

    def test_create_review_for_missing_product_returns_404(self):
        response = self.api.post("/api/catalog/products/99999/reviews/", {"author": "X"}, format="json")
        self.assertEqual(response.status_code, 404)


@tag("integration")
class ProductCRUDIntegrationTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.staff = User.objects.create_user("admin", password="pass", is_staff=True)
        self.product = _make_product()

    def _login(self):
        self.api.force_login(self.staff)

    def test_product_list_returns_200_for_anonymous(self):
        response = self.api.get("/api/catalog/products/")
        self.assertEqual(response.status_code, 200)

    def test_product_create_requires_auth(self):
        response = self.api.post("/api/catalog/products/", {"name": "Без авторизации"}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_product_create_persists_and_returns_201(self):
        self._login()
        payload = {
            "name": "Новый нагрудник",
            "subtitle": "Тест",
            "status": "Под заказ",
            "category": "Нагрудники",
            "era": "XV век",
            "material": "Сталь",
            "sizes": ["M"],
            "priceFrom": 50000,
            "leadTime": "4 недели",
            "weight": "6 кг",
            "protectionClass": "Высший",
            "history": "Тестовая история",
            "description": ["Абзац один"],
            "image": "https://example.com/new.jpg",
            "gallery": ["https://example.com/new.jpg"],
        }
        response = self.api.post("/api/catalog/products/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "Новый нагрудник")
        self.assertEqual(data["priceFrom"], 50000)

    def test_product_patch_updates_field(self):
        self._login()
        response = self.api.patch(
            f"/api/catalog/products/{self.product.id}/",
            {"name": "Обновлённый шлем"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "Обновлённый шлем")

    def test_product_delete_removes_item(self):
        self._login()
        pk = self.product.id
        response = self.api.delete(f"/api/catalog/products/{pk}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Product.objects.filter(pk=pk).exists())

    def test_product_patch_requires_auth(self):
        response = self.api.patch(f"/api/catalog/products/{self.product.id}/", {"name": "Взлом"}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_product_detail_returns_404_for_missing(self):
        response = self.api.get("/api/catalog/products/99999/")
        self.assertEqual(response.status_code, 404)


@tag("integration")
class AuthIntegrationTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.user = User.objects.create_user("master", password="secret123", first_name="Мастер")

    def test_login_with_valid_credentials_returns_user_data(self):
        response = self.api.post(
            "/api/auth/login/",
            {"username": "master", "password": "secret123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["username"], "master")
        self.assertIn("fullName", data)
        self.assertIn("isStaff", data)

    def test_login_with_invalid_credentials_returns_401(self):
        response = self.api.post(
            "/api/auth/login/",
            {"username": "master", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_me_returns_401_for_anonymous(self):
        response = self.api.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)

    def test_me_returns_user_data_after_login(self):
        self.api.force_login(self.user)
        response = self.api.get("/api/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "master")

    def test_logout_ends_session(self):
        self.api.force_login(self.user)
        self.api.post("/api/auth/logout/", format="json")
        response = self.api.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)


@tag("integration")
class TelegramWebhookIntegrationTests(TestCase):
    def setUp(self):
        self.api = APIClient()

    def test_webhook_returns_ok_for_any_update(self):
        response = self.api.post(
            "/api/integrations/telegram/webhook/",
            {"update_id": 1, "message": {"chat": {"id": 1}, "text": "Привет"}},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ok"], True)


@tag("integration")
class VkCallbackIntegrationTests(TestCase):
    def setUp(self):
        self.api = APIClient()

    @override_settings(VK_CONFIRMATION_TOKEN="abc123", VK_CALLBACK_SECRET="")
    def test_confirmation_returns_token_as_plain_text(self):
        response = self.api.post(
            "/api/integrations/vk/callback/",
            {"type": "confirmation"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("abc123", response.content.decode())

    @override_settings(VK_CALLBACK_SECRET="secret", VK_CONFIRMATION_TOKEN="")
    def test_wrong_secret_returns_403(self):
        response = self.api.post(
            "/api/integrations/vk/callback/",
            {"type": "wall_post_new", "secret": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    @override_settings(
        VK_CALLBACK_SECRET="",
        TELEGRAM_CHANNEL_ID="@test_channel",
        TELEGRAM_BOT_TOKEN="123:token",
    )
    @patch("workshop.views.repost_to_channel")
    def test_wall_post_new_calls_repost(self, mocked_repost):
        response = self.api.post(
            "/api/integrations/vk/callback/",
            {
                "type": "wall_post_new",
                "object": {
                    "id": 1,
                    "owner_id": -100,
                    "text": "Новый пост из ВК",
                    "post_type": "post",
                    "attachments": [],
                },
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        mocked_repost.assert_called_once()

    @override_settings(VK_CALLBACK_SECRET="", TELEGRAM_CHANNEL_ID="@test_channel")
    @patch("workshop.views.repost_to_channel")
    def test_wall_post_new_skips_repost(self, mocked_repost):
        response = self.api.post(
            "/api/integrations/vk/callback/",
            {
                "type": "wall_post_new",
                "object": {"id": 2, "owner_id": -100, "text": "", "post_type": "postpone"},
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        mocked_repost.assert_not_called()
