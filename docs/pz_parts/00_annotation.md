# АННОТАЦИЯ

Пояснительная записка содержит ___ страниц, 6 таблиц, 8 рисунков, 17 источников, 2 приложения.

Выпускная квалификационная работа посвящена проектированию и реализации веб-приложения «Кузница Кальрадия» — информационной системы для мастерской по изготовлению средневековых доспехов и снаряжения. Разработанная система сочетает публичный онлайн-каталог изделий с закрытой производственной панелью управления.

Публичная часть предоставляет посетителям возможность просматривать каталог изделий с фильтрацией по категории, материалу, исторической эпохе, размерам и статусу наличия, изучать детальные карточки с фотогалереей, историческими справками и характеристиками, а также знакомиться с каталогом комплектов снаряжения со скидочной ценой. Предусмотрен просмотр актуальных новостей из официальной группы ВКонтакте и переход в диалог мастерской для оформления заказа.

Производственная панель управления реализует полный цикл работы мастерской: канбан-доска заказов с четырьмя статусами, автоматическое создание производственных задач при оформлении заказа, распределение задач по специализациям мастеров через матрицу допусков, клиентская база с историей заказов, управление каталогом и комплектами.

Реализована интеграция с платформой ВКонтакте посредством Callback API: новые публикации группы автоматически пересылаются в Telegram-канал. Организована система email-уведомлений о приближающихся дедлайнах заказов с запуском по расписанию через cron.

Серверная часть разработана на языке Python 3.11 с использованием фреймворка Django 5.2 и Django REST Framework. Клиентская часть реализована в виде одностраничного приложения (SPA) на React 19 с TypeScript. Написано 39 автоматических тестов, покрывающих все API-эндпоинты и ключевую бизнес-логику. Приложение развёрнуто на VPS-сервере под управлением Debian 11.

**Ключевые слова:** веб-приложение, SPA, Django, React, REST API, TypeScript, каталог товаров, система управления заказами, ВКонтакте Callback API, Telegram Bot API.

---

# ANNOTATION

The explanatory note contains ___ pages, 6 tables, 8 figures, 17 references, 2 appendices.

The graduation qualification work is dedicated to the design and implementation of the "Calradia Forge" web application — an information system for a workshop specialising in the manufacture of medieval armour and equipment. The developed system combines a public online product catalogue with a closed production management panel.

The public part provides visitors with the ability to browse a product catalogue filtered by category, material, historical era, sizes and availability status, to study detailed product cards with photo galleries, historical backgrounds and specifications, and to explore a bundle catalogue with discounted pricing. Current news from the official VKontakte group is displayed, with a direct link to the workshop's chat for placing orders.

The production management panel implements the full workshop workflow: a four-status order kanban board, automatic generation of production tasks upon order creation, task distribution by master specialisations through an approval matrix, a client database with order history, and catalogue and bundle management.

Integration with the VKontakte platform via the Callback API is implemented: new group publications are automatically forwarded to a Telegram channel. An email notification system for approaching order deadlines is organised, launched on a schedule via cron.

The server side is developed in Python 3.11 using the Django 5.2 framework and Django REST Framework. The client side is implemented as a single-page application (SPA) in React 19 with TypeScript. Thirty-nine automated tests covering all API endpoints and core business logic have been written. The application is deployed on a VPS server running Debian 11.

**Keywords:** web application, SPA, Django, React, REST API, TypeScript, product catalogue, order management system, VKontakte Callback API, Telegram Bot API.
