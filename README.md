# Кузница Кальрадия

Full-stack версия дипломного проекта: React + Vite на фронтенде и Django + DRF на backend.

## Что уже реализовано

- база данных и backend API;
- каталог товаров, отзывы и карточка изделия;
- CRM-клиенты и сообщения из Telegram/VK;
- финансовый модуль с синхронизацией из Google Sheets;
- маркетинговый модуль с календарём публикаций;
- foundation для Telegram CRM-бота через webhook и long polling;
- подготовленные ссылки для VK, Telegram и Google Sheets.

## Запуск проекта

### 1. Backend

```powershell
cd E:\Project
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

Backend будет доступен по адресу `http://127.0.0.1:8000`.

### 2. Frontend

Во втором терминале:

```powershell
cd E:\Project
npm install
npm run dev
```

Frontend будет доступен по адресу `http://127.0.0.1:5173`.

## Telegram bot

Чтобы включить реальную отправку сообщений через Telegram:

1. создать бота через `@BotFather`;
2. прописать `TELEGRAM_BOT_TOKEN` в переменных окружения;
3. для polling-запуска использовать:

```powershell
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

```powershell
python manage.py publish_scheduled_marketing
```

На Windows это лучше запускать через `Планировщик заданий` каждые 1-5 минут.

## Google Sheets

Для синхронизации таблица должна быть доступна для чтения, а листы должны содержать:

- `Справочник материалов`
- `История расчётов`

Синхронизация вызывается из финансового модуля фронтенда.

Если нужно быстро заполнить новую Google Sheets таблицу демонстрационными данными из базы:

```powershell
python manage.py export_google_sheets_templates
```

CSV-файлы появятся в `E:\Project\exports\google-sheets`. Их можно импортировать в листы:

- `Справочник материалов`
- `История расчётов`
