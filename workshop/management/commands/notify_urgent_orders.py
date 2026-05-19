import datetime
from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

from workshop.models import Order

NOTIFY_DAYS = [14, 7, 3, 1]

SUBJECT_TEMPLATE = "⚠️ Заказ горит: {client} — {product} (осталось {days} дн.)"

BODY_TEMPLATE = """\
Здравствуйте!

Заказ приближается к дедлайну.

  Клиент:      {client}
  Изделие:     {product}
  Дедлайн:     {deadline}
  Осталось:    {days} дн.
  Статус:      {status}
  Сумма:       {total} ₽
  Аванс:       {advance} ₽
  Остаток:     {balance} ₽
  Ответственный: {assigned}

Конфигурация:
{configuration}

Примечания:
{notes}

---
Кузница Кальрадия
"""


class Command(BaseCommand):
    help = "Send email reminders for orders with approaching deadlines"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print emails without sending",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        today = timezone.localdate()
        admin_email = getattr(settings, "ADMIN_NOTIFICATION_EMAIL", "")

        active_statuses = [Order.Status.NEW, Order.Status.IN_PROGRESS]
        orders = Order.objects.filter(
            status__in=active_statuses,
            deadline__isnull=False,
        ).select_related("assigned_to")

        sent = 0
        for order in orders:
            days_left = (order.deadline - today).days
            if days_left not in NOTIFY_DAYS:
                continue

            recipients = []
            if order.assigned_to and order.assigned_to.email:
                recipients.append(order.assigned_to.email)
            if admin_email and admin_email not in recipients:
                recipients.append(admin_email)

            if not recipients:
                self.stderr.write(
                    f"Skipping order #{order.pk} — no recipient emails configured"
                )
                continue

            product_display = order.product_name or (
                order.product.name if order.product else "—"
            )
            assigned_display = (
                order.assigned_to.get_full_name() or order.assigned_to.username
                if order.assigned_to
                else "—"
            )
            subject = SUBJECT_TEMPLATE.format(
                client=order.client_name,
                product=product_display,
                days=days_left,
            )
            body = BODY_TEMPLATE.format(
                client=order.client_name,
                product=product_display,
                deadline=order.deadline.strftime("%d.%m.%Y"),
                days=days_left,
                status=order.status,
                total=order.total or 0,
                advance=order.advance or 0,
                balance=(order.total or 0) - (order.advance or 0),
                assigned=assigned_display,
                configuration=order.configuration or "—",
                notes=order.notes or "—",
            )

            if dry_run:
                self.stdout.write(f"[DRY RUN] To: {recipients}\nSubject: {subject}\n{body}\n---")
            else:
                try:
                    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, recipients, fail_silently=False)
                    self.stdout.write(f"Sent reminder for order #{order.pk} ({days_left}d) → {recipients}")
                    sent += 1
                except Exception as exc:
                    self.stderr.write(f"Failed to send for order #{order.pk}: {exc}")

        if not dry_run:
            self.stdout.write(f"Done. Sent {sent} reminder(s).")
