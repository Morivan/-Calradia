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


def send_channel_text(channel_id: str, text: str) -> dict:
    response = requests.post(
        f"{get_api_base()}/sendMessage",
        json={"chat_id": channel_id, "text": text, "disable_web_page_preview": False},
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def send_channel_photo(channel_id: str, photo_url: str, caption: str = "") -> dict:
    response = requests.post(
        f"{get_api_base()}/sendPhoto",
        json={"chat_id": channel_id, "photo": photo_url, "caption": caption},
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


def send_channel_media_group(channel_id: str, photo_urls: list[str], caption: str = "") -> dict:
    """Send up to 10 photos as an album. Caption goes on the first item."""
    media = [
        {"type": "photo", "media": url, **({"caption": caption} if i == 0 and caption else {})}
        for i, url in enumerate(photo_urls[:10])
    ]
    response = requests.post(
        f"{get_api_base()}/sendMediaGroup",
        json={"chat_id": channel_id, "media": media},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def repost_to_channel(channel_id: str, text: str, photos: list[str]) -> None:
    """High-level helper: send text + photos to channel."""
    if photos and len(photos) == 1:
        send_channel_photo(channel_id, photos[0], caption=text)
    elif photos:
        send_channel_media_group(channel_id, photos, caption=text)
    elif text:
        send_channel_text(channel_id, text)


def store_update(update: dict) -> None:
    # Webhook stub — full inbound bot planned separately
    return None
