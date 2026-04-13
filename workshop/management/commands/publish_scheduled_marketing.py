from django.core.management.base import BaseCommand
from django.utils import timezone

from workshop.models import MarketingPublication
from workshop.services.marketing import publication_is_due, send_publication_to_telegram


class Command(BaseCommand):
    help = "Публикует запланированные посты в Telegram."

    def add_arguments(self, parser):
        parser.add_argument("--post-id", type=int, help="Опубликовать конкретную запись.")
        parser.add_argument("--force", action="store_true", help="Опубликовать независимо от времени.")

    def handle(self, *args, **options):
        post_id = options.get("post_id")
        force = options.get("force", False)

        queryset = MarketingPublication.objects.all()
        if post_id:
            queryset = queryset.filter(pk=post_id)
        else:
            queryset = queryset.filter(status=MarketingPublication.Status.SCHEDULED)

        now = timezone.localtime()
        published = 0
        skipped = 0

        for publication in queryset:
            if not force and not publication_is_due(publication, now=now):
                skipped += 1
                continue
            try:
                send_publication_to_telegram(publication, force=force or bool(post_id))
                published += 1
                self.stdout.write(self.style.SUCCESS(f"Опубликовано: {publication.title}"))
            except Exception as exc:
                self.stderr.write(self.style.ERROR(f"Ошибка публикации '{publication.title}': {exc}"))

        self.stdout.write(self.style.WARNING(f"Готово. Опубликовано: {published}, пропущено: {skipped}"))
