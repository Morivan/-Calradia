# Руководство разработчика — Кузница Кальрадия

## Содержание

1. [Стек технологий](#1-стек-технологий)
2. [Структура проекта](#2-структура-проекта)
3. [Локальная разработка](#3-локальная-разработка)
4. [Архитектура](#4-архитектура)
5. [Бэкенд: модели и API](#5-бэкенд-модели-и-api)
6. [Фронтенд: компоненты](#6-фронтенд-компоненты)
7. [Добавление новых функций](#7-добавление-новых-функций)
8. [Тесты](#8-тесты)
9. [Деплой](#9-деплой)
10. [Переменные окружения](#10-переменные-окружения)
11. [Интеграции](#11-интеграции)

---

## 1. Стек технологий

| Слой | Технология |
|------|-----------|
| Фронтенд | React 18, TypeScript, Vite 5 |
| Иконки | Lucide React |
| Бэкенд | Python 3.12, Django 5.x, Django REST Framework 3.x |
| БД (prod) | PostgreSQL / SQLite |
| Статика | WhiteNoise + Brotli |
| Веб-сервер | Nginx + Gunicorn |
| CORS | django-cors-headers |

---

## 2. Структура проекта

```
-Calradia/
├── backend/                # Django-проект
│   ├── settings.py         # Конфигурация
│   ├── urls.py             # Корневой URLconf
│   └── wsgi.py
├── workshop/               # Основное Django-приложение
│   ├── models.py           # Все модели БД
│   ├── views.py            # Все API-вьюхи
│   ├── urls.py             # API-маршруты
│   ├── serializers.py      # DRF-сериализаторы (Product, Review, IntegrationLink)
│   ├── admin.py            # Настройка Django Admin
│   ├── services/
│   │   ├── telegram.py     # Отправка сообщений и репостов в Telegram
│   │   └── vk.py           # Парсинг постов ВКонтакте
│   ├── management/commands/
│   │   ├── notify_urgent_orders.py     # Крон-задача: email о дедлайнах
│   │   ├── seed_demo_data.py           # Заполнение БД тестовыми данными
│   │   ├── fetch_vk_posts.py           # Разовая подгрузка постов из VK RSS
│   │   └── poll_telegram.py            # Разовый polling Telegram-бота
│   └── tests/
│       ├── test_integration.py         # Интеграционные тесты API
│       └── test_unit.py                # Юнит-тесты моделей и хелперов
├── src/                    # React-приложение
│   ├── main.tsx            # Точка входа
│   ├── App.tsx             # Корневой компонент, маршрутизация состояний
│   ├── api.ts              # apiFetch + defaultLinks
│   ├── types.ts            # TypeScript-интерфейсы
│   ├── styles.css          # Глобальные стили (CSS custom properties)
│   └── components/
│       ├── Header.tsx          # Шапка, кнопка входа
│       ├── Sidebar.tsx         # Фильтры каталога
│       ├── ProductCard.tsx     # Карточка в сетке
│       ├── ProductDetail.tsx   # Страница товара с галереей
│       ├── ProductFormModal.tsx # Форма добавления/редактирования товара
│       ├── WorkshopPanel.tsx   # Вся панель мастерской (вкладки)
│       ├── AdminModule.tsx     # Управление каталогом
│       ├── LoginPage.tsx       # Форма входа
│       ├── Footer.tsx
│       ├── FiltersPanel.tsx
│       ├── SortControl.tsx
│       ├── VKGroupFeed.tsx     # Блок новостей из VK
│       ├── WorkshopServices.tsx
│       └── NewsAdmin.tsx       # Управление новостями
├── docs/                   # Документация
│   ├── user-guide.md
│   └── developer-guide.md
├── manage.py
├── requirements.txt
├── package.json
├── vite.config.ts
└── .env.example
```

---

## 3. Локальная разработка

### Требования

- Python 3.11+
- Node.js 20+
- (опционально) PostgreSQL — для точного воспроизведения prod

### Первый запуск

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd -Calradia

# 2. Создать виртуальное окружение и установить зависимости
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Настроить переменные окружения
cp .env.example .env
# Отредактировать .env: минимально нужен только DJANGO_SECRET_KEY

# 4. Создать БД и суперадмина
python manage.py migrate
python manage.py createsuperuser

# 5. (опционально) Заполнить БД демо-данными
python manage.py seed_demo_data

# 6. Запустить сервер Django
python manage.py runserver
```

```bash
# В отдельном терминале — запустить Vite dev-сервер
npm install
npm run dev
```

- Django API: `http://127.0.0.1:8000`
- React SPA: `http://localhost:5173`

В dev-режиме Vite проксирует запросы `/api/*` на Django через `vite.config.ts`. Фронтенд работает с `base: '/'`, в проде — `base: '/static/'`.

### Типичный рабочий цикл

1. Изменить модель → создать миграцию: `python manage.py makemigrations`
2. Применить миграцию: `python manage.py migrate`
3. Изменить/добавить вьюху → поправить URL в `workshop/urls.py`
4. Изменить фронтенд → Vite подхватит изменения автоматически
5. Запустить тесты: `python manage.py test workshop`

---

## 4. Архитектура

```
Браузер (React SPA)
        │
        │  GET /static/*   (HTML, JS, CSS из Vite dist)
        │  GET/POST /api/* (JSON API)
        ▼
    Nginx
        │  /static/*  → WhiteNoise (Django собирает статику)
        │  /api/*      → Gunicorn → Django + DRF
        │  /*          → index.html (SPA-роутинг)
        ▼
    Django
        ├── workshop/views.py    (все API-классы)
        ├── workshop/models.py   (ORM)
        └── services/            (Telegram, VK)
```

### Аутентификация

Используется стандартная Django-сессия (`SessionMiddleware`) + CSRF-защита. Фронтенд хранит токен CSRF в cookie `csrftoken` и отправляет его в заголовке `X-CSRFToken` для всех небезопасных методов (POST/PATCH/DELETE).

Хелпер `apiFetch(url, options)` в `src/api.ts` делает это автоматически.

Проверка прав в вьюхах:
- Публичный доступ: не требует аутентификации
- Сотрудник: `_is_staff(request)` → `is_authenticated AND is_staff`
- Суперадмин: `request.user.is_superuser`

### Инициализация данных

При загрузке приложения фронтенд делает единственный запрос `GET /api/bootstrap/`, получая сразу все товары, отзывы и внешние ссылки. Это минимизирует количество round-trip запросов при первом рендере.

---

## 5. Бэкенд: модели и API

### Модели (`workshop/models.py`)

| Модель | Основные поля |
|--------|---------------|
| `Product` | `slug`, `name`, `category`, `status`, `price_from`, `gallery` (JSON), `sizes` (JSON) |
| `ProductSet` | `slug`, `name`, `products` (M2M), `price_from` |
| `Review` | `product` (FK), `author`, `rating` (1–5), `review_date` |
| `Client` | `name`, `vk_url`, `status` (Потенциальный / Действующий / Завершён) |
| `Order` | `client` (FK), `order_type` (product/set/service), `status`, `total`, `advance`, `deadline` |
| `Task` | `order` (FK), `product` (FK), `status` (pending/taken/done), `assigned_to` (FK User) |
| `MasterApproval` | `master` (FK User), `product` (FK) — unique_together |
| `Material` | `type`, `direction`, `stock`, `min_stock`, `price` |
| `VKPost` | `post_id`, `text`, `photo_url`, `posted_at` |
| `IntegrationLink` | `key`, `label`, `url` — настраивается через Admin |

Все модели (кроме `MasterApproval` и `VKPost`) наследуют `TimestampedModel` с полями `created_at`/`updated_at`.

### Хелперы в `views.py`

```python
_is_staff(request)          # bool: аутентифицирован + is_staff
_parse_int(value, default)  # безопасный int() с дефолтом
_parse_deadline(raw)        # строка "DD.MM.YYYY" или "YYYY-MM-DD" → date
_product_kwargs(data)       # camelCase → snake_case для полей Product
_unique_slug(name)          # генерирует slug с uuid-суффиксом
```

### Публичные эндпоинты

| Метод | URL | Вьюха |
|-------|-----|-------|
| `GET` | `/api/bootstrap/` | `BootstrapView` |
| `GET` | `/api/catalog/products/` | `ProductListCreateView` |
| `GET` | `/api/catalog/products/{id}/` | `ProductDetailView` |
| `POST` | `/api/catalog/products/{id}/reviews/` | `ReviewCreateView` |
| `GET` | `/api/vk-posts/` | `VKPostsView` |
| `POST` | `/api/auth/login/` | `AuthView` |
| `POST` | `/api/auth/logout/` | `LogoutView` |
| `GET` | `/api/auth/me/` | `MeView` |

### Эндпоинты мастерской (требуют `is_staff`)

| Метод | URL | Вьюха |
|-------|-----|-------|
| `GET` | `/api/workshop/dashboard/` | `WorkshopDashboardView` |
| `GET/POST` | `/api/workshop/orders/` | `WorkshopOrdersView` |
| `PATCH/DELETE` | `/api/workshop/orders/{id}/` | `WorkshopOrderDetailView` |
| `POST` | `/api/workshop/orders/create/` | `WorkshopOrderCreateView` |
| `GET/POST` | `/api/workshop/clients/` | `WorkshopClientsView` |
| `PATCH` | `/api/workshop/clients/{id}/` | `WorkshopClientDetailView` |
| `GET` | `/api/workshop/materials/` | `WorkshopMaterialsView` |
| `PATCH` | `/api/workshop/materials/{id}/` | `WorkshopMaterialDetailView` |
| `GET/POST` | `/api/workshop/sets/` | `WorkshopSetsView` |
| `GET/PATCH/DELETE` | `/api/workshop/sets/{id}/` | `WorkshopSetDetailView` |
| `GET` | `/api/workshop/tasks/` | `WorkshopTasksView` |
| `PATCH` | `/api/workshop/tasks/{id}/` | `WorkshopTaskDetailView` |
| `GET/POST` | `/api/workshop/approvals/` | `WorkshopApprovalsView` |
| `GET` | `/api/workshop/users/` | `WorkshopUsersView` |
| `POST/PATCH/DELETE` | `/api/catalog/products/` и `/{id}/` | `ProductListCreateView`, `ProductDetailView` |

### Вебхуки

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/api/integrations/vk/callback/` | `VkCallbackView` — Callback API ВКонтакте |
| `POST` | `/api/integrations/telegram/webhook/` | `TelegramWebhookView` — Telegram-бот |

---

## 6. Фронтенд: компоненты

### Поток данных

```
App.tsx
  ├── useEffect → GET /api/bootstrap/ → products, links, reviews
  ├── GET /api/auth/me/ → user (или null)
  │
  ├── view === 'catalog'  → Header + Sidebar + ProductCard[]
  ├── view === 'detail'   → ProductDetail
  ├── view === 'login'    → LoginPage
  └── view === 'admin'    → WorkshopPanel
```

Состояние приложения (выбранный товар, фильтры, авторизованный пользователь) хранится в `App.tsx` и передаётся вниз через props.

### Ключевые компоненты

**`App.tsx`** — точка входа. Управляет текущим `view`, списком товаров, фильтрами, пагинацией. Делает начальный bootstrap-запрос.

**`WorkshopPanel.tsx`** — вся панель мастерской. Содержит логику вкладок, kanban-доски, форм создания заказа (`NewOrderModal`), задач, клиентов, допусков. Самый большой компонент.

**`ProductDetail.tsx`** — карточка товара. Управляет активным изображением в галерее и состоянием лайтбокса.

**`ProductFormModal.tsx`** — форма создания/редактирования товара. Вызывается из `AdminModule.tsx`.

**`Sidebar.tsx`** — фильтры каталога. Принимает callback для изменения `Filters` в `App.tsx`.

### API-вызовы

Все запросы к бэкенду делаются через `apiFetch()` из `src/api.ts`:

```ts
import { apiFetch } from '../api';

// GET-запрос (без CSRF)
const res = await apiFetch('/api/workshop/orders/');

// POST-запрос (с CSRF)
const res = await apiFetch('/api/workshop/orders/create/', {
  method: 'POST',
  body: JSON.stringify({ client_name: 'Иван', ... }),
});
```

### Типы (`src/types.ts`)

Основные интерфейсы:
- `Product` — поля товара (camelCase, соответствует ответу `ProductSerializer`)
- `ExternalLinks` — ссылки из bootstrap (`telegramOrder`, `vkCommunity` и др.)
- `BootstrapPayload` — ответ `/api/bootstrap/`
- `AuthUser` — авторизованный пользователь

---

## 7. Добавление новых функций

### Новая модель

1. Добавить класс в `workshop/models.py`.
2. Создать миграцию: `python manage.py makemigrations`.
3. Применить: `python manage.py migrate`.
4. (Опционально) зарегистрировать в `workshop/admin.py`.

### Новый API-эндпоинт

1. Создать вьюху в `workshop/views.py`:

```python
class MyNewView(APIView):
    def get(self, request):
        if not _is_staff(request):
            return Response({"detail": "Требуется авторизация."}, status=status.HTTP_401_UNAUTHORIZED)
        data = MyModel.objects.all()
        return Response([...])
```

2. Добавить маршрут в `workshop/urls.py`:

```python
path("workshop/mymodel/", MyNewView.as_view(), name="my-new-view"),
```

### Новый фронтенд-компонент

1. Создать файл `src/components/MyComponent.tsx`.
2. Добавить вызов `apiFetch` для получения данных.
3. Подключить через `App.tsx` или `WorkshopPanel.tsx`.

### Новая вкладка в панели мастерской

Панель `WorkshopPanel.tsx` управляет вкладками через внутренний массив `tabs`. Добавить новую вкладку:

1. Добавить элемент в массив `tabs`.
2. Добавить условный рендер в `return` вьюхи по значению `activeTab`.

---

## 8. Тесты

### Запуск всех тестов

```bash
python manage.py test workshop
```

### Запуск отдельных модулей

```bash
python manage.py test workshop.tests.test_integration
python manage.py test workshop.tests.test_unit
```

### Структура тестов

- `test_integration.py` — тесты API через `APIClient`. Проверяют статус-коды, структуру ответов, авторизацию.
- `test_unit.py` — тесты моделей, хелперов (`_parse_int`, `_parse_deadline`) и бизнес-логики.

### Пример нового теста

```python
from django.test import TestCase, tag
from rest_framework.test import APIClient
from django.contrib.auth.models import User

@tag("integration")
class MyFeatureTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.staff = User.objects.create_user("staff", is_staff=True, password="pw")

    def test_endpoint_requires_auth(self):
        res = self.api.get("/api/workshop/mymodel/")
        self.assertEqual(res.status_code, 401)

    def test_endpoint_returns_data_for_staff(self):
        self.api.force_authenticate(self.staff)
        res = self.api.get("/api/workshop/mymodel/")
        self.assertEqual(res.status_code, 200)
```

---

## 9. Деплой

### Сборка

```bash
# 1. Получить изменения
git pull origin main

# 2. Установить Python-зависимости (если изменился requirements.txt)
source venv/bin/activate
pip install -r requirements.txt

# 3. Собрать фронтенд
npm ci
npm run build

# 4. Собрать статику Django
python manage.py collectstatic --noinput

# 5. Применить миграции
python manage.py migrate

# 6. Перезапустить приложение
systemctl restart calradia
```

### Конфигурация Nginx (пример)

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    location /static/ {
        alias /var/www/calradia/staticfiles/;
        expires 30d;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```

### Systemd-сервис (пример)

```ini
[Unit]
Description=Calradia Gunicorn
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/calradia
ExecStart=/var/www/calradia/venv/bin/gunicorn backend.wsgi:application \
    --bind 127.0.0.1:8000 --workers 3
EnvironmentFile=/var/www/calradia/.env
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Cron: уведомления о дедлайнах

```bash
crontab -e
# Каждый день в 09:00:
0 9 * * * cd /var/www/calradia && source venv/bin/activate && python manage.py notify_urgent_orders >> /var/log/calradia-notify.log 2>&1
```

---

## 10. Переменные окружения

Скопировать `.env.example` → `.env`, заполнить нужные значения.

| Переменная | Обязательна | Описание |
|------------|:-----------:|----------|
| `DJANGO_SECRET_KEY` | Prod | Секретный ключ Django |
| `DJANGO_DEBUG` | — | `true` для dev, `false` для prod (по умолчанию `false`) |
| `DJANGO_ALLOWED_HOSTS` | Prod | Домены через запятую: `example.com` |
| `CSRF_TRUSTED_ORIGINS` | Prod | Полные URL через запятую: `https://example.com` |
| `USE_HTTPS` | — | `true` включает `Secure` на session/CSRF cookies |
| `TELEGRAM_BOT_TOKEN` | — | Токен бота (от @BotFather) |
| `TELEGRAM_CHANNEL_ID` | — | ID канала для репостов VK→Telegram |
| `TELEGRAM_PUBLIC_URL` | — | Публичная ссылка на Telegram-канал |
| `VK_CALLBACK_SECRET` | — | Секретный ключ Callback API ВКонтакте |
| `VK_CONFIRMATION_TOKEN` | — | Строка подтверждения от ВКонтакте |
| `VK_COMMUNITY_URL` | — | Ссылка на сообщество VK |
| `VK_MESSAGES_URL` | — | Ссылка на диалоги сообщества VK |
| `EMAIL_HOST` | — | SMTP-сервер (например `smtp.yandex.ru`) |
| `EMAIL_PORT` | — | Порт (465 для SSL) |
| `EMAIL_USE_SSL` | — | `true` для SSL |
| `EMAIL_HOST_USER` | — | Логин почты |
| `EMAIL_HOST_PASSWORD` | — | Пароль приложения |
| `ADMIN_NOTIFICATION_EMAIL` | — | Почта получателя уведомлений о дедлайнах |

---

## 11. Интеграции

### ВКонтакте → Telegram (автопубликация)

1. Создать Telegram-бота через @BotFather, добавить в канал с правом публиковать.
2. Прописать `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHANNEL_ID`.
3. В настройках группы ВК → **Работа с API → Callback API** добавить сервер:
   - URL: `https://your-domain.com/api/integrations/vk/callback/`
   - Тип событий: `Новая запись на стене`
4. Прописать `VK_CONFIRMATION_TOKEN` и `VK_CALLBACK_SECRET`.

Логика: при новом посте на стене ВКонтакте вызывает `VkCallbackView.post()`, пост сохраняется в `VKPost`, и текст с фотографией пересылается в Telegram-канал через `repost_to_channel()`.

### Внешние ссылки

Управляются через Django Admin (`/admin/`) → **Integration links**:

| Key | Описание |
|-----|----------|
| `telegram_order` | Ссылка на контакт/бота для заказа |
| `telegram_public` | Публичный Telegram-канал |
| `vk_community` | Страница сообщества ВКонтакте |
| `vk_messages` | Диалоги сообщества ВКонтакте |

Если запись для ключа отсутствует, используется соответствующая переменная окружения как дефолт.
