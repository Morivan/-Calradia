import time

import requests
from django.core.management.base import BaseCommand

from workshop.services.telegram import get_api_base, store_update


class Command(BaseCommand):
    help = "Запускает long polling Telegram-бота и складывает сообщения в CRM."

    def handle(self, *args, **options):
        offset = None
        self.stdout.write(self.style.WARNING("Telegram polling запущен. Остановить: Ctrl+C"))
        while True:
            params = {"timeout": 25}
            if offset is not None:
                params["offset"] = offset
            response = requests.get(f"{get_api_base()}/getUpdates", params=params, timeout=35)
            response.raise_for_status()
            payload = response.json()
            for update in payload.get("result", []):
                offset = update["update_id"] + 1
                store_update(update)
            time.sleep(1)
