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
        self.assertIn("reviews", payload)
        self.assertIn("links", payload)

    def test_bootstrap_links_contains_expected_keys(self):
        response = self.api.get("/api/bootstrap/")
        links = response.json()["links"]
        for key in ("telegramOrder", "telegramPublic", "vkCommunity", "vkMessages"):
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


# ── helpers ────────────────────────────────────────────────────────────────────

import datetime as _dt
from django.utils import timezone as _tz

from workshop.models import MasterApproval, Order, ProductSet, Task


def _make_staff(**kw) -> User:
    u = User.objects.create_user(kw.pop("username"), password="pass", is_staff=True, **kw)
    return u


def _make_order(product=None, **kw) -> Order:
    defaults = dict(
        client_name="Test Client",
        product_name="Test Product",
        status=Order.Status.NEW,
        total=10000,
        advance=3000,
    )
    defaults.update(kw)
    return Order.objects.create(**defaults)


# ── Task / Approval ────────────────────────────────────────────────────────────

@tag("integration")
class TaskApprovalIntegrationTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.product = _make_product(slug="task-test-helm")
        self.order = _make_order(product=self.product)

        # master_ok has approval for the product
        self.master_ok = _make_staff(username="master_ok_t")
        MasterApproval.objects.create(master=self.master_ok, product=self.product)

        # master_no has NO approval
        self.master_no = _make_staff(username="master_no_t")

        # Create a pending task for this product
        self.task = Task.objects.create(
            order=self.order,
            product=self.product,
            product_name=self.product.name,
            status=Task.Status.PENDING,
        )

    # ── taking ──────────────────────────────────────────────────────────────────

    def test_master_without_approval_cannot_take_task(self):
        self.api.force_login(self.master_no)
        resp = self.api.patch(
            f"/api/workshop/tasks/{self.task.pk}/",
            {"action": "take"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.PENDING)

    def test_master_with_approval_can_take_task(self):
        self.api.force_login(self.master_ok)
        resp = self.api.patch(
            f"/api/workshop/tasks/{self.task.pk}/",
            {"action": "take"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.TAKEN)
        self.assertEqual(self.task.assigned_to, self.master_ok)

    def test_double_take_returns_400(self):
        self.task.status = Task.Status.TAKEN
        self.task.assigned_to = self.master_ok
        self.task.save()
        self.api.force_login(self.master_ok)
        resp = self.api.patch(
            f"/api/workshop/tasks/{self.task.pk}/",
            {"action": "take"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_master_can_release_own_task(self):
        self.task.status = Task.Status.TAKEN
        self.task.assigned_to = self.master_ok
        self.task.save()
        self.api.force_login(self.master_ok)
        resp = self.api.patch(
            f"/api/workshop/tasks/{self.task.pk}/",
            {"action": "release"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.PENDING)
        self.assertIsNone(self.task.assigned_to)

    def test_master_can_mark_own_task_done(self):
        self.task.status = Task.Status.TAKEN
        self.task.assigned_to = self.master_ok
        self.task.save()
        self.api.force_login(self.master_ok)
        resp = self.api.patch(
            f"/api/workshop/tasks/{self.task.pk}/",
            {"action": "done"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.DONE)

    def test_unauthenticated_cannot_take_task(self):
        resp = self.api.patch(
            f"/api/workshop/tasks/{self.task.pk}/",
            {"action": "take"},
            format="json",
        )
        self.assertEqual(resp.status_code, 401)

    def test_superuser_can_take_task_without_approval(self):
        su = User.objects.create_user("superuser_t", password="pass", is_staff=True, is_superuser=True)
        self.api.force_login(su)
        resp = self.api.patch(
            f"/api/workshop/tasks/{self.task.pk}/",
            {"action": "take"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, Task.Status.TAKEN)

    # ── approval management ──────────────────────────────────────────────────────

    def test_superuser_can_grant_approval(self):
        su = User.objects.create_user("su_grant", password="pass", is_staff=True, is_superuser=True)
        target = _make_staff(username="target_master")
        product2 = _make_product(slug="approval-product-2")
        self.api.force_login(su)
        resp = self.api.post(
            "/api/workshop/approvals/",
            {"master_id": target.pk, "product_id": product2.pk, "action": "add"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(MasterApproval.objects.filter(master=target, product=product2).exists())

    def test_superuser_can_revoke_approval(self):
        su = User.objects.create_user("su_revoke", password="pass", is_staff=True, is_superuser=True)
        self.api.force_login(su)
        resp = self.api.post(
            "/api/workshop/approvals/",
            {"master_id": self.master_ok.pk, "product_id": self.product.pk, "action": "remove"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(MasterApproval.objects.filter(master=self.master_ok, product=self.product).exists())

    def test_non_superuser_cannot_grant_approval(self):
        self.api.force_login(self.master_ok)
        product2 = _make_product(slug="approval-product-3")
        resp = self.api.post(
            "/api/workshop/approvals/",
            {"master_id": self.master_no.pk, "product_id": product2.pk, "action": "grant"},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)


# ── Orders ────────────────────────────────────────────────────────────────────

@tag("integration")
class WorkshopOrderIntegrationTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.staff = _make_staff(username="staff_order")
        self.su = User.objects.create_user("su_order", password="pass", is_staff=True, is_superuser=True)

    def test_list_orders_requires_auth(self):
        resp = self.api.get("/api/workshop/orders/")
        self.assertEqual(resp.status_code, 401)

    def test_staff_can_list_orders(self):
        self.api.force_login(self.staff)
        _make_order(assigned_to=self.staff)
        resp = self.api.get("/api/workshop/orders/")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

    def test_staff_can_create_order(self):
        self.api.force_login(self.staff)
        resp = self.api.post(
            "/api/workshop/orders/",
            {"client_name": "Тестовый клиент", "product_name": "Шлем", "total": 15000},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["client_name"], "Тестовый клиент")
        self.assertIn("id", data)

    def test_order_create_returns_400_without_client_name(self):
        self.api.force_login(self.staff)
        resp = self.api.post("/api/workshop/orders/", {"product_name": "Шлем"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_staff_can_patch_own_order(self):
        self.api.force_login(self.staff)
        order = _make_order(assigned_to=self.staff)
        resp = self.api.patch(
            f"/api/workshop/orders/{order.pk}/",
            {"status": Order.Status.IN_PROGRESS},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.IN_PROGRESS)

    def test_staff_cannot_patch_another_masters_order(self):
        other = _make_staff(username="other_master_x")
        order = _make_order(assigned_to=other)
        self.api.force_login(self.staff)
        resp = self.api.patch(
            f"/api/workshop/orders/{order.pk}/",
            {"status": Order.Status.DONE},
            format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_superuser_can_delete_order(self):
        self.api.force_login(self.su)
        order = _make_order()
        pk = order.pk
        resp = self.api.delete(f"/api/workshop/orders/{pk}/")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(Order.objects.filter(pk=pk).exists())

    def test_non_superuser_cannot_delete_order(self):
        self.api.force_login(self.staff)
        order = _make_order()
        resp = self.api.delete(f"/api/workshop/orders/{order.pk}/")
        self.assertEqual(resp.status_code, 403)


# ── ProductSet catalog ────────────────────────────────────────────────────────

@tag("integration")
class ProductSetCatalogIntegrationTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        p1 = _make_product(slug="set-helm-1")
        p2 = _make_product(slug="set-gauntlet-1")
        self.ps = ProductSet.objects.create(
            slug="knight-set",
            name="Рыцарский комплект",
            discount_percent=10,
        )
        self.ps.products.set([p1, p2])

    def test_sets_list_is_public(self):
        resp = self.api.get("/api/catalog/sets/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)

    def test_set_detail_by_slug(self):
        resp = self.api.get("/api/catalog/sets/knight-set/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["slug"], "knight-set")
        self.assertEqual(data["name"], "Рыцарский комплект")
        self.assertIn("products", data)
        self.assertEqual(len(data["products"]), 2)

    def test_set_detail_404_for_unknown_slug(self):
        resp = self.api.get("/api/catalog/sets/nonexistent-slug/")
        self.assertEqual(resp.status_code, 404)

    def test_set_products_include_price(self):
        resp = self.api.get("/api/catalog/sets/knight-set/")
        products = resp.json()["products"]
        for p in products:
            # set products are lightweight dicts with snake_case price_from
            self.assertIn("price_from", p)


# ── Review author saved ───────────────────────────────────────────────────────

@tag("integration")
class ReviewAuthorIntegrationTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.product = _make_product(slug="review-author-product")

    def test_create_review_saves_author(self):
        resp = self.api.post(
            f"/api/catalog/products/{self.product.pk}/reviews/",
            {"author": "Богдан", "text": "Великолепно", "date": "01.06.2026"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["author"], "Богдан")
        from workshop.models import Review
        self.assertTrue(Review.objects.filter(author="Богдан", product=self.product).exists())

    def test_create_review_without_author_defaults_to_empty(self):
        resp = self.api.post(
            f"/api/catalog/products/{self.product.pk}/reviews/",
            {"text": "Хорошо"},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["author"], "")


# ── notify_urgent_orders management command ───────────────────────────────────

@tag("integration")
class NotifyUrgentOrdersCommandTests(TestCase):
    def setUp(self):
        self.master = _make_staff(username="remind_master", email="remind@test.com")

    def _create_order(self, days_ahead: int) -> Order:
        return Order.objects.create(
            client_name=f"Client +{days_ahead}d",
            product_name="Изделие",
            status=Order.Status.NEW,
            total=5000,
            advance=0,
            deadline=_tz.localdate() + _dt.timedelta(days=days_ahead),
            assigned_to=self.master,
        )

    def test_dry_run_prints_subjects_for_14_7_3_days(self):
        for days in (14, 7, 3):
            self._create_order(days)
        from io import StringIO
        from django.core.management import call_command
        out = StringIO()
        call_command("notify_urgent_orders", dry_run=True, stdout=out)
        output = out.getvalue()
        self.assertIn("осталось 14 дн.", output)
        self.assertIn("осталось 7 дн.", output)
        self.assertIn("осталось 3 дн.", output)

    def test_dry_run_does_not_send_emails(self):
        self._create_order(7)
        from io import StringIO
        from django.core.management import call_command
        from django.core import mail
        out = StringIO()
        call_command("notify_urgent_orders", dry_run=True, stdout=out)
        self.assertEqual(len(mail.outbox), 0)

    def test_live_run_sends_email_to_assigned_master(self):
        self._create_order(3)
        from io import StringIO
        from django.core.management import call_command
        from django.core import mail
        out = StringIO()
        with self.settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"):
            call_command("notify_urgent_orders", dry_run=False, stdout=out)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("remind@test.com", mail.outbox[0].to)
        self.assertIn("3 дн.", mail.outbox[0].subject)

    def test_order_not_in_window_is_skipped(self):
        self._create_order(5)  # 5 days is not in [14, 7, 3]
        from io import StringIO
        from django.core.management import call_command
        from django.core import mail
        out = StringIO()
        with self.settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"):
            call_command("notify_urgent_orders", dry_run=False, stdout=out)
        self.assertEqual(len(mail.outbox), 0)

    def test_order_without_assigned_master_is_skipped_gracefully(self):
        Order.objects.create(
            client_name="No Master",
            product_name="X",
            status=Order.Status.NEW,
            total=1000,
            advance=0,
            deadline=_tz.localdate() + _dt.timedelta(days=7),
        )
        from io import StringIO
        from django.core.management import call_command
        from django.core import mail
        err = StringIO()
        with self.settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"):
            call_command("notify_urgent_orders", dry_run=False, stderr=err)
        self.assertIn("no recipient", err.getvalue())
        self.assertEqual(len(mail.outbox), 0)
