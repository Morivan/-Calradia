from __future__ import annotations

from datetime import datetime
from html import escape

import requests
from django.conf import settings
from django.utils import timezone

from workshop.models import MarketingPublication
from workshop.services.telegram import TelegramConfigError, get_api_base


MONTHS = {
    "января": 1,
    "февраля": 2,
    "марта": 3,
    "апреля": 4,
    "мая": 5,
    "июня": 6,
    "июля": 7,
    "августа": 8,
    "сентября": 9,
    "октября": 10,
    "ноября": 11,
    "декабря": 12,
}


def resolve_marketing_chat_id() -> str:
    if settings.TELEGRAM_MARKETING_CHAT_ID:
        return settings.TELEGRAM_MARKETING_CHAT_ID
    public_url = settings.TELEGRAM_PUBLIC_URL
    if "#@" in public_url:
        return f"@{public_url.split('#@', 1)[1]}"
    raise TelegramConfigError("Не настроен TELEGRAM_MARKETING_CHAT_ID для автопубликации.")


def publication_scheduled_for(publication: MarketingPublication) -> datetime | None:
    month = MONTHS.get(publication.month_label.strip().lower())
    if not month:
        return None
    try:
        day = int(publication.day)
        hour, minute = publication.publish_time.split(":", 1)
        return timezone.make_aware(
            datetime(timezone.localdate().year, month, day, int(hour), int(minute)),
            timezone.get_current_timezone(),
        )
    except Exception:
        return None


def publication_is_due(publication: MarketingPublication, now: datetime | None = None) -> bool:
    now = now or timezone.localtime()
    scheduled_for = publication_scheduled_for(publication)
    if scheduled_for is None:
        return False
    return scheduled_for <= now


def build_publication_text(publication: MarketingPublication) -> str:
    title = escape(publication.title)
    body = escape(publication.text)
    product_line = ""
    if publication.product:
        product_line = f"\n\n<b>Товар:</b> {escape(publication.product.name)}"
    return f"<b>{title}</b>\n\n{body}{product_line}"


def send_publication_to_telegram(publication: MarketingPublication, force: bool = False) -> dict:
    if publication.status == MarketingPublication.Status.PUBLISHED and not force:
        return {"detail": "Публикация уже отправлена.", "publication": publication}

    chat_id = resolve_marketing_chat_id()
    api_base = get_api_base()
    text = build_publication_text(publication)
    image = publication.product.image if publication.product and publication.product.image else ""

    try:
        if image:
            response = requests.post(
                f"{api_base}/sendPhoto",
                data={
                    "chat_id": chat_id,
                    "photo": image,
                    "caption": text[:1024],
                    "parse_mode": "HTML",
                },
                timeout=25,
            )
            if response.status_code >= 400:
                response.raise_for_status()
        else:
            response = requests.post(
                f"{api_base}/sendMessage",
                data={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": False,
                },
                timeout=25,
            )
            response.raise_for_status()

        payload = response.json()
        message_id = payload.get("result", {}).get("message_id")
        publication.status = MarketingPublication.Status.PUBLISHED
        publication.error_message = ""
        if isinstance(chat_id, str) and chat_id.startswith("@") and message_id:
            publication.published_url = f"https://t.me/{chat_id[1:]}/{message_id}"
        publication.save(update_fields=["status", "error_message", "published_url", "updated_at"])
        return payload
    except Exception as exc:
        publication.status = MarketingPublication.Status.ERROR
        publication.error_message = str(exc)
        publication.save(update_fields=["status", "error_message", "updated_at"])
        raise
