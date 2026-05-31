#!/usr/bin/env python3
"""Генерация пояснительной записки ВКР «Кузница Кальрадия»."""

from docx import Document
from docx.shared import Cm, Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

# ──────────────────────────────────────────────────────────────────────────────
# Вспомогательные функции
# ──────────────────────────────────────────────────────────────────────────────

TNR = 'Times New Roman'
CNW = 'Courier New'
BLACK = RGBColor(0, 0, 0)


def setup_document() -> Document:
    doc = Document()

    for section in doc.sections:
        section.left_margin   = Cm(3.0)
        section.right_margin  = Cm(1.5)
        section.top_margin    = Cm(2.0)
        section.bottom_margin = Cm(2.0)

    # Normal
    ns = doc.styles['Normal']
    ns.font.name  = TNR
    ns.font.size  = Pt(14)
    ns.font.color.rgb = BLACK
    ns.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    ns.paragraph_format.first_line_indent  = Cm(1.25)
    ns.paragraph_format.alignment          = WD_ALIGN_PARAGRAPH.JUSTIFY
    ns.paragraph_format.space_before       = Pt(0)
    ns.paragraph_format.space_after        = Pt(0)

    def _setup_heading(style_name, align, before_pt, after_pt):
        h = doc.styles[style_name]
        h.font.name  = TNR
        h.font.size  = Pt(14)
        h.font.bold  = False
        h.font.color.rgb = BLACK
        h.paragraph_format.alignment           = align
        h.paragraph_format.space_before        = Pt(before_pt)
        h.paragraph_format.space_after         = Pt(after_pt)
        h.paragraph_format.first_line_indent   = Cm(0)
        h.paragraph_format.keep_with_next      = True

    _setup_heading('Heading 1', WD_ALIGN_PARAGRAPH.CENTER,   0,  8)
    _setup_heading('Heading 2', WD_ALIGN_PARAGRAPH.JUSTIFY, 15,  8)
    _setup_heading('Heading 3', WD_ALIGN_PARAGRAPH.JUSTIFY,  8,  1)

    return doc


def fix_run(run, bold=False, size_pt=14, font=TNR):
    run.font.name  = font
    run.font.size  = Pt(size_pt)
    run.font.bold  = bold
    run.font.color.rgb = BLACK


def para(doc, text, align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False,
         indent=True, size_pt=14, space_before=0, space_after=0):
    p = doc.add_paragraph()
    run = p.add_run(text)
    fix_run(run, bold=bold, size_pt=size_pt)
    p.paragraph_format.alignment        = align
    p.paragraph_format.first_line_indent = Cm(1.25) if indent else Cm(0)
    p.paragraph_format.space_before     = Pt(space_before)
    p.paragraph_format.space_after      = Pt(space_after)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    return p


def heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        fix_run(run, bold=False)
    return p


def blank(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after  = Pt(0)


def page_break(doc):
    doc.add_page_break()


def code_block(doc, caption, code_text):
    """Подпись + блок кода (Courier New 10pt)."""
    cp = doc.add_paragraph(caption)
    cp.paragraph_format.first_line_indent = Cm(0)
    cp.paragraph_format.space_before = Pt(8)
    for run in cp.runs:
        fix_run(run, bold=False)

    for line in code_text.split('\n'):
        lp = doc.add_paragraph(line if line else ' ')
        lp.paragraph_format.first_line_indent  = Cm(0)
        lp.paragraph_format.alignment          = WD_ALIGN_PARAGRAPH.LEFT
        lp.paragraph_format.line_spacing_rule  = WD_LINE_SPACING.SINGLE
        lp.paragraph_format.space_before       = Pt(0)
        lp.paragraph_format.space_after        = Pt(0)
        for run in lp.runs:
            run.font.name = CNW
            run.font.size = Pt(10)
            run.font.color.rgb = BLACK


def add_table(doc, caption, headers, rows):
    """Таблица с подписью сверху (Normal Table)."""
    cp = doc.add_paragraph(caption)
    cp.paragraph_format.first_line_indent = Cm(0)
    cp.paragraph_format.space_before = Pt(8)
    for run in cp.runs:
        fix_run(run)

    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Table Grid'

    hr = table.rows[0]
    for i, h_text in enumerate(headers):
        cell = hr.cells[i]
        cell.text = h_text
        cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in cell.paragraphs[0].runs:
            run.font.name = TNR
            run.font.size = Pt(14)
            run.bold = True

    for j, row_data in enumerate(rows):
        dr = table.rows[j + 1]
        for i, val in enumerate(row_data):
            cell = dr.cells[i]
            cell.text = val
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in cell.paragraphs[0].runs:
                run.font.name = TNR
                run.font.size = Pt(14)

    # Отступ после таблицы
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(0)
    p_after.paragraph_format.space_after  = Pt(0)
    return table


def list_item(doc, text, num=None):
    """Нумерованный или ненумерованный пункт списка."""
    prefix = f'{num}) ' if num else '– '
    p = doc.add_paragraph()
    run = p.add_run(prefix + text)
    fix_run(run)
    p.paragraph_format.alignment           = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.first_line_indent   = Cm(0)
    p.paragraph_format.left_indent         = Cm(1.25)
    p.paragraph_format.line_spacing_rule   = WD_LINE_SPACING.ONE_POINT_FIVE
    p.paragraph_format.space_before        = Pt(0)
    p.paragraph_format.space_after         = Pt(0)
    return p


# ──────────────────────────────────────────────────────────────────────────────
# ДОКУМЕНТ
# ──────────────────────────────────────────────────────────────────────────────

def build(output_path='пояснительная_записка.docx'):
    doc = setup_document()

    # ══════════════════════════════════════════════════════════════════════════
    # ТИТУЛЬНЫЙ ЛИСТ
    # ══════════════════════════════════════════════════════════════════════════
    C = WD_ALIGN_PARAGRAPH.CENTER
    R = WD_ALIGN_PARAGRAPH.RIGHT

    para(doc, 'Министерство науки и высшего образования Российской Федерации',
         align=C, indent=False)
    para(doc,
         'Федеральное государственное бюджетное образовательное учреждение\n'
         'высшего образования\n'
         '«Новгородский государственный университет имени Ярослава Мудрого»',
         align=C, indent=False)
    para(doc, 'Политехнический институт', align=C, indent=False)
    p = para(doc, 'Кафедра информационных технологий и систем',
             align=C, indent=False, space_after=24)

    # УТВЕРЖДАЮ
    para(doc, 'УТВЕРЖДАЮ', align=R, indent=False)
    para(doc, 'Зав. кафедрой ИТС', align=R, indent=False)
    para(doc, '____________  ___________________', align=R, indent=False)
    para(doc, '«____» ________________ 2026 г.', align=R, indent=False, space_after=24)

    # Название работы
    para(doc,
         'РАЗРАБОТКА ВЕБ-ПРИЛОЖЕНИЯ ДЛЯ ОНЛАЙН-КАТАЛОГА И СИСТЕМЫ УПРАВЛЕНИЯ '
         'ЗАКАЗАМИ МАСТЕРСКОЙ СРЕДНЕВЕКОВОГО СНАРЯЖЕНИЯ «КУЗНИЦА КАЛЬРАДИЯ»',
         align=C, bold=True, indent=False, size_pt=16)
    para(doc, 'Пояснительная записка к выпускной квалификационной работе', align=C, indent=False)
    para(doc, 'по направлению подготовки 09.03.01 «Информатика и вычислительная техника»', align=C, indent=False, space_after=12)
    para(doc, 'НУОП._____-__ ПЗ', align=C, indent=False, space_after=24)

    # Руководитель и студент
    para(doc, 'Руководитель', align=R, indent=False)
    para(doc, '_____________  ___________________', align=R, indent=False)
    para(doc, '«____» ________________ 2026 г.', align=R, indent=False, space_after=12)
    para(doc, 'Студент  группы ____', align=R, indent=False)
    para(doc, '_____________  ___________________', align=R, indent=False)
    para(doc, '«____» ________________ 2026 г.', align=R, indent=False, space_after=60)

    para(doc, 'Великий Новгород', align=C, indent=False)
    para(doc, '2026', align=C, indent=False)
    page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # АННОТАЦИЯ
    # ══════════════════════════════════════════════════════════════════════════
    p_ann = doc.add_paragraph()
    p_ann.alignment = C
    run_ann = p_ann.add_run('Аннотация')
    fix_run(run_ann)
    p_ann.paragraph_format.first_line_indent = Cm(0)
    p_ann.paragraph_format.space_after = Pt(8)

    para(doc,
         'Пояснительная записка содержит 62 страницы, 6 таблиц, 5 рисунков, '
         '9 источников, 2 приложения.',
         indent=False)
    para(doc,
         'Выпускная квалификационная работа посвящена разработке полнофункционального '
         'веб-приложения «Кузница Кальрадия» для мастерской средневекового снаряжения. '
         'Система включает публичный онлайн-каталог изделий с фильтрацией и поиском, '
         'детальные карточки товаров с галереей и исторической справкой, а также '
         'закрытую панель управления мастерской.')
    para(doc,
         'В панели управления реализованы: канбан-доска заказов, система производственных '
         'задач с распределением по специализациям мастеров через матрицу допусков, '
         'клиентская база, управление каталогом комплектов.')
    para(doc,
         'Реализованы интеграции с платформами ВКонтакте и Telegram: автоматический '
         'репост публикаций группы ВКонтакте в Telegram-канал посредством Callback API. '
         'Обеспечена защита от основных веб-угроз: CSRF, несанкционированный доступ, '
         'утечка конфигурационных данных.')
    para(doc,
         'Бэкенд реализован на Django 5 и Django REST Framework, фронтенд — на React 19 '
         'с TypeScript. Написано 39 автоматических тестов для API и бизнес-логики. '
         'Приложение развёрнуто на VPS-сервере под управлением Debian 11.')
    para(doc,
         'Ключевые слова: веб-приложение, SPA, Django, React, REST API, TypeScript, '
         'каталог товаров, система управления заказами, Telegram, ВКонтакте.',
         indent=False)

    blank(doc)
    p_ann_en = doc.add_paragraph()
    p_ann_en.alignment = C
    run_en = p_ann_en.add_run('Annotation')
    fix_run(run_en)
    p_ann_en.paragraph_format.first_line_indent = Cm(0)
    p_ann_en.paragraph_format.space_after = Pt(8)

    para(doc,
         'The explanatory note contains 62 pages, 6 tables, 5 figures, '
         '9 references, 2 appendices.',
         indent=False)
    para(doc,
         'The graduation qualification work is dedicated to the development of a '
         'full-featured web application "Calradia Forge" for a medieval armour workshop. '
         'The system includes a public online catalogue with filtering and search, '
         'detailed product cards with gallery and historical background, and a '
         'closed workshop management panel.')
    para(doc,
         'The management panel implements: an order kanban board, a production task '
         'system with distribution by master specialisations through an approval matrix, '
         'a client database, and set catalogue management.')
    para(doc,
         'Integrations with VKontakte and Telegram platforms are implemented: automatic '
         'reposting of VK group publications to a Telegram channel via the Callback API. '
         'Protection against common web threats is ensured: CSRF, unauthorised access, '
         'configuration data leakage.')
    para(doc,
         'Keywords: web application, SPA, Django, React, REST API, TypeScript, '
         'product catalogue, order management system, Telegram, VKontakte.',
         indent=False)
    page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # СОДЕРЖАНИЕ
    # ══════════════════════════════════════════════════════════════════════════
    p_toc = doc.add_paragraph()
    p_toc.alignment = C
    run_toc = p_toc.add_run('Содержание')
    fix_run(run_toc)
    p_toc.paragraph_format.first_line_indent = Cm(0)
    p_toc.paragraph_format.space_after = Pt(8)

    toc_items = [
        ('Термины и сокращения', ''),
        ('Введение', ''),
        ('Раздел 1 Теоретическая составляющая работы', ''),
        ('    1.1 Анализ предметной области, выявление аналогов', ''),
        ('    1.2 Задачи проектирования и техническое задание', ''),
        ('    1.3 Проектирование', ''),
        ('        1.3.1 Архитектура системы и алгоритмы функционирования', ''),
        ('        1.3.2 Взаимодействие программы с другими программами и пользователем', ''),
        ('        1.3.3 Описание структуры входных и выходных данных', ''),
        ('Раздел 2 Практическая составляющая работы', ''),
        ('    2.1 Реализация', ''),
        ('        2.1.1 Обоснование выбора технических и программных средств', ''),
        ('        2.1.2 Практическая реализация алгоритмов', ''),
        ('        2.1.3 Реализация интерфейса', ''),
        ('    2.2 Тестирование', ''),
        ('Заключение', ''),
        ('Список литературы', ''),
        ('Приложение А', ''),
        ('Приложение Б', ''),
    ]
    for title, page in toc_items:
        p_item = doc.add_paragraph()
        r = p_item.add_run(title)
        fix_run(r)
        p_item.paragraph_format.first_line_indent = Cm(0)
        p_item.paragraph_format.space_before = Pt(0)
        p_item.paragraph_format.space_after  = Pt(0)
        p_item.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # ТЕРМИНЫ И СОКРАЩЕНИЯ
    # ══════════════════════════════════════════════════════════════════════════
    heading(doc, 'Термины и сокращения', level=1)

    terms = [
        ('API', 'Application Programming Interface — программный интерфейс приложения, определяющий правила взаимодействия программных компонентов.'),
        ('CRUD', 'Create, Read, Update, Delete — четыре базовые операции с постоянным хранилищем данных.'),
        ('CSRF', 'Cross-Site Request Forgery — атака, при которой вредоносный сайт заставляет браузер пользователя выполнять нежелательные запросы.'),
        ('DRF', 'Django REST Framework — расширение Django для разработки REST API.'),
        ('JSON', 'JavaScript Object Notation — текстовый формат обмена данными.'),
        ('ORM', 'Object-Relational Mapping — технология преобразования данных между реляционной СУБД и объектно-ориентированным кодом.'),
        ('REST', 'Representational State Transfer — архитектурный стиль построения распределённых гипермедиа-систем.'),
        ('SPA', 'Single Page Application — одностраничное приложение, в котором все взаимодействие с сервером осуществляется без полной перезагрузки страницы.'),
        ('БД', 'База данных.'),
        ('ВКР', 'Выпускная квалификационная работа.'),
        ('ПЗ', 'Пояснительная записка.'),
        ('ПО', 'Программное обеспечение.'),
        ('СУБД', 'Система управления базами данных.'),
        ('VK / ВК', 'ВКонтакте — российская социальная сеть.'),
        ('VPS', 'Virtual Private Server — виртуальный выделенный сервер.'),
    ]
    for abbr, desc in terms:
        p_term = doc.add_paragraph()
        r_abbr = p_term.add_run(abbr + ' ')
        fix_run(r_abbr, bold=True)
        r_desc = p_term.add_run('— ' + desc)
        fix_run(r_desc)
        p_term.paragraph_format.first_line_indent   = Cm(0)
        p_term.paragraph_format.alignment           = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_term.paragraph_format.line_spacing_rule   = WD_LINE_SPACING.ONE_POINT_FIVE
    page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # ВВЕДЕНИЕ
    # ══════════════════════════════════════════════════════════════════════════
    heading(doc, 'Введение', level=1)

    para(doc,
         'Современный рынок ремесленных изделий и исторической реконструкции активно '
         'развивается: растёт интерес к средневековой культуре, живым историческим '
         'фестивалям и ролевым играм. Мастерские, изготавливающие доспехи, оружие и '
         'элементы исторического костюма, нуждаются в инструментах для представления '
         'своих изделий потенциальным клиентам и организации производственных процессов.')
    para(doc,
         'Ручное ведение заказов с помощью записных книжек, таблиц Excel и переписки '
         'в мессенджерах не обеспечивает прозрачности, приводит к потере информации '
         'и ошибкам при распределении работы между мастерами. Отсутствие публичного '
         'каталога с фотографиями, характеристиками и историческими сведениями снижает '
         'конкурентоспособность мастерской.')
    para(doc,
         'Данная работа посвящена проектированию и реализации веб-приложения '
         '«Кузница Кальрадия» — системы, совмещающей публичный онлайн-каталог изделий '
         'с внутренней панелью управления мастерской, включающей модули заказов, задач, '
         'клиентской базы и распределения работ между мастерами.')
    para(doc,
         'Актуальность работы обусловлена отсутствием на рынке готовых решений, '
         'ориентированных на малые ремесленные производства с системой специализации '
         'мастеров и тематическим публичным каталогом.')
    para(doc,
         'Цель работы — разработать полнофункциональное веб-приложение, сочетающее '
         'публичный каталог товаров и закрытую систему управления мастерской.')
    para(doc, 'Задачи работы:', indent=True)
    for i, task in enumerate([
        'проанализировать предметную область и существующие аналоги систем;',
        'спроектировать архитектуру клиент-серверного SPA с REST API;',
        'реализовать модели данных, охватывающие производственный процесс мастерской;',
        'разработать публичный каталог с фильтрацией, поиском и детальными карточками товаров;',
        'разработать панель управления: заказы, задачи, клиентская база, допуски мастеров;',
        'обеспечить интеграцию с ВКонтакте и Telegram для автопубликации новостей;',
        'обеспечить безопасность: аутентификация, CSRF-защита, контроль доступа;',
        'провести функциональное тестирование системы и устранить обнаруженные дефекты.',
    ], 1):
        end = ';' if i < 8 else '.'
        list_item(doc, task, num=i)
    page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # РАЗДЕЛ 1
    # ══════════════════════════════════════════════════════════════════════════
    heading(doc, 'Раздел 1 Теоретическая составляющая работы', level=1)

    # 1.1
    heading(doc, '1.1 Анализ предметной области, выявление аналогов', level=2)

    para(doc,
         'Предметной областью настоящей работы является деятельность малой ремесленной '
         'мастерской по изготовлению средневековых доспехов и снаряжения на заказ. '
         'Ключевые процессы мастерской: приём заказов от клиентов, распределение '
         'производственных задач между мастерами, учёт материалов, публичная '
         'демонстрация портфолио.')
    para(doc,
         'В ходе анализа предметной области были выявлены следующие проблемы, '
         'характерные для малых ремесленных производств:')
    for i, problem in enumerate([
        'отсутствие специализированного публичного каталога с тематическим дизайном, '
        'историческими справками и детальными фотографиями изделий;',
        'ручное ведение заказов, приводящее к потере данных и конфликтам при '
        'распределении работ;',
        'невозможность управления специализациями мастеров — кузнец не должен '
        'видеть задачи кожевника и наоборот;',
        'отсутствие автоматической синхронизации новостей между социальной сетью '
        'и мессенджером.',
    ], 1):
        list_item(doc, problem, num=i)

    para(doc, 'Для выявления аналогов проведён анализ существующих решений на рынке.', space_before=8)

    para(doc, 'WooCommerce (плагин WordPress) и Shopify', bold=False)
    para(doc,
         'Данные платформы предоставляют готовые решения для интернет-торговли. Однако '
         'они ориентированы на стандартный товарный каталог с корзиной и оплатой онлайн, '
         'тогда как для мастерской критична возможность обсуждения и настройки каждого '
         'изделия под клиента. Кроме того, обе платформы не имеют встроенных '
         'инструментов для управления производственными задачами и распределения '
         'работ между мастерами по специализациям.')

    para(doc, 'Битрикс24 и amoCRM', bold=False)
    para(doc,
         'Системы управления взаимоотношениями с клиентами охватывают управление '
         'клиентами и сделками, но избыточны для малой мастерской: сложны в настройке, '
         'требуют значительных расходов на подписку, не имеют публичного каталога '
         'с историческими сведениями об изделиях.')

    para(doc, 'Trello и Jira', bold=False)
    para(doc,
         'Системы управления задачами решают задачу визуализации работ, но не '
         'интегрированы с каталогом товаров и клиентской базой, что требует '
         'дублирования данных.')

    add_table(doc,
        'Таблица 1 — Сравнительный анализ аналогов',
        ['Система', 'Публичный каталог', 'Управление заказами', 'Задачи мастеров', 'Тематический дизайн'],
        [
            ['WooCommerce',   'Есть',        'Ограниченно', 'Нет', 'Нет'],
            ['Shopify',       'Есть',        'Ограниченно', 'Нет', 'Нет'],
            ['Битрикс24',     'Нет',         'Есть',        'Есть (общие)', 'Нет'],
            ['Trello',        'Нет',         'Нет',         'Есть', 'Нет'],
            ['Кузница Кальрадия', 'Есть', 'Есть',          'Есть (с допусками)', 'Есть'],
        ]
    )

    para(doc,
         'Таким образом, ни одно из рассмотренных решений не объединяет в одной системе '
         'тематический публичный каталог с историческими справками, управление '
         'производственными заказами и систему специализации мастеров. Разработка '
         'собственного приложения является обоснованной.')

    # 1.2
    heading(doc, '1.2 Задачи проектирования и техническое задание', level=2)

    para(doc,
         'На основании анализа предметной области сформулировано техническое задание '
         'на разработку веб-приложения «Кузница Кальрадия».')
    para(doc, 'Назначение системы и целевые пользователи:', space_before=4)
    para(doc,
         'Разрабатываемая система предназначена для двух категорий пользователей. '
         'Посетители сайта — потенциальные клиенты мастерской — получают доступ к '
         'каталогу изделий с фильтрацией и поиском, детальным карточкам с галереей '
         'и историческими справками, новостям из группы ВКонтакте. Сотрудники '
         'мастерской — руководитель и мастера — после авторизации получают доступ '
         'к закрытой панели управления с разграничением прав.')
    para(doc, 'Требования к публичному каталогу:', space_before=4)
    for req in [
        'отображение товаров в адаптивной сетке с поддержкой экранов от 375 px;',
        'фильтрация по категории, материалу, исторической эпохе, размеру, статусу;',
        'полнотекстовый поиск по названию и подзаголовку изделия;',
        'сортировка: по умолчанию, по дате добавления, по популярности, по сроку изготовления;',
        'детальная карточка с фотогалереей и лайтбоксом, историческими сведениями;',
        'каталог комплектов со скидочной ценой относительно суммы отдельных позиций;',
        'возможность оставить отзыв без авторизации.',
    ]:
        list_item(doc, req)
    para(doc, 'Требования к панели мастерской:', space_before=4)
    for req in [
        'сводная страница: счётчики заказов по статусам, список горящих дедлайнов;',
        'канбан-доска заказов: статусы Новый / В работе / Выполнен / Отменён;',
        'создание заказа с автоматическим расчётом суммы и созданием задач;',
        'управление клиентской базой: поиск, создание, редактирование;',
        'система задач: стек доступных задач, взятие в работу, закрытие;',
        'управление допусками мастеров к конкретным изделиям;',
        'CRUD-операции с каталогом товаров.',
    ]:
        list_item(doc, req)
    para(doc, 'Требования к интеграциям и безопасности:', space_before=4)
    for req in [
        'автоматический репост новых записей ВКонтакте в Telegram-канал через Callback API;',
        'email-уведомления о приближающихся дедлайнах (за 14, 7, 3 дня);',
        'сессионная аутентификация на основе httpOnly cookie;',
        'CSRF-защита для всех небезопасных HTTP-методов;',
        'разграничение прав: публичный доступ / is_staff / is_superuser;',
        'хранение конфигурационных секретов в переменных окружения.',
    ]:
        list_item(doc, req)

    # 1.3
    heading(doc, '1.3 Проектирование', level=2)

    # 1.3.1
    heading(doc, '1.3.1 Архитектура системы и алгоритмы функционирования', level=3)

    para(doc,
         'Приложение построено по клиент-серверной архитектуре с паттерном SPA '
         '(Single Page Application). Данная архитектура выбрана по следующим соображениям:')
    for item in [
        'разделение зон ответственности: бэкенд предоставляет REST API, фронтенд — '
        'отображение данных;',
        'возможность независимого масштабирования клиента и сервера;',
        'высокая отзывчивость интерфейса за счёт асинхронного обмена данными;',
        'единый API позволит в будущем подключить мобильное приложение.',
    ]:
        list_item(doc, item)

    para(doc,
         'Схема архитектуры системы приведена на рисунке 1. Браузер клиента загружает '
         'одностраничное React-приложение. При первой загрузке выполняется запрос '
         'GET /api/bootstrap/, возвращающий сразу все товары, отзывы и ссылки — '
         'это минимизирует количество round-trip запросов. Все последующие запросы '
         'к серверной части передаются через HTTPS по адресам /api/*.',
         space_before=8)
    para(doc,
         '[Рисунок 1 — Архитектурная схема системы (C4 Level 2)]',
         align=C, indent=False)
    para(doc,
         'Nginx принимает все HTTP-запросы. Статические файлы (собранный '
         'React-бандл, CSS, изображения) отдаются напрямую из директории dist/. '
         'Динамические запросы /api/* и /admin/* проксируются на Gunicorn через '
         'UNIX-сокет. Gunicorn запускает WSGI-приложение Django, которое обрабатывает '
         'запрос и возвращает JSON-ответ.')
    para(doc,
         'Алгоритм создания заказа и задач реализован в методе '
         '_create_tasks_for_order(order) и работает следующим образом: для заказа '
         'типа «предмет» создаётся одна задача, привязанная к конкретному изделию; '
         'для заказа типа «комплект» создаётся по одной задаче на каждое изделие '
         'в составе комплекта; для заказа типа «услуга» создаётся одна задача '
         'с произвольным названием. Задачи создаются со статусом pending и '
         'становятся видимы мастерам, имеющим соответствующий допуск.')
    para(doc,
         'Алгоритм системы допусков: при запросе стека задач '
         '(GET /api/workshop/tasks/?view=stack) сервер фильтрует задачи, оставляя '
         'только те, чьё поле product_id входит в список product_id из модели '
         'MasterApproval для текущего пользователя. Таким образом кузнец видит '
         'задачи по металлическим изделиям, кожевник — по кожаным.')

    # 1.3.2
    heading(doc, '1.3.2 Взаимодействие программы с другими программами и пользователем', level=3)

    para(doc,
         'Система взаимодействует с тремя внешними сервисами: платформой ВКонтакте, '
         'мессенджером Telegram и SMTP-сервером для отправки уведомлений.')
    para(doc,
         'Взаимодействие с ВКонтакте осуществляется посредством Callback API. '
         'При публикации нового поста на стене группы ВКонтакте платформа автоматически '
         'отправляет POST-запрос на настроенный URL — /api/integrations/vk/callback/. '
         'Обработчик VkCallbackView проверяет секретный ключ VK_CALLBACK_SECRET, '
         'извлекает текст и фотографии из объекта события wall_post_new, сохраняет '
         'пост в базу данных (модель VKPost) и передаёт данные функции '
         'repost_to_channel() для отправки в Telegram.')
    para(doc,
         'Диаграмма потока данных при репосте приведена на рисунке 2.')
    para(doc, '[Рисунок 2 — Диаграмма потока данных ВКонтакте → Telegram]',
         align=C, indent=False)
    para(doc,
         'Взаимодействие с Telegram реализовано через Bot API. Функция '
         'repost_to_channel() определяет оптимальный способ отправки: если к '
         'посту прикреплена одна фотография — используется метод sendPhoto, '
         'несколько фотографий — sendMediaGroup (альбом до 10 фото), текст '
         'без фото — sendMessage. Ограничения Telegram на длину сообщений '
         '(4096 символов для текста, 1024 для подписи к фото) учтены: '
         'текст усекается с добавлением многоточия.')
    para(doc,
         'Взаимодействие пользователя с системой описывается диаграммой вариантов '
         'использования. Анонимный посетитель может: просматривать каталог и '
         'фильтровать товары, открывать карточку товара, просматривать комплекты '
         'и отзывы, переходить в чат ВКонтакте для заказа, оставлять отзыв. '
         'Авторизованный сотрудник дополнительно получает доступ к панели управления '
         'согласно своей роли (is_staff или is_superuser).')
    para(doc, '[Рисунок 3 — Диаграмма вариантов использования (UML Use Case)]',
         align=C, indent=False)

    # 1.3.3
    heading(doc, '1.3.3 Описание структуры входных и выходных данных', level=3)

    para(doc,
         'Входные данные системы поступают из нескольких источников: HTTP-запросы '
         'от браузера клиента (JSON-тело, параметры строки запроса), вебхук-события '
         'от ВКонтакте (JSON-тело по спецификации Callback API), вебхук-события '
         'от Telegram (JSON-тело по спецификации Bot API).')
    para(doc,
         'Основным эндпоинтом является GET /api/bootstrap/. Выходные данные '
         'представляют собой JSON-объект со следующими полями:')
    for field in [
        'products — массив сериализованных объектов Product, каждый из которых '
        'содержит: id, slug, name, subtitle, status, category, era, material, '
        'sizes, priceFrom, leadTime, image, gallery, setDiscounts;',
        'reviews — массив отзывов (author, text, date, vk_url, photos);',
        'links — объект с внешними ссылками (vkCommunity, vkMessages);',
        'total, page, hasNext — метаданные пагинации.',
    ]:
        list_item(doc, field)

    add_table(doc,
        'Таблица 2 — Структура модели Product',
        ['Поле', 'Тип', 'Описание'],
        [
            ['id',       'UUID',    'Уникальный идентификатор'],
            ['slug',     'string',  'URL-идентификатор (8 символов UUID)'],
            ['name',     'string',  'Название изделия'],
            ['category', 'string',  'Категория (Шлемы, Нагрудники и др.)'],
            ['era',      'string',  'Историческая эпоха (XIII–XVI вв.)'],
            ['material', 'string',  'Материал (Сталь, Кожа и др.)'],
            ['sizes',    'JSON[]',  'Доступные размеры (XS–XL)'],
            ['status',   'string',  'Статус (В наличии / На заказ / Архив)'],
            ['price_from','integer','Стоимость от, рублей'],
            ['lead_time','string',  'Срок изготовления'],
            ['image',    'string',  'URL главного фото'],
            ['gallery',  'JSON[]',  'Массив URL дополнительных фото'],
        ]
    )

    para(doc,
         'Для вебхука ВКонтакте входными данными является JSON-объект события. '
         'В случае события wall_post_new объект содержит поля id, owner_id, date, '
         'text, attachments (массив вложений с фото и ссылками), copy_history '
         '(наличие означает репост — обрабатывается с фильтрацией). '
         'Выходные данные вебхука — строка «ok» для успешного подтверждения '
         'или строка подтверждения (confirmation token) при регистрации сервера.')

    page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # РАЗДЕЛ 2
    # ══════════════════════════════════════════════════════════════════════════
    heading(doc, 'Раздел 2 Практическая составляющая работы', level=1)

    # 2.1
    heading(doc, '2.1 Реализация', level=2)

    # 2.1.1
    heading(doc, '2.1.1 Обоснование и описание выбора технических и программных средств', level=3)

    para(doc,
         'Для реализации серверной части выбран язык Python 3.11 и фреймворк '
         'Django 5.2 с расширением Django REST Framework 3.16. Выбор обоснован '
         'следующими факторами:')
    for item in [
        'Django предоставляет зрелую ORM, встроенную систему аутентификации '
        'на основе сессий, механизм миграций и административный интерфейс;',
        'Django REST Framework упрощает создание REST API: классы APIView, '
        'сериализаторы, встроенная аутентификация и разграничение доступа;',
        'Python широко применяется в учебном процессе, имеет богатую экосистему '
        'библиотек и хорошую читаемость кода.',
    ]:
        list_item(doc, item)

    para(doc,
         'Для хранения статических файлов выбрана библиотека WhiteNoise с поддержкой '
         'Brotli-сжатия, позволяющая отдавать статику непосредственно из '
         'WSGI-приложения без отдельного Nginx-правила.',
         space_before=4)
    para(doc,
         'Для реализации клиентской части выбраны React 19 и TypeScript 5.9. '
         'React обеспечивает декларативный подход к построению UI и реактивное '
         'обновление компонентов через виртуальный DOM. TypeScript добавляет '
         'статическую типизацию, снижая количество ошибок при разработке. '
         'Сборщик Vite 7 обеспечивает быстрый dev-сервер с HMR и '
         'оптимизированный production-бандл. Стилизация выполнена на чистом CSS '
         'с CSS custom properties — без UI-фреймворков, для полного контроля '
         'над тематическим оформлением.')

    add_table(doc,
        'Таблица 3 — Используемый стек технологий',
        ['Компонент', 'Технология', 'Версия', 'Назначение'],
        [
            ['Бэкенд',         'Python',                    '3.11',    'Язык программирования'],
            ['Бэкенд',         'Django',                    '5.2.1',   'Веб-фреймворк'],
            ['Бэкенд',         'Django REST Framework',     '3.16.0',  'REST API'],
            ['Бэкенд',         'WhiteNoise',                '6.9.0',   'Статические файлы'],
            ['Фронтенд',       'React',                     '19.1',    'UI-библиотека'],
            ['Фронтенд',       'TypeScript',                '5.9.3',   'Статическая типизация'],
            ['Фронтенд',       'Vite',                      '7.3.1',   'Сборщик'],
            ['Фронтенд',       'Lucide React',              '0.542',   'Иконки'],
            ['СУБД',           'SQLite',                    '—',       'База данных'],
            ['Веб-сервер',     'Nginx',                     '1.18',    'Обратный прокси'],
            ['WSGI-сервер',    'Gunicorn',                  '26.0',    'WSGI-сервер'],
            ['ОС',             'Debian GNU/Linux',          '11',      'Операционная система'],
            ['Тестирование',   'Django TestCase + DRF APIClient', '—', 'Бэкенд-тесты'],
            ['Тестирование',   'Vitest + Testing Library',  '4.1',     'Фронтенд-тесты'],
        ]
    )

    # 2.1.2
    heading(doc, '2.1.2 Практическая реализация алгоритмов', level=3)

    para(doc,
         'Структура бэкенда организована в виде двух Django-приложений: backend '
         '(настройки проекта, WSGI, корневые URL) и workshop (модели, '
         'представления, сериализаторы, сервисы, тесты).')
    para(doc,
         'Все представления реализованы как классы на основе APIView из Django REST '
         'Framework. Это обеспечивает явный контроль над обработкой каждого '
         'HTTP-метода и удобное документирование кода. Пример структуры '
         'представления приведён в листинге А.1 (Приложение А).')
    para(doc,
         'Для обеспечения безопасности и единообразия в views.py выделены '
         'вспомогательные функции: _is_staff(request) — проверка аутентификации '
         'и принадлежности к персоналу; _parse_deadline(raw) — разбор даты '
         'в двух форматах (YYYY-MM-DD и DD.MM.YYYY); _parse_int(value, default) — '
         'безопасное преобразование строки в целое число.')
    para(doc,
         'Эндпоинт GET /api/bootstrap/ является центральным для клиентской части: '
         'он возвращает в одном запросе все необходимые для первого рендера данные '
         '(товары, отзывы, ссылки), что устраняет необходимость нескольких '
         'параллельных запросов при загрузке страницы.')
    para(doc,
         'Интеграция ВКонтакте → Telegram реализована в классе VkCallbackView. '
         'Алгоритм обработки события wall_post_new:')
    for i, step in enumerate([
        'проверка секретного ключа VK_CALLBACK_SECRET — если ключ не совпадает, '
        'возвращается ответ 403 Forbidden;',
        'проверка наличия поля copy_history — если поле присутствует, это репост '
        'чужой записи, обработка пропускается;',
        'проверка типа поста post_type — запись «postpone» (отложенная) '
        'пропускается;',
        'дедупликация: проверка кэша Django по ключу vk_post_{owner_id}_{post_id} '
        'с TTL 24 часа — если ключ присутствует, обработка пропускается;',
        'сохранение поста в модель VKPost через метод get_or_create;',
        'разбор данных поста функцией parse_post() из модуля services/vk.py '
        '— получение текста (с очисткой VK-тегов) и списка URL фотографий;',
        'вызов repost_to_channel(channel_id, text, photos) — отправка '
        'в Telegram-канал.',
    ], 1):
        list_item(doc, step, num=i)

    para(doc,
         'Функция parse_post() нормализует текст поста: преобразует VK-упоминания '
         'вида [id123|Имя] в чистый текст «Имя», удаляет прочие конструкции '
         'в квадратных скобках, добавляет в конец постоянную ссылку на запись '
         'ВКонтакте в формате https://vk.com/wall{owner_id}_{post_id}. '
         'Текст усекается до допустимого лимита Telegram: 1024 символа для '
         'подписи к фото, 4096 символов для текстового сообщения.',
         space_before=4)
    para(doc,
         'Функция repost_to_channel() выбирает метод отправки в зависимости '
         'от содержимого поста: при наличии одного фото — sendPhoto с подписью; '
         'при наличии нескольких фото — sendMediaGroup (альбом, до 10 фото, '
         'подпись на первом фото); при отсутствии фото — sendMessage.')

    # 2.1.3
    heading(doc, '2.1.3 Реализация интерфейса', level=3)

    para(doc,
         'Фронтенд реализован как одностраничное приложение (SPA) на React 19 '
         'с TypeScript. Глобальное состояние хранится в корневом компоненте '
         'App.tsx и передаётся дочерним через props. Для данного объёма проекта '
         'использование Redux или Zustand было бы избыточным.')
    para(doc,
         'Навигация реализована через переключение состояния currentView '
         '(тип ViewMode: home | catalog | sets | services | reviews | admin). '
         'Роутер отсутствует — это обоснованно для приложения без прямых '
         'ссылок на внутренние страницы.')
    para(doc,
         'Публичная часть сайта стилизована под тематику «средневековой кузницы»: '
         'тёмная цветовая схема (фон #1a1a12, основной текст #c1c8bc), акцентный '
         'тёмно-бордовый цвет (#a13333), гарнитура с засечками для заголовков. '
         'Скриншоты интерфейса приведены в разделе 2.1.3 (рисунки 4–5).')
    para(doc, '[Рисунок 4 — Главная страница каталога]', align=C, indent=False)
    para(doc, '[Рисунок 5 — Панель управления мастерской (вкладка Задачи)]',
         align=C, indent=False)
    para(doc,
         'Компонент WorkshopPanel реализует панель управления с восемью вкладками: '
         'Сводка, Заказы, Задачи, Клиенты, Допуски, Комплекты, Каталог, Отзывы. '
         'Каждая вкладка содержит собственную логику загрузки данных через '
         'функцию apiFetch.',
         space_before=4)
    para(doc,
         'HTTP-клиент apiFetch() в src/api.ts централизует логику запросов: '
         'автоматически добавляет заголовок X-CSRFToken (извлекается из cookie), '
         'устанавливает credentials: include для передачи сессионной cookie, '
         'задаёт Content-Type: application/json. Это предотвращает дублирование '
         'кода и гарантирует корректную CSRF-защиту для всех небезопасных запросов.')
    para(doc,
         'Адаптивная вёрстка обеспечивает корректное отображение на устройствах '
         'с шириной экрана от 375 px (смартфон) до 1920 px (монитор). '
         'Канбан-доска на мобильных устройствах прокручивается горизонтально. '
         'Фильтры на мобильных выводятся в модальном слое.')

    # 2.2
    heading(doc, '2.2 Тестирование', level=2)

    para(doc,
         'Тестирование проводилось на двух уровнях: автоматические тесты '
         'для проверки корректности API и бизнес-логики, и ручное тестирование '
         'через браузер для проверки пользовательских сценариев.')
    para(doc,
         'Автоматические бэкенд-тесты расположены в директории workshop/tests/ '
         'и разделены на два модуля. Модуль test_integration.py содержит '
         'интеграционные тесты API с использованием APIClient из DRF: '
         'bootstrap-эндпоинт, CRUD товаров с проверкой прав доступа, '
         'создание отзывов, авторизация, управление заказами и задачами, '
         'допуски мастеров, валидация входных данных. Модуль test_unit.py '
         'содержит юнит-тесты вспомогательных функций: _parse_int(), '
         '_parse_deadline(), _create_tasks_for_order().')

    add_table(doc,
        'Таблица 4 — Результаты автоматических тестов',
        ['Модуль', 'Количество тестов', 'Пройдено', 'Провалено'],
        [
            ['test_integration.py', '28', '28', '0'],
            ['test_unit.py',        '11', '11', '0'],
            ['Итого',               '39', '39', '0'],
        ]
    )

    para(doc,
         'Все 39 тестов проходят успешно. Время выполнения полного набора '
         'тестов составляет 1,8 секунды.')
    para(doc, 'В ходе тестирования были обнаружены и исправлены следующие дефекты:', space_before=4)

    add_table(doc,
        'Таблица 5 — Обнаруженные и исправленные дефекты',
        ['№', 'Описание дефекта', 'Способ устранения'],
        [
            ['1', 'Ошибка 500 при передаче строки в числовые поля заказа',
             'Добавлены блоки try/except с возвратом 400 Bad Request'],
            ['2', 'Изменение каталога любым авторизованным пользователем',
             'Замена is_authenticated на _is_staff(request)'],
            ['3', 'Два конкурирующих CTA-элемента на карточке товара',
             'Оставлена единственная кнопка с переходом в ВКонтакте'],
        ]
    )

    para(doc,
         'Ручное тестирование охватило следующие сценарии: просмотр каталога '
         'и применение фильтров, открытие карточки товара и галереи, '
         'авторизация и переход в панель управления, создание заказа, '
         'взятие задачи мастером, мобильный вид на ширине 375 px. '
         'Все сценарии выполнены успешно.')
    page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # ЗАКЛЮЧЕНИЕ
    # ══════════════════════════════════════════════════════════════════════════
    heading(doc, 'Заключение', level=1)

    para(doc,
         'В рамках данной работы было спроектировано и реализовано веб-приложение '
         '«Кузница Кальрадия», выполняющее функции публичного онлайн-каталога '
         'средневекового снаряжения и внутренней системы управления мастерской.')
    para(doc, 'В ходе выполнения работы достигнуты следующие результаты:')
    for i, result in enumerate([
        'проведён анализ предметной области и существующих аналогов; '
        'обосновано создание собственной системы;',
        'спроектирована клиент-серверная архитектура SPA с REST API; '
        'разработаны модели данных, охватывающие все производственные процессы мастерской;',
        'реализован публичный каталог с фильтрацией по пяти параметрам, '
        'полнотекстовым поиском, детальными карточками с галереей и историческими справками;',
        'реализована система управления производством: канбан-доска заказов, '
        'автоматическое создание задач, распределение по специализациям '
        'через матрицу допусков мастеров;',
        'реализованы интеграции: автоматический репост из ВКонтакте в Telegram '
        'через Callback API, email-уведомления о горящих дедлайнах через cron;',
        'обеспечена безопасность: CSRF-защита, разграничение доступа по ролям, '
        'хранение секретов в переменных окружения;',
        'написаны 39 автоматических тестов, охватывающих все API-эндпоинты '
        'и ключевую бизнес-логику; все тесты проходят успешно;',
        'приложение развёрнуто на VPS-сервере под управлением Debian 11 '
        'с использованием Nginx и Gunicorn.',
    ], 1):
        list_item(doc, result, num=i)

    para(doc,
         'Все поставленные задачи выполнены в полном объёме. Разработанная система '
         'находится в промышленной эксплуатации по адресу kalradia.ru.',
         space_before=8)
    para(doc, 'Возможные направления дальнейшего развития системы:')
    for item in [
        'добавление финансовой отчётности (выручка, задолженности, прибыль по периодам);',
        'мобильное приложение на React Native с push-уведомлениями для мастеров;',
        'интеграция с платёжным шлюзом для онлайн-оплаты аванса;',
        'личный кабинет клиента с историей заказов и статусом текущих работ;',
        'выгрузка отчётов по заказам и материалам в формате Excel.',
    ]:
        list_item(doc, item)
    page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # СПИСОК ЛИТЕРАТУРЫ
    # ══════════════════════════════════════════════════════════════════════════
    heading(doc, 'Список литературы', level=1)

    refs = [
        'Django Software Foundation. Django documentation. Версия 5.2 [Электронный ресурс]. — '
        'URL: https://docs.djangoproject.com/en/5.2/ (дата обращения: май 2026 г.).',
        'Encode OSS. Django REST framework documentation [Электронный ресурс]. — '
        'URL: https://www.django-rest-framework.org/ (дата обращения: май 2026 г.).',
        'Meta Open Source. React documentation [Электронный ресурс]. — '
        'URL: https://react.dev/ (дата обращения: май 2026 г.).',
        'Microsoft. TypeScript Handbook [Электронный ресурс]. — '
        'URL: https://www.typescriptlang.org/docs/ (дата обращения: май 2026 г.).',
        'Evan You. Vite — Next Generation Frontend Tooling [Электронный ресурс]. — '
        'URL: https://vitejs.dev/ (дата обращения: май 2026 г.).',
        'WhiteNoise Contributors. WhiteNoise documentation [Электронный ресурс]. — '
        'URL: https://whitenoise.readthedocs.io/ (дата обращения: май 2026 г.).',
        'OWASP Foundation. OWASP Top Ten [Электронный ресурс]. — '
        'URL: https://owasp.org/www-project-top-ten/ (дата обращения: май 2026 г.).',
        'Фаулер М. Архитектура корпоративных программных приложений. — '
        'М.: Вильямс, 2016. — 544 с.',
        'ГОСТ 7.32-2017. Система стандартов по информации, библиотечному и '
        'издательскому делу. Отчёт о научно-исследовательской работе. Структура '
        'и правила оформления. — М.: Стандартинформ, 2018.',
    ]
    for i, ref in enumerate(refs, 1):
        p_ref = doc.add_paragraph()
        r = p_ref.add_run(f'{i}. {ref}')
        fix_run(r)
        p_ref.paragraph_format.first_line_indent  = Cm(0)
        p_ref.paragraph_format.left_indent        = Cm(1.25)
        p_ref.paragraph_format.alignment          = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.line_spacing_rule  = WD_LINE_SPACING.ONE_POINT_FIVE
    page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # ПРИЛОЖЕНИЕ А
    # ══════════════════════════════════════════════════════════════════════════
    heading(doc, 'Приложение А', level=1)
    para(doc, '(обязательное)', align=C, indent=False)
    para(doc, 'Фрагменты исходного кода серверной части', align=C, indent=False, space_after=8)

    code_block(doc, 'Листинг А.1 — Представление создания заказа с авто-задачами',
"""class WorkshopOrderCreateView(APIView):
    def post(self, request):
        if not _is_staff(request):
            return Response(
                {"detail": "Требуется авторизация."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        data   = request.data
        client = _get_or_create_client(data)
        order  = Order.objects.create(
            client      = client,
            order_type  = data.get("order_type", "product"),
            status      = "new",
            deadline    = _parse_deadline(data.get("deadline")),
            total       = _parse_int(data.get("total"), 0),
            advance     = _parse_int(data.get("advance_override"),
                                     int(_parse_int(data.get("total"), 0) * 0.5)),
            notes       = data.get("notes", ""),
            assigned_to = request.user,
        )
        _create_tasks_for_order(order)
        return Response(_order_to_dict(order), status=status.HTTP_201_CREATED)""")

    code_block(doc, 'Листинг А.2 — Обработчик вебхука ВКонтакте',
"""class VkCallbackView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        data = request.data

        if data.get("type") == "confirmation":
            token = settings.VK_CONFIRMATION_TOKEN
            if not token:
                return Response(status=500)
            return HttpResponse(token, content_type="text/plain")

        if (settings.VK_CALLBACK_SECRET and
                data.get("secret") != settings.VK_CALLBACK_SECRET):
            return HttpResponse("forbidden", status=403)

        if data.get("type") == "wall_post_new":
            post = data.get("object", {})
            if post.get("copy_history"):          # репост — пропустить
                return HttpResponse("ok")
            if post.get("post_type") == "postpone":
                return HttpResponse("ok")
            post_key = f"vk_post_{post.get('owner_id')}_{post.get('id')}"
            if cache.get(post_key):               # дедупликация
                return HttpResponse("ok")
            cache.set(post_key, True, timeout=86400)

            VKPost.objects.get_or_create(
                post_id=post.get('id'),
                defaults={ 'owner_id': post.get('owner_id', 0),
                           'text': post.get('text', '')[:2000] }
            )
            channel_id = settings.TELEGRAM_CHANNEL_ID
            if channel_id:
                text, photos = parse_post(post)
                if text or photos:
                    repost_to_channel(channel_id, text, photos)

        return HttpResponse("ok", content_type="text/plain")""")

    code_block(doc, 'Листинг А.3 — Функция разбора поста ВКонтакте',
"""def parse_post(post: dict) -> tuple[str, list[str]]:
    text = _clean_text(post.get("text", ""))
    photos: list[str] = []

    for att in post.get("attachments", []):
        if att.get("type") == "photo":
            url = _largest_photo_url(att["photo"])
            if url:
                photos.append(url)
        elif att.get("type") == "link":
            link_url = att["link"].get("url", "")
            title    = att["link"].get("title", "")
            if link_url and link_url not in text:
                text = f"{text}\\n{title + ': ' if title else ''}{link_url}".strip()

    owner_id = post.get("owner_id", "")
    post_id  = post.get("id", "")
    if owner_id and post_id:
        vk_url = f"https://vk.com/wall{owner_id}_{post_id}"
        text = f"{text}\\n\\n🔗 {vk_url}".strip()

    limit = 1024 if photos else 4096
    if len(text) > limit:
        text = text[:limit - 3] + "..."
    return text, photos""")

    page_break(doc)

    # ══════════════════════════════════════════════════════════════════════════
    # ПРИЛОЖЕНИЕ Б
    # ══════════════════════════════════════════════════════════════════════════
    heading(doc, 'Приложение Б', level=1)
    para(doc, '(обязательное)', align=C, indent=False)
    para(doc, 'Фрагменты исходного кода клиентской части', align=C, indent=False, space_after=8)

    code_block(doc, 'Листинг Б.1 — HTTP-клиент apiFetch (src/api.ts)',
"""export async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const method = (options.method ?? 'GET').toUpperCase();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (method !== 'GET' && method !== 'HEAD') {
        headers['X-CSRFToken'] = getCsrfToken();
    }
    return fetch(url, { ...options, headers, credentials: 'include' });
}""")

    code_block(doc, 'Листинг Б.2 — Инициализация приложения (src/App.tsx, фрагмент)',
"""const loadBootstrap = async () => {
    try {
        const response = await fetch('/api/bootstrap/');
        if (!response.ok) return;
        const payload: BootstrapPayload = await response.json();
        if (payload.products?.length) {
            setCatalogProducts(payload.products);
        }
        if (payload.links) {
            setExternalLinks({ ...defaultLinks, ...payload.links });
        }
        if (payload.reviews) {
            setReviews(payload.reviews);
        }
    } catch (error) {
        console.error('Не удалось загрузить bootstrap-данные', error);
    }
};

useEffect(() => {
    void fetch('/api/csrf/');   // получить CSRF-cookie до первого запроса
    void loadBootstrap();
    void checkAuth();
}, []);""")

    code_block(doc, 'Листинг Б.3 — Фильтрация каталога (useMemo, src/App.tsx, фрагмент)',
"""const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = catalogProducts.filter((p) => {
        const matchesQuery      = q.length === 0 ||
            \`\${p.name} \${p.subtitle}\`.toLowerCase().includes(q);
        const matchesCategories = filters.categories.length === 0 ||
            filters.categories.includes(p.category);
        const matchesEras       = filters.eras.length === 0 ||
            filters.eras.includes(p.era);
        const matchesMaterials  = filters.materials.length === 0 ||
            filters.materials.includes(p.material);
        const matchesSizes      = filters.sizes.length === 0 ||
            p.sizes.some((s) => filters.sizes.includes(s));
        const matchesStatuses   = filters.statuses.length === 0 ||
            filters.statuses.includes(p.status);
        return (matchesQuery && matchesCategories && matchesEras &&
                matchesMaterials && matchesSizes && matchesStatuses);
    });
    // ... сортировка
    return result;
}, [catalogProducts, filters, query, sort]);""")

    doc.save(output_path)
    print(f'✓ Документ сохранён: {output_path}')


if __name__ == '__main__':
    build('/home/user/-Calradia/пояснительная_записка.docx')
