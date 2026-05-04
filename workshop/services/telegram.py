import requests
from django.conf import settings


class TelegramConfigError(RuntimeError):
    pass


def get_api_base() -> str:
    if not settings.TELEGRAM_BOT_TOKEN:
        raise TelegramConfigError("Токен Telegram-бота не настроен.")
    return f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}"


def send_message(chat_id: str, text: str) -> dict:
    response = requests.post(
        f"{get_api_base()}/sendMessage",
        json={"chat_id": chat_id, "text": text},
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def store_update(update: dict) -> None:
    # Webhook stub — full bot implementation planned separately
    return None
