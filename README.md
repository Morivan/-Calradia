# Кузница Кальрадия

Веб-приложение для онлайн-каталога средневековых доспехов и реконструкторского снаряжения с административной панелью управления, приёмом заявок через Яндекс.Формы и интеграциями с ВКонтакте и Telegram.

## Архитектура

**Тип:** Клиент-серверное SPA (Single Page Application)

| Слой | Технология |
|------|-----------|
| Фронтенд | React 18 + TypeScript, Vite, Lucide Icons |
| Бэкенд | Python 3.12, Django 5.x, Django REST Framework |
| База данных | PostgreSQL |
| Веб-сервер | Nginx + Gunicorn |
| Развёртывание | Timeweb Cloud VPS (Ubuntu 24.04) |

```
┌──────────────────────────────────────────────────────┐
│                      Браузер                         │
│  React SPA (каталог, карточка товара, админ-панель)  │
└──────────┬───────────────────────────┬───────────────┘
           │ /api/*                    │ webhook
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│   Django + DRF      │     │   Яндекс.Формы      │
│  (каталог, авторизация,   │  (заявки клиентов)  │
│   вебхуки, новости) │     └─────────────────────┘
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌──────────┐   ┌─────────────────┐
│   VK   │  │ Telegram │   │  Яндекс.Диск    │
│ группа │→ │  канал   │   │ (таблицы xlsx)  │
│(посты) │  │(репосты) │   └─────────────────┘
└────────┘  └──────────┘
```

## Функциональные модули

### 1. Каталог товаров
- Фильтрация по категории, материалу, эпохе, размеру, статусу и цене
- Полнотекстовый поиск по названию
- Сортировка по цене и популярности
- Детальная карточка: галерея, историческая справка, характеристики, лайтбокс для просмотра фото

### 2. Административная панель
- Авторизация через встроенную форму (сессионная аутентификация Django)
- Добавление, редактирование, удаление товаров
- Отображается только авторизованным сотрудникам (`is_staff`)

### 3. Приём заявок
- Интеграция с Яндекс.Формами через webhook (`/api/webhook/client-order/`)
- Автоматическое создание записей клиентов и заказов в БД
- Параллельная запись данных в таблицы на Яндекс.Диске (xlsx)

### 4. Автопубликация
- Приём новых постов со стены ВКонтакте через Callback API (`wall_post_new`)
- Сохранение публикаций в БД (модель `VKPost`) и отображение в блоке новостей на сайте
- Автоматический репост в Telegram-канал через бота

## Модели данных

| Модель | Назначение |
|--------|-----------|
| `Product` | Товар каталога |
| `Review` | Отзыв на товар |
| `Client` | Клиент мастерской |
| `Order` | Заказ |
| `VKPost` | Пост из ВКонтакте |
| `Colleague` | Сотрудник мастерской |
| `Material` | Материал (справочник) |
| `IntegrationLink` | Внешние ссылки (VK, Telegram, Яндекс.Форма) |

## API

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/api/bootstrap/` | Начальная загрузка данных сайта |
| `GET` | `/api/catalog/products/` | Список товаров |
| `POST` | `/api/catalog/products/` | Создать товар (требует авторизации) |
| `GET` | `/api/catalog/products/{id}/` | Карточка товара |
| `PATCH` | `/api/catalog/products/{id}/` | Обновить товар (требует авторизации) |
| `DELETE` | `/api/catalog/products/{id}/` | Удалить товар (требует авторизации) |
| `POST` | `/api/catalog/products/{id}/reviews/` | Оставить отзыв |
| `POST` | `/api/auth/login/` | Вход |
| `POST` | `/api/auth/logout/` | Выход |
| `GET` | `/api/auth/me/` | Текущий пользователь |
| `GET` | `/api/vk-posts/` | Список постов ВКонтакте |
| `POST` | `/api/integrations/telegram/webhook/` | Вебхук Telegram-бота |
| `POST` | `/api/integrations/vk/callback/` | Callback API ВКонтакте |
| `POST` | `/api/webhook/client-order/?token=TOKEN` | Яндекс.Форма: клиент + заказ |
| `POST` | `/api/webhook/client/?token=TOKEN` | Яндекс.Форма: только клиент |
| `POST` | `/api/webhook/material/?token=TOKEN` | Яндекс.Форма: новый материал |
| `POST` | `/api/webhook/colleague/?token=TOKEN` | Яндекс.Форма: новый сотрудник |

## Локальная разработка

### Требования

- Python 3.11+
- Node.js 20+

### Запуск

**1. Backend:**

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # заполнить при необходимости
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend доступен по адресу `http://127.0.0.1:8000`.

**2. Frontend (в отдельном терминале):**

```bash
npm install
npm run dev
```

Frontend с горячей перезагрузкой: `http://localhost:5173`.
API-запросы проксируются на Django автоматически.

### Тесты

```bash
python manage.py test workshop
```

## Продакшн-деплой (Nginx + Gunicorn)

```bash
# 1. Собрать фронтенд
npm run build

# 2. Собрать статику Django
source venv/bin/activate
python manage.py collectstatic --noinput

# 3. Применить миграции
python manage.py migrate

# 4. Перезапустить сервис
systemctl restart calradia
```

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения.

| Переменная | Описание |
|---|---|
| `DJANGO_SECRET_KEY` | Секретный ключ Django (обязателен в prod) |
| `DJANGO_DEBUG` | `true` для dev, `false` для prod |
| `DJANGO_ALLOWED_HOSTS` | Домены через запятую: `example.com` |
| `CSRF_TRUSTED_ORIGINS` | Полные URL через запятую: `https://example.com` |
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `USE_HTTPS` | `true` если настроен SSL (включает `Secure` на cookies) |
| `TELEGRAM_BOT_TOKEN` | Токен бота из @BotFather |
| `TELEGRAM_CHANNEL_ID` | ID канала для репостов из VK |
| `VK_CALLBACK_SECRET` | Секретный ключ Callback API ВКонтакте |
| `VK_CONFIRMATION_TOKEN` | Строка подтверждения от ВКонтакте |
| `WEBHOOK_TOKEN` | Токен защиты webhook-эндпоинтов Яндекс.Форм |
| `YANDEX_DISK_TOKEN` | OAuth-токен Яндекс.Диска |
| `YANDEX_ORDERS_TABLE_PATH` | Путь к файлу заказов на Яндекс.Диске |
| `YANDEX_CLIENTS_TABLE_PATH` | Путь к файлу клиентов на Яндекс.Диске |

## Настройка интеграций

### ВКонтакте → Telegram

1. Создать бота в @BotFather, добавить в Telegram-канал с правом публиковать.
2. Прописать `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHANNEL_ID`.
3. В настройках группы ВК → **Работа с API → Callback API** добавить сервер:
   - URL: `https://your-domain.com/api/integrations/vk/callback/`
   - Тип событий: `Новая запись на стене`
4. Прописать `VK_CONFIRMATION_TOKEN` и `VK_CALLBACK_SECRET`.

### Яндекс.Формы → заявки

1. Создать форму в [Яндекс.Формах](https://forms.yandex.ru).
2. Настроить **Интеграции → HTTP-запрос** (метод `POST`):
   - URL: `https://your-domain.com/api/webhook/client-order/?token=TOKEN`
3. Данные из формы автоматически попадут в БД (модели `Client` и `Order`).

### Ссылки на внешние сервисы

Настраиваются через Django-админку (`/admin/`) в разделе **Integration links**:

| Key | Описание |
|-----|----------|
| `yandex_form` | URL Яндекс.Формы для заказа (с `?iframe=1`) |
| `telegram_order` | Ссылка для связи при заказе |
| `telegram_public` | Публичный Telegram-канал |
| `vk_community` | Страница сообщества ВКонтакте |
| `vk_messages` | Диалоги сообщества ВКонтакте |
