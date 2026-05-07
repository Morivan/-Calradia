# Кузница Кальрадия

Веб-сайт-витрина кузнечной мастерской: публичный каталог доспехов с формой заказа
и административной панелью управления каталогом.

**Стек:** React 19 + Vite (TypeScript) · Django 5.2 + DRF · SQLite · WhiteNoise

## Архитектура

```
┌──────────────────────────────────────────────────────┐
│                    Браузер                           │
│  React SPA (каталог, карточка товара, форма заказа)  │
└──────────┬──────────────────────────────┬────────────┘
           │ /api/*                       │ Яндекс Формы
           ▼                              ▼   (iframe)
┌─────────────────────┐         ┌───────────────────┐
│  Django + DRF       │         │  Яндекс Таблицы   │
│  (каталог, авторизация,│        │  (заказы клиентов)│
│   вебхуки)          │         └───────────────────┘
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌──────────┐
│   VK   │  │ Telegram │
│ группа │→ │  канал   │
│(посты) │  │(репосты) │
└────────┘  └──────────┘
```

### Ключевые компоненты

| Модуль | Описание |
|--------|----------|
| Каталог | Фильтрация, поиск, сортировка, карточка товара с галереей и отзывами |
| Форма заказа | Яндекс Форма в модальном окне (iframe), ответы → Яндекс Таблицы |
| Управление каталогом | CRUD товаров через Django-сессию (доступен сотрудникам) |
| VK → Telegram | VK Callback API принимает `wall_post_new` и пересылает в Telegram-канал |
| Telegram webhook | Эндпоинт для входящих обновлений от бота |

## Локальная разработка

### Требования

- Python 3.11+
- Node.js 20+

### Запуск

**1. Backend:**

```bash
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
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

39 тестов (unit + integration), все проходят.

## Продакшн-деплой

```bash
# 1. Сгенерировать секретный ключ
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# 2. Заполнить .env (см. .env.example)

# 3. Собрать фронтенд и статику
npm run build
python manage.py collectstatic --noinput

# 4. Применить миграции
python manage.py migrate

# 5. Запустить приложение
gunicorn backend.wsgi --bind 0.0.0.0:8000
# или
uvicorn backend.asgi:application --host 0.0.0.0 --port 8000
```

WhiteNoise раздаёт статику (Django admin + собранный React) напрямую из Django.
За nginx-прокси `SECURE_SSL_REDIRECT` оставить `false` — редирект на HTTPS делает прокси.

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения.

| Переменная | Обязательна | Описание |
|---|:---:|---|
| `DJANGO_SECRET_KEY` | В prod | Секретный ключ Django |
| `DJANGO_DEBUG` | — | `true` для dev, `false` для prod (по умолчанию `false`) |
| `DJANGO_ALLOWED_HOSTS` | В prod | Домены через запятую: `example.com,www.example.com` |
| `CSRF_TRUSTED_ORIGINS` | В prod | Полные URL через запятую: `https://example.com` |
| `CORS_ALLOWED_ORIGINS` | В prod | Полные URL через запятую: `https://example.com` |
| `TELEGRAM_BOT_TOKEN` | Для TG | Токен бота из @BotFather |
| `TELEGRAM_CHANNEL_ID` | Для TG | ID канала для репостов из VK, напр. `@your_channel` |
| `TELEGRAM_PUBLIC_URL` | — | Публичная ссылка на Telegram-канал |
| `VK_CALLBACK_SECRET` | Для VK | Секретный ключ Callback API (настройки группы ВК) |
| `VK_CONFIRMATION_TOKEN` | Для VK | Строка подтверждения от ВКонтакте |
| `VK_COMMUNITY_URL` | — | Ссылка на сообщество ВКонтакте |
| `VK_MESSAGES_URL` | — | Ссылка на диалоги сообщества ВКонтакте |

## Настройка интеграций

### VK → Telegram

1. Создать бота в @BotFather, добавить в Telegram-канал с правом публиковать.
2. Прописать `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHANNEL_ID`.
3. В настройках группы ВК → **Работа с API → Callback API** добавить сервер:
   - URL: `https://your-domain.com/api/integrations/vk/callback/`
   - Тип событий: `Новая запись на стене`
4. Прописать `VK_CONFIRMATION_TOKEN` (выдаётся ВКонтакте при добавлении сервера).
5. Опционально: установить `VK_CALLBACK_SECRET` в настройках группы ВК и в `.env`.

### Яндекс Форма для заказов

1. Создать форму в [Яндекс Формах](https://forms.yandex.ru), связать с Яндекс Таблицей.
2. В Django-админке (`/admin/`) создать объект **Integration link**:
   - Key: `yandex_form`
   - URL: `https://forms.yandex.ru/cloud/FORM_ID/?iframe=1`
3. Форма появится в модальном окне на странице каждого товара.

### Ссылки на VK и Telegram

Все внешние ссылки настраиваются через **Integration links** в Django-админке
(или через переменные окружения как дефолты).

| Key | Описание |
|-----|----------|
| `telegram_order` | Ссылка для связи при заказе |
| `telegram_public` | Публичный Telegram-канал |
| `vk_community` | Страница сообщества ВК |
| `vk_messages` | Диалоги сообщества ВК |
| `yandex_form` | URL Яндекс Формы (с `?iframe=1`) |

## API

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/api/bootstrap/` | Продукты, отзывы и ссылки одним запросом |
| `GET` | `/api/catalog/products/` | Список товаров |
| `POST` | `/api/catalog/products/` | Создать товар (требует авторизации) |
| `GET` | `/api/catalog/products/{id}/` | Карточка товара |
| `PATCH` | `/api/catalog/products/{id}/` | Обновить товар (требует авторизации) |
| `DELETE` | `/api/catalog/products/{id}/` | Удалить товар (требует авторизации) |
| `POST` | `/api/catalog/products/{id}/reviews/` | Оставить отзыв |
| `POST` | `/api/auth/login/` | Вход |
| `POST` | `/api/auth/logout/` | Выход |
| `GET` | `/api/auth/me/` | Текущий пользователь |
| `GET` | `/api/csrf/` | Установить CSRF-куку |
| `POST` | `/api/integrations/telegram/webhook/` | Вебхук Telegram-бота |
| `POST` | `/api/integrations/vk/callback/` | Callback API ВКонтакте |
