# Кузница Кальрадия

Full-stack версия дипломного проекта: React + Vite на фронтенде и Django + DRF на backend.

## Что уже реализовано

- база данных и backend API;
- каталог товаров, отзывы и карточка изделия;
- CRM-клиенты и сообщения из Telegram (Webhook + polling); ссылки на VK-сообщество;
- финансовый модуль с синхронизацией из Google Sheets;
- маркетинговый модуль с календарём публикаций;
- foundation для Telegram CRM-бота через webhook и long polling;
- подготовленные ссылки для VK, Telegram и Google Sheets.

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

Ключевые переменные:

| Переменная | Описание |
|---|---|
| `DJANGO_SECRET_KEY` | Секретный ключ Django (обязательно для продакшна) |
| `TELEGRAM_BOT_TOKEN` | Токен бота из @BotFather |
| `TELEGRAM_MANAGER_CHAT_ID` | Chat ID менеджера для уведомлений |
| `TELEGRAM_MARKETING_CHAT_ID` | Канал для публикации маркетинга (например `@kalradiaWarBand`) |
| `TELEGRAM_PUBLIC_URL` | Публичная ссылка на Telegram-канал |
| `VK_COMMUNITY_URL` | Ссылка на сообщество VK |
| `VK_MESSAGES_URL` | Ссылка на сообщения сообщества VK |
| `GOOGLE_SHEETS_URL` | Ссылка на Google Sheets по умолчанию |

## Запуск проекта

### 1. Backend

```bash
cd <директория проекта>
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

Backend будет доступен по адресу `http://127.0.0.1:8000`.

### 2. Frontend

Во втором терминале:

```bash
cd <директория проекта>
npm install
npm run dev
```

Frontend будет доступен по адресу `http://127.0.0.1:5173`.

## Тесты

```bash
python manage.py test workshop.tests.test_unit workshop.tests.test_integration
```

Текущее покрытие: 30 тестов (20 unit + 10 интеграционных), все проходят.

## Telegram bot

Чтобы включить реальную отправку сообщений через Telegram:

1. создать бота через `@BotFather`;
2. прописать `TELEGRAM_BOT_TOKEN` в переменных окружения;
3. для polling-запуска использовать:

```bash
python manage.py poll_telegram
```

Либо можно настроить webhook на endpoint:

`/api/integrations/telegram/webhook/`

## Telegram marketing

Для публикации постов маркетинга в Telegram бот должен быть добавлен в канал и иметь право публиковать сообщения.

В `.env` используется переменная:

`TELEGRAM_MARKETING_CHAT_ID=@kalradiaWarBand`

Ручная публикация доступна из интерфейса маркетинга через кнопку `Опубликовать сейчас`.

Для автопубликации по расписанию используйте:

```bash
python manage.py publish_scheduled_marketing
```

На Windows это лучше запускать через `Планировщик заданий` каждые 1–5 минут. На Linux/macOS — через `cron`.

## VK

Интеграция с VK реализована в виде ссылок на сообщество и диалоги. Автоматический приём сообщений через VK API (webhook/Callback API) в текущей версии не реализован — работа с VK-клиентами ведётся вручную через внешнюю ссылку из CRM-модуля.

## Google Sheets

Для синхронизации таблица должна быть доступна для чтения, а листы должны содержать:

- `Справочник материалов`
- `История расчётов`

Синхронизация вызывается из финансового модуля фронтенда.

Если нужно быстро заполнить новую Google Sheets таблицу демонстрационными данными из базы:

```bash
python manage.py export_google_sheets_templates
```

CSV-файлы появятся в `exports/google-sheets/`. Их можно импортировать в листы:

- `Справочник материалов`
- `История расчётов`
