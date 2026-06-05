#!/usr/bin/env python3
"""
Script to generate Руководство программиста (Developer's Guide)
for the "Кузница Кальрадии" web project.
"""
import shutil
import sys
from docx import Document

SRC = "/root/.claude/uploads/707db347-566c-45fe-9af7-3c903647782c/55d68cec-__________________________________.docx"
DST = "/home/user/-Calradia/docs/rukovodstvo_programmista.docx"

# Step 1: copy template to destination
shutil.copy2(SRC, DST)
print(f"Copied template → {DST}")

# Step 2: open with python-docx
doc = Document(DST)
total = len(doc.paragraphs)
print(f"Total paragraphs in template: {total}")

# Helper: replace text in paragraph while preserving run formatting
def set_para(doc, index, text):
    p = doc.paragraphs[index]
    if p.runs:
        p.runs[0].text = text
        for r in p.runs[1:]:
            r.text = ''
    else:
        p.add_run(text)

# Helper for bold title paragraph (para [9]): preserve bold on first run
def set_para_bold(doc, index, text):
    p = doc.paragraphs[index]
    if p.runs:
        run0 = p.runs[0]
        run0.text = text
        # Ensure bold is preserved
        run0.bold = True
        for r in p.runs[1:]:
            r.text = ''
    else:
        r = p.add_run(text)
        r.bold = True

# DEBUG: print current paragraphs around key indices
print("\n--- Current paragraphs (indices 8-13, 23-30, 48-62, 74-110) ---")
for i in [8, 9, 10, 11, 12, 13]:
    p = doc.paragraphs[i]
    print(f"  [{i}] style='{p.style.name}' text='{p.text[:80]}'")

# ── Title page fixes ─────────────────────────────────────────────────────────
# Para [9]: fix typo ПРОГРАМНОГО→ПРОГРАММНОГО, remove double space
set_para_bold(doc, 9,
    'РАЗРАБОТКА ПРОГРАММНОГО КОМПЛЕКСА ДЛЯ ПОДДЕРЖКИ БИЗНЕС-ПРОЦЕССОВ '
    'ПРОИЗВОДСТВА СРЕДНЕВЕКОВЫХ ДОСПЕХОВ И РЕКОНСТРУКТОРСКОГО СНАРЯЖЕНИЯ')

# Para [12]: fix profile line
set_para(doc, 12,
    'направленность (профиль) Программное обеспечение вычислительной техники '
    'и автоматизированных систем')

# ── Section 1 — Назначение ───────────────────────────────────────────────────
set_para(doc, 24, '1 Назначение')
set_para(doc, 25,
    'Настоящее руководство адресовано разработчикам, которые занимаются '
    'сопровождением и развитием программного комплекса «Кузница Кальрадия» '
    'после сдачи системы в промышленную эксплуатацию. Документ охватывает '
    'архитектурное устройство комплекса, спецификацию ключевых модулей '
    'серверной и клиентской частей, а также описание форматов данных, которыми '
    'обмениваются компоненты.')
set_para(doc, 26,
    'Для продуктивной работы с документом читатель должен владеть следующими '
    'технологиями: серверная веб-разработка на Python с фреймворком Django и '
    'расширением Django REST Framework; фронтенд-разработка на React 19 с '
    'TypeScript; базовое понимание клиент-серверного взаимодействия по '
    'HTTP/REST; работа с СУБД через ORM (Django ORM над SQLite); развёртывание '
    'приложений на Linux-серверах (Nginx + Gunicorn + systemd).')
set_para(doc, 27,
    'Руководство не воспроизводит содержание пояснительной записки к ВКР и '
    'технического задания. Упомянутые документы содержат обоснование принятых '
    'решений, диаграммы и пользовательские требования — настоящее руководство '
    'сосредоточено на деталях реализации, необходимых при внесении изменений в '
    'код.')
set_para(doc, 28,
    'Документы, которые следует использовать совместно с настоящим '
    'руководством: пояснительная записка к ВКР (архитектурные схемы, '
    'ER-диаграмма, диаграмма вариантов использования), техническое задание '
    '(исходные требования), репозиторий Git с актуальным исходным кодом, '
    'официальная документация Django 5.2, Django REST Framework 3.16, '
    'React 19 и Vite 7.')

# ── Термины и сокращения ─────────────────────────────────────────────────────
set_para(doc, 29, 'Термины и сокращения')
set_para(doc, 30,
    'API — Application Programming Interface — программный интерфейс '
    'взаимодействия программных компонентов.')
set_para(doc, 31,
    'CSRF — Cross-Site Request Forgery — межсайтовая подделка запроса; атака, '
    'от которой защищают CSRF-токены.')
set_para(doc, 32,
    'DRF — Django REST Framework — расширение Django для построения REST API.')
set_para(doc, 33,
    'HMR — Hot Module Replacement — горячая замена модулей в dev-сборке Vite '
    'без перезагрузки страницы.')
set_para(doc, 34,
    'JSON — JavaScript Object Notation — текстовый формат сериализации данных.')
set_para(doc, 35,
    'ORM — Object-Relational Mapping — технология отображения таблиц '
    'реляционной БД на классы Python.')
set_para(doc, 36,
    'REST — Representational State Transfer — архитектурный стиль построения '
    'распределённых гипермедиа-систем.')
set_para(doc, 37,
    'SPA — Single Page Application — одностраничное приложение; навигация '
    'осуществляется без полной перезагрузки страницы.')
set_para(doc, 38,
    'SQLite — встраиваемая реляционная СУБД, используемая в режиме WAL для '
    'минимизации блокировок.')
set_para(doc, 39,
    'WSGI — Web Server Gateway Interface — стандарт взаимодействия '
    'Python-приложения с веб-сервером.')
set_para(doc, 40,
    'Brotli — алгоритм сжатия данных; WhiteNoise применяет его для статических '
    'файлов.')
set_para(doc, 41,
    'Callback API — механизм ВКонтакте, при котором платформа отправляет '
    'POST-запросы на сервер при наступлении событий.')
set_para(doc, 42,
    'Cookie — небольшой фрагмент данных, хранящийся в браузере; используется '
    'для хранения идентификатора сессии.')
set_para(doc, 43,
    'JWT — JSON Web Token — в данном проекте не применяется; используется '
    'сессионная аутентификация Django.')
set_para(doc, 44,
    'MVC — Model-View-Controller — архитектурный шаблон; в Django реализован '
    'как MTV (Model-Template-View).')
set_para(doc, 45,
    'useMemo — хук React для мемоизации вычисляемых значений; применяется для '
    'фильтрации каталога.')
set_para(doc, 46, 'ВКР — выпускная квалификационная работа.')
set_para(doc, 47, 'ОС — операционная система.')
set_para(doc, 48, 'ПО — программное обеспечение.')

# ── Section 2 — Структура ────────────────────────────────────────────────────
set_para(doc, 49, '2 Структура программного комплекса')
set_para(doc, 50,
    'Программный комплекс построен по трёхзвенной клиент-серверной схеме: '
    'Nginx — Gunicorn/Django — SQLite. Nginx принимает все входящие соединения: '
    'статические файлы (React-бандл, CSS) отдаёт напрямую из каталога dist/, '
    'динамические запросы /api/* и /admin/* проксирует на Gunicorn через '
    'UNIX-сокет. Gunicorn управляет пулом воркеров WSGI; Django обрабатывает '
    'запрос через систему middleware, маршрутизирует на нужное представление и '
    'возвращает JSON-ответ.')
set_para(doc, 51, '2.1 Клиентская часть')
set_para(doc, 52,
    'Фронтенд — одностраничное React-приложение, скомпилированное Vite в '
    'статичный бандл. Точка входа — корневой компонент App.tsx, который хранит '
    'всё глобальное состояние (список товаров, фильтры, текущий вид, выбранный '
    'товар, пользователь) и передаёт его дочерним компонентам через props. '
    'Навигация реализована через переключение состояния currentView с поддержкой '
    'браузерной истории (History API: pushState / popstate).')
set_para(doc, 53,
    'Компонентное дерево верхнего уровня: Header, LoginPage, HomePage, '
    'CatalogPage (ProductCard, FiltersPanel), ProductDetail, SetsPage, '
    'ServicesPage, ReviewsPage, WorkshopPanel (AdminModule). HTTP-запросы к '
    'серверу централизованы в функции apiFetch() из src/api.ts, которая '
    'автоматически добавляет X-CSRFToken и credentials: include к каждому '
    'небезопасному запросу.')
set_para(doc, 54, '2.2 Серверная часть')
set_para(doc, 55,
    'Серверная часть организована в двух Django-приложениях. Приложение backend '
    'содержит настройки проекта (settings.py), корневой маршрутизатор (urls.py) '
    'и конфигурацию WSGI. Приложение workshop содержит всю прикладную логику: '
    'модели (models.py), представления (views.py), сериализаторы '
    '(serializers.py), вспомогательные сервисы (services/vk.py) и тесты '
    '(tests/).')
set_para(doc, 56,
    'Центральный эндпоинт GET /api/bootstrap/ возвращает в одном ответе полный '
    'каталог товаров, список отзывов и конфигурационные ссылки — это исключает '
    'необходимость нескольких последовательных запросов при первой загрузке '
    'страницы. Остальные эндпоинты мастерской (/api/workshop/*) доступны только '
    'авторизованным сотрудникам и требуют is_staff=True.')
set_para(doc, 57,
    'Все представления реализованы как классы-наследники APIView из DRF. '
    'Вспомогательные функции _is_staff(request), _parse_deadline(raw), '
    '_parse_int(value, default) вынесены на уровень модуля views.py и '
    'используются несколькими представлениями, что устраняет дублирование кода.')
set_para(doc, 58, '2.3 Взаимодействие компонентов')
set_para(doc, 59,
    'При первом открытии сайта браузер загружает статический бандл с Nginx. '
    'React-приложение инициализируется и немедленно отправляет GET /api/csrf/ '
    'для получения CSRF-cookie и GET /api/bootstrap/ для получения данных '
    'каталога. Оба запроса выполняются параллельно в useEffect на этапе '
    'монтирования корневого компонента.')
set_para(doc, 60,
    'Авторизованный сотрудник открывает WorkshopPanel — каждая вкладка при '
    'первом отображении выполняет собственный запрос к /api/workshop/* через '
    'apiFetch(). Вебхук ВКонтакте POST /api/integrations/vk/callback/ '
    'обрабатывается независимо от основного потока запросов: VkCallbackView '
    'сохраняет пост в модель VKPost и передаёт данные функции '
    'repost_to_channel() из services/vk.py, которая вызывает Telegram Bot API.')

# ── Section 3 — Входные/выходные данные ─────────────────────────────────────
set_para(doc, 61, '3 Спецификация входных и выходных данных')
set_para(doc, 62,
    'Полная ER-диаграмма базы данных приведена в пояснительной записке. Ниже '
    'описаны основные модели данных, актуальные для разработчика при изменении '
    'API или схемы БД.')
set_para(doc, 63, '3.1 Модель Product (Товар)')
set_para(doc, 64,
    'Основная сущность каталога. Ключевые поля: id (автоинкрементный '
    'целочисленный первичный ключ), slug (уникальная строка-идентификатор для '
    'URL), name (название изделия), subtitle (подзаголовок), status (строка из '
    'набора: available, on_order, discontinued), category (категория), era '
    '(исторический период), material (материал), sizes (текстовое поле, '
    'разделитель «,»), price_from (целое число, минимальная цена), lead_time '
    '(строка, срок изготовления). Поля image и gallery хранят пути к файлам.')
set_para(doc, 65, '3.2 Модель Order (Заказ)')
set_para(doc, 66,
    'Производственный заказ мастерской. Поля: id, client (ForeignKey → Client), '
    'order_type (строка: product, set, service), status (строка: new, '
    'in_progress, done, cancelled), deadline (дата), total (целое, полная '
    'сумма), advance (целое, аванс — по умолчанию 50 % от total), notes '
    '(текст), assigned_to (ForeignKey → User, менеджер заказа), created_at. '
    'Связанные задачи создаются автоматически при создании заказа функцией '
    '_create_tasks_for_order().')
set_para(doc, 67, '3.3 Модель Task (Задача)')
set_para(doc, 68,
    'Производственная задача, привязанная к заказу и конкретному изделию. '
    'Поля: id, order (ForeignKey → Order), product (ForeignKey → Product, '
    'nullable для задач типа «услуга»), title (строка), status (строка из '
    'набора: pending, in_progress, done), assigned_to (ForeignKey → User, '
    'nullable), deadline (дата, наследуется от заказа), created_at. Задача '
    'становится видима мастеру, только если у него есть запись MasterApproval '
    'с совпадающим product_id.')
set_para(doc, 69, '3.4 Модель Review (Отзыв)')
set_para(doc, 70,
    'Отзыв клиента. Поля: id, author (строка, имя автора), text (текст), date '
    '(строка, дата в произвольном формате), vk_url (URL записи ВКонтакте, '
    'опционально), photos (текстовое поле, URL через запятую). Создаётся '
    'сотрудниками через панель управления; публичный эндпоинт включён в '
    'bootstrap-ответ.')
set_para(doc, 71, '3.5 Структура ответа GET /api/bootstrap/')
set_para(doc, 72,
    'JSON-объект верхнего уровня содержит три ключа. products — массив '
    'сериализованных Product-объектов; каждый объект включает все поля модели, '
    'а также вычисляемое поле setDiscounts (словарь slug_комплекта → скидка). '
    'reviews — массив объектов Review. links — словарь с двумя строковыми '
    'полями: vkCommunity (ссылка на группу ВКонтакте) и vkMessages (ссылка на '
    'диалог для заказа). Поля total, page, hasNext в ответе отсутствуют: '
    'пагинация не применяется.')
set_para(doc, 73, '3.6 Формат REST-ответов API мастерской')
set_para(doc, 74,
    'Все небезопасные запросы к /api/workshop/* требуют заголовок X-CSRFToken '
    '(значение из cookie csrftoken) и передачу сессионной cookie (credentials: '
    'include). При отсутствии авторизации возвращается HTTP 401. Тело успешного '
    'ответа — JSON с данными ресурса. Ошибки возвращаются как JSON с полем '
    'detail; HTTP-код: 400 для ошибок валидации, 403 для нарушений прав '
    'доступа, 404 для отсутствующих ресурсов.')

# ── Section 4 — Спецификация классов ────────────────────────────────────────
set_para(doc, 75, '4 Спецификация процедур, функций и классов')
set_para(doc, 76,
    'Раздел описывает интерфейсы и контракты ключевых компонентов комплекса. '
    'Полные исходные тексты с актуальными сигнатурами находятся в репозитории; '
    'здесь приводятся назначение, обязательные предусловия и ожидаемое '
    'поведение каждого компонента при сопровождении и доработке.')
set_para(doc, 77, '4.1 Представление BootstrapView (GET /api/bootstrap/)')
set_para(doc, 78,
    'Класс BootstrapView(APIView) — единственное представление с публичным '
    'доступом (authentication_classes и permission_classes не ограничивают). '
    'Метод get(request) формирует и возвращает консолидированный JSON-ответ. '
    'Логика метода: получить QuerySet всех активных товаров, сериализовать через '
    'ProductSerializer, получить все отзывы через ReviewSerializer, прочитать '
    'конфигурационные ссылки из таблицы SiteConfig. Вернуть словарь {products, '
    'reviews, links}.')
set_para(doc, 79,
    'Предусловие: таблица Product содержит хотя бы одну запись (если таблица '
    'пустая — возвращается products: []). Постусловие: ответ HTTP 200 с '
    'корректным JSON-телом. Исключений не выбрасывает; при ошибке базы данных '
    'Django возвращает HTTP 500 через стандартный обработчик.')
set_para(doc, 80,
    'Изменение структуры ответа (добавление нового ключа) выполняется только в '
    'паре с обновлением типа BootstrapPayload в src/types.ts на стороне '
    'фронтенда. Несовпадение версий приводит к молчаливому игнорированию '
    'неизвестных ключей на клиенте — это безопасно при добавлении, но может '
    'вызвать ошибки при удалении существующих ключей.')
set_para(doc, 81,
    '4.2 Представление WorkshopOrderCreateView (POST /api/workshop/orders/)')
set_para(doc, 82,
    'Класс WorkshopOrderCreateView(APIView). Метод post(request) создаёт новый '
    'заказ. Предусловие: запрос выполнен авторизованным сотрудником '
    '(_is_staff(request) == True). Входные данные — JSON-тело с полями: '
    'client_id или {name, phone} для нового клиента, order_type, deadline '
    '(YYYY-MM-DD или DD.MM.YYYY), total, advance_override (необязательно), '
    'notes. При отсутствии advance_override аванс рассчитывается автоматически '
    'как 50 % от total.')
set_para(doc, 83,
    'После создания объекта Order немедленно вызывается '
    '_create_tasks_for_order(order). Для заказа типа product создаётся одна '
    'задача с привязкой к выбранному изделию. Для типа set — по одной задаче '
    'на каждое изделие в составе комплекта. Для типа service — одна задача без '
    'привязки к изделию с произвольным заголовком из поля notes. Постусловие: '
    'HTTP 201 с сериализованным заказом в теле.')
set_para(doc, 84,
    '4.3 Представление VkCallbackView (POST /api/integrations/vk/callback/)')
set_para(doc, 85,
    'Класс VkCallbackView(APIView) с authentication_classes=[] и '
    'permission_classes=[] — вебхук не требует авторизации Django. Метод '
    'post(request) обрабатывает события ВКонтакте. При типе события '
    'confirmation возвращает строку токена из settings.VK_CONFIRMATION_TOKEN. '
    'При несовпадении поля secret с settings.VK_CALLBACK_SECRET возвращает '
    'HTTP 403.')
set_para(doc, 86,
    'При типе wall_post_new: проверяет отсутствие copy_history (репост — '
    'пропустить) и post_type != "postpone". Дедупликация — Django '
    'cache.get(f"vk_post_{owner_id}_{post_id}") с TTL 86 400 секунд. При '
    'прохождении всех проверок: VKPost.objects.get_or_create(...), затем '
    'parse_post(post) → (text, photos) → repost_to_channel(channel_id, text, '
    'photos). Возвращает строку "ok".')
set_para(doc, 87,
    'Функция parse_post(post: dict) → tuple[str, list[str]] из services/vk.py: '
    'нормализует текст (очистка VK-упоминаний вида [id123|Имя], удаление '
    'конструкций в квадратных скобках), собирает URL фотографий из поля '
    'attachments, добавляет постоянную ссылку '
    'https://vk.com/wall{owner_id}_{post_id}. Обрезает текст до 1024 символов '
    'при наличии фото или 4096 символов при тексте без фото.')
set_para(doc, 88, '4.4 Функция _create_tasks_for_order(order: Order)')
set_para(doc, 89,
    'Вспомогательная функция модуля views.py. Принимает только что созданный '
    'объект Order. Не возвращает значения. Не выбрасывает исключений — ошибки '
    'создания задач логируются, но не прерывают ответ API. Бизнес-правила: '
    'задача наследует дедлайн от заказа; статус задачи при создании — pending; '
    'assigned_to = None (задача поступает в общий стек).')
set_para(doc, 90,
    'Для корректного отображения задачи в стеке конкретного мастера необходимо '
    'наличие записи MasterApproval(user=master, product=task.product). Без этой '
    'записи задача будет создана, но не попадёт в стек ни одному мастеру. '
    'Разработчику при добавлении нового типа заказа необходимо расширить эту '
    'функцию для обработки нового order_type.')
set_para(doc, 91,
    '4.5 Функция apiFetch(url: string, options: RequestInit) из src/api.ts')
set_para(doc, 92,
    'Асинхронная обёртка над Fetch API для всех небезопасных HTTP-запросов '
    'фронтенда. Автоматически добавляет заголовок X-CSRFToken (значение '
    'считывается из cookie csrftoken функцией getCsrfToken()) для методов POST, '
    'PUT, PATCH, DELETE. Устанавливает Content-Type: application/json и '
    'credentials: include для всех запросов. Возвращает Promise<Response>; '
    'обработка ошибок остаётся на стороне вызывающего кода.')
set_para(doc, 93,
    'GET-запросы через apiFetch не добавляют X-CSRFToken (CSRF-защита '
    'применяется только к небезопасным методам согласно спецификации Django). '
    'Функция не обрабатывает HTTP-ошибки (4xx, 5xx) — вызывающий код должен '
    'проверять response.ok или response.status. Для первоначального получения '
    'CSRF-cookie выполняется GET /api/csrf/ при монтировании корневого '
    'компонента.')
set_para(doc, 94, '4.6 Компонент App (src/App.tsx)')
set_para(doc, 95,
    'Корневой React-компонент. Хранит всё глобальное состояние приложения: '
    'catalogProducts (Product[]), externalLinks, filters (Filters), query '
    '(строка поиска), currentView (ViewMode), selectedProduct, user '
    '(AuthUser | null), reviews (Review[]), openSetSlug. При монтировании '
    'выполняет три параллельных эффекта: fetch CSRF, loadBootstrap(), '
    'checkAuth().')
set_para(doc, 96,
    'Навигация через History API: при переходе в раздел вызывается '
    'pushNav(view, productId, setSlug), записывающий состояние в '
    'window.history. Обработчик popstate восстанавливает состояние React при '
    'нажатии «Назад/Вперёд» в браузере. filteredProducts вычисляется через '
    'useMemo при изменении catalogProducts, filters или query — сервер при '
    'фильтрации не вызывается.')
set_para(doc, 97,
    '4.7 Компонент WorkshopPanel (src/components/WorkshopPanel.tsx)')
set_para(doc, 98,
    'Основной компонент панели управления мастерской. При монтировании загружает '
    'профиль текущего пользователя (GET /api/auth/me/) и список его допусков '
    '(GET /api/workshop/approvals/my/). Отображает набор вкладок (TabId: '
    'dashboard | orders | tasks | clients | approvals | catalog | sets | '
    'reviews); вкладка approvals доступна только при me.isSuperuser === true.')
set_para(doc, 99,
    'Каждая вкладка реализована как отдельный компонент (DashboardTab, '
    'OrdersTab, TasksTab, ClientsTab, ApprovalsTab, CatalogTab, SetsManageTab, '
    'ReviewsManageTab) и монтируется только при активации соответствующей '
    'вкладки. Это предотвращает лишние сетевые запросы при открытии панели. '
    'Все дочерние компоненты используют apiFetch() для обмена данными.')
set_para(doc, 100, '4.8 Перечень API-эндпоинтов')
set_para(doc, 101,
    'Публичные эндпоинты (без авторизации): GET /api/csrf/ — выдача '
    'CSRF-cookie; GET /api/bootstrap/ — каталог, отзывы, ссылки; '
    'POST /api/auth/login/ — вход по логину/паролю; '
    'POST /api/integrations/vk/callback/ — вебхук ВКонтакте.')
set_para(doc, 102,
    'Эндпоинты мастерской (требуют is_staff): GET/POST /api/workshop/orders/ — '
    'список и создание заказов; PATCH /api/workshop/orders/{id}/ — обновление '
    'статуса; GET /api/workshop/tasks/ — список задач (параметр view=stack или '
    'view=mine); POST /api/workshop/tasks/{id}/take/ — взять задачу; '
    'POST /api/workshop/tasks/{id}/close/ — закрыть задачу.')
set_para(doc, 103,
    'GET/POST /api/workshop/clients/ — клиентская база; '
    'PATCH /api/workshop/clients/{id}/ — редактирование клиента; '
    'GET/POST/DELETE /api/workshop/products/ и /api/workshop/products/{id}/ — '
    'управление каталогом; GET/POST/DELETE /api/workshop/reviews/ — управление '
    'отзывами; GET/POST/DELETE /api/workshop/approvals/ — допуски мастеров '
    '(только is_superuser).')
set_para(doc, 104,
    'GET /api/workshop/sets/ — список комплектов; '
    'POST /api/workshop/sets/ — создание комплекта; '
    'PATCH /api/workshop/sets/{id}/ — редактирование; '
    'DELETE /api/workshop/sets/{id}/ — удаление. '
    'GET /api/auth/me/ — текущий пользователь; '
    'POST /api/auth/logout/ — выход. '
    'Все эндпоинты /api/workshop/* возвращают HTTP 401 при отсутствии '
    'авторизованной сессии.')
set_para(doc, 105,
    'Выбор между JSONResponse и DRF Response. В проекте используется DRF '
    'Response для всех представлений APIView — это обеспечивает автоматическую '
    'сериализацию через сериализаторы DRF и поддержку content negotiation. '
    'Прямые JsonResponse применяются только в VkCallbackView и CsrfView, '
    'которые возвращают простые строковые ответы без сериализатора.')
set_para(doc, 106,
    'При добавлении нового эндпоинта необходимо: создать класс-представление в '
    'views.py, зарегистрировать URL в workshop/urls.py, добавить '
    'соответствующие типы в src/types.ts, обновить apiFetch-вызовы в нужном '
    'компоненте. При изменении структуры существующего ответа — обновить тип '
    'BootstrapPayload или соответствующий интерфейс в types.ts.')
set_para(doc, 107, 'Инструментарий разработчика')
set_para(doc, 108,
    'Для запуска в режиме разработки: сервер — python manage.py runserver '
    '(с переменными окружения из .env); фронтенд — npm run dev в директории '
    'проекта (Vite dev-сервер с proxy на порт 8000). Запуск тестов бэкенда: '
    'python -m pytest workshop/tests/ -v (68 тестов, ~1,8 с). Запуск тестов '
    'фронтенда: npx vitest run (23 теста). Сборка production-бандла: '
    'npm run build → dist/.')
set_para(doc, 109,
    'Развёртывание на сервере выполняется по схеме: npm run build → '
    'git add -f dist/ → git commit → git push → на сервере '
    'git checkout origin/branch -- dist/ → sudo systemctl reload nginx. '
    'Перезапуск Django при изменении Python-кода: '
    'sudo systemctl restart gunicorn. Миграции: python manage.py migrate. '
    'Переменные окружения хранятся в /etc/environment на сервере и не входят '
    'в репозиторий.')

# Step 4: save
doc.save(DST)
print(f"\nSaved → {DST}")
print(f"Final paragraph count: {len(doc.paragraphs)}")
print("DONE")
