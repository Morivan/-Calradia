import requests
from django.conf import settings

from workshop.models import Client, Message


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


def store_update(update: dict) -> Client | None:
    message = update.get("message") or update.get("edited_message")
    if not message:
        return None

    chat = message.get("chat", {})
    sender = message.get("from", {})
    text = message.get("text") or message.get("caption") or ""
    external_id = str(chat.get("id", ""))
    name = " ".join(part for part in [sender.get("first_name"), sender.get("last_name")] if part).strip() or "Telegram клиент"
    handle = f"@{sender['username']}" if sender.get("username") else ""

    client, _ = Client.objects.get_or_create(
        source=Client.Source.TELEGRAM,
        external_id=external_id,
        defaults={"name": name, "handle": handle, "contact": handle},
    )
    client.name = name or client.name
    if handle:
        client.handle = handle
        client.contact = handle
    client.last_message = text
    client.last_time = str(message.get("date", ""))
    client.unread += 1
    client.save()

    Message.objects.get_or_create(
        client=client,
        direction=Message.Direction.CLIENT,
        external_message_id=str(message.get("message_id", "")),
        defaults={"text": text, "sent_at_label": str(message.get("date", ""))},
    )
    return client
