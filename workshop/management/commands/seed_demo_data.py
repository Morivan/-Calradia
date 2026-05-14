from django.conf import settings
from django.core.management.base import BaseCommand

from workshop.models import Client, Colleague, IntegrationLink, Material, Order, Product, Review


PRODUCTS = [
    {
        "slug": "gothic-armor",
        "name": "Готический латный доспех",
        "subtitle": "Полный комплект для пешего боя, XV век",
        "status": "Под заказ",
        "category": "Полные комплекты",
        "era": "XV век",
        "material": "Сталь",
        "sizes": ["M", "L", "XL"],
        "price_from": 215000,
        "lead_time": "6-8 недель",
        "weight": "24 кг",
        "popularity": 98,
        "protection_class": "Высший",
        "history": (
            "Готический доспех сложился в Германии и Австрии в 1420–1480-х годах. "
            "Его отличительная черта — острые грани и вытянутые пластины, следующие "
            "мускулатуре тела. Музейные образцы хранятся в Метрополитен-музее и Венской "
            "оружейной палате. Комплект включает шлем, горжет, наплечники, нарукавники, "
            "латные перчатки, набедренники и поножи."
        ),
        "description": [
            "Полный строевой комплект по образцам германских мастеров конца XV века. "
            "Подходит для реконструкции, показательных выступлений и турнирного формата.",
            "Каждый элемент изготавливается по индивидуальным меркам. "
            "Шлем — закрытый бацинет с забралом. Поверхность — полированная сталь 1,5 мм.",
            "Возможна комплектация с кольчужной подкладкой, кожаной подгонкой "
            "и декоративным травлением.",
        ],
        "image": "https://armstreet.com/catalogue/full/medieval-knight-gothic-plate-armour-kit-31.jpg",
        "gallery": [
            "https://armstreet.com/catalogue/full/medieval-knight-gothic-plate-armour-kit-31.jpg",
            "https://armstreet.com/catalogue/full/medieval-knight-gothic-plate-armour-kit-34.jpg",
            "https://armstreet.com/catalogue/full/medieval-knight-gothic-plate-armour-kit-33.jpg",
            "https://armstreet.com/catalogue/full/medieval-knight-gothic-plate-armour-kit-26.jpg",
        ],
        "badge": "Хит",
    },
    {
        "slug": "sallet",
        "name": "Шлем-саллет с забралом",
        "subtitle": "Позднесредневековый шлем пехоты и конницы",
        "status": "Готовый комплект",
        "category": "Шлемы",
        "era": "XV век",
        "material": "Сталь",
        "sizes": ["M", "L"],
        "price_from": 48000,
        "lead_time": "В наличии",
        "weight": "3.8 кг",
        "popularity": 85,
        "protection_class": "Высокий",
        "history": (
            "Саллет получил широкое распространение в Западной Европе в 1420–1490-х годах. "
            "Форма с характерным задним выносом защищала шею, а съёмное забрало обеспечивало "
            "обзор. Использовался как тяжёлой пехотой, так и конницей. Образцы хранятся "
            "в Музее армии в Париже и в коллекции Уоллеса в Лондоне."
        ),
        "description": [
            "Подходит для строевой реконструкции формата HMB и открытых фестивалей. "
            "Толщина стали 2 мм, подвесная система регулируется под голову владельца.",
            "Возможна установка горжета-бевора для полной защиты шеи и подбородка. "
            "Поверхность — тёмное воронение или полированная сталь на выбор.",
        ],
        "image": "https://armstreet.com/catalogue/full/gothic-sallet-helmet-xv-century-2.jpg",
        "gallery": [
            "https://armstreet.com/catalogue/full/gothic-sallet-helmet-xv-century-2.jpg",
            "https://armstreet.com/catalogue/full/gothic-sallet-helmet-xv-century-1.jpg",
            "https://armstreet.com/catalogue/full/gothic-sallet-helmet-xv-century.jpg",
            "https://armstreet.com/catalogue/full/gothic-sallet-helmet-xv-century-3.jpg",
        ],
        "badge": "",
    },
    {
        "slug": "milan-cuirass",
        "name": "Миланский нагрудник",
        "subtitle": "Корпусная защита строевого рыцаря",
        "status": "Готовый комплект",
        "category": "Нагрудники",
        "era": "XV век",
        "material": "Сталь",
        "sizes": ["S", "M", "L"],
        "price_from": 72000,
        "lead_time": "10 дней",
        "weight": "7.2 кг",
        "popularity": 92,
        "protection_class": "Высший",
        "history": (
            "Миланская школа доспеха XV века отличается гладкой закруглённой формой "
            "нагрудника, максимально отражающей удары. Мастера Бронья и Мисси поставляли "
            "кирасы ко дворам Сфорца и европейским монархам. "
            "Оригиналы экспонируются в музеях Милана и Мадрида."
        ),
        "description": [
            "Нагрудник со спинной пластиной, соединённых кожаными ремнями. "
            "Подходит для реконструкции и турнирной подготовки.",
            "Толщина: грудная пластина 2 мм, спина 1,5 мм. "
            "Крепления регулируются по объёму груди и талии. "
            "Возможна комплектация набрюшником и наплечниками.",
        ],
        "image": "https://hbcarmorshop.com/cdn/shop/products/Englishplatecuirass18_1200x905.jpg?v=1666440223",
        "gallery": [
            "https://hbcarmorshop.com/cdn/shop/products/Englishplatecuirass18_1200x905.jpg?v=1666440223",
            "https://hbcarmorshop.com/cdn/shop/products/Englishplatecuirass18_grande.jpg?v=1666440223",
        ],
        "badge": "",
    },
    {
        "slug": "riveted-gauntlets",
        "name": "Клёпаные рукавицы",
        "subtitle": "Кольчужно-латная защита кистей, XIV век",
        "status": "Под заказ",
        "category": "Рукавицы",
        "era": "XIV век",
        "material": "Комбинированный",
        "sizes": ["S", "M", "L"],
        "price_from": 14500,
        "lead_time": "2-3 недели",
        "weight": "0.9 кг",
        "popularity": 71,
        "protection_class": "Средний",
        "history": (
            "Клёпаные рукавицы XIV века совмещали кольчужное плетение с пластинами "
            "на тыльной стороне ладони. Применялись как самостоятельная защита "
            "при лёгком вооружении, так и в сочетании с латными наручами. "
            "Находки известны из раскопок в Польше и Чехии."
        ),
        "description": [
            "Кольчужное плетение с мягкой внутренней основой из плотной кожи. "
            "Хорошо сочетаются с наручами и лёгким латным комплектом XIV–XV вв.",
            "Размер подбирается по обхвату ладони. "
            "Кольца — сварные стальные, диаметр 8 мм, толщина 1,2 мм.",
        ],
        "image": "https://i2.storeland.net/1/4375/43746231/afacdb/varezhka-kolchuzhnaya-klpano-sechnaya.jpg",
        "gallery": [
            "https://i2.storeland.net/1/4375/43746231/afacdb/varezhka-kolchuzhnaya-klpano-sechnaya.jpg",
        ],
        "badge": "",
    },
    {
        "slug": "topfhelm",
        "name": "Топфхельм",
        "subtitle": "Горшковый шлем крестоносца, XIII век",
        "status": "Под заказ",
        "category": "Шлемы",
        "era": "XIII век",
        "material": "Сталь",
        "sizes": ["M", "L", "XL"],
        "price_from": 38000,
        "lead_time": "3-4 недели",
        "weight": "3.2 кг",
        "popularity": 77,
        "protection_class": "Высокий",
        "history": (
            "Топфхельм (нем. Topfhelm — горшковый шлем) использовался европейскими "
            "рыцарями с конца XII по первую половину XIV века. Полностью закрывал голову, "
            "обзор обеспечивался щелью для глаз. Стал символом эпохи крестовых походов. "
            "Известен по рыцарским гробницам Англии, Германии и Франции."
        ),
        "description": [
            "Изготавливается из стальных листов 2–2,5 мм с клёпаными соединениями. "
            "Внутри — кожаная подвесная система для амортизации ударов.",
            "Подходит для реконструкции XIII–XIV вв., пеших шествий и статичных "
            "экспозиций. По заказу — с гербовым щитком или налобной пластиной.",
        ],
        "image": "https://armstreet.com/catalogue/full/crusader-great-helmet-medieval-3.jpg",
        "gallery": [
            "https://armstreet.com/catalogue/full/crusader-great-helmet-medieval-3.jpg",
            "https://armstreet.com/catalogue/full/crusader-great-helmet-medieval-2.jpg",
            "https://armstreet.com/catalogue/full/crusader-great-helmet-medieval.jpg",
        ],
        "badge": "",
    },
    {
        "slug": "norman-shield",
        "name": "Норманнский щит",
        "subtitle": "Каплевидный щит пехоты и конницы, XI–XIII вв.",
        "status": "Готовый комплект",
        "category": "Щиты",
        "era": "XIII век",
        "material": "Комбинированный",
        "sizes": ["M", "L"],
        "price_from": 18000,
        "lead_time": "В наличии",
        "weight": "4.1 кг",
        "popularity": 80,
        "protection_class": "Средний",
        "history": (
            "Норманнский каплевидный щит появился в X веке и получил массовое "
            "распространение после Нормандского завоевания Англии в 1066 году. "
            "Изображён на гобелене из Байё. Применялся как конницей, так и пехотой "
            "до появления более компактных щитов XIII–XIV веков."
        ),
        "description": [
            "Основа — многослойная фанера берёзы, оклеенная льном и покрытая "
            "кожей с натяжкой на влажную. Умбон и окантовка — листовая сталь.",
            "Доступна роспись гербовыми символами по эскизу заказчика. "
            "Лямки и рукоять из натуральной кожи с подгонкой по руке.",
        ],
        "image": "https://armstreet.com/catalogue/full/medieval-shield-iron-boss-leather-covered-31.jpg",
        "gallery": [
            "https://armstreet.com/catalogue/full/medieval-shield-iron-boss-leather-covered-31.jpg",
            "https://armstreet.com/catalogue/full/medieval-shield-iron-boss-leather-covered-3.jpg",
            "https://armstreet.com/catalogue/full/medieval-shield-iron-boss-leather-covered-2.jpg",
        ],
        "badge": "",
    },
    {
        "slug": "brigandine",
        "name": "Бригандина",
        "subtitle": "Пластинчатый доспех наёмника, XIV–XV вв.",
        "status": "Под заказ",
        "category": "Нагрудники",
        "era": "XIV век",
        "material": "Комбинированный",
        "sizes": ["S", "M", "L", "XL"],
        "price_from": 54000,
        "lead_time": "4-5 недель",
        "weight": "6.0 кг",
        "popularity": 88,
        "protection_class": "Высокий",
        "history": (
            "Бригандина — тканевый или кожаный корпус, изнутри усиленный "
            "стальными пластинами, соединёнными клёпками. Широко использовалась "
            "наёмниками, горожанами и лёгкими рыцарями в XIV–XV вв. "
            "Практична: дешевле цельной латной кирасы, но обеспечивает хорошую защиту."
        ),
        "description": [
            "Пластины — листовая сталь 1,5 мм. Основа — плотная кожа или "
            "льняная ткань дублёная. Клёпки латунные или стальные на выбор.",
            "Подходит для реконструкции XIV в., ролевых игр и фестивалей. "
            "Размер подбирается по объёму груди и длине торса.",
        ],
        "image": "https://armstreet.com/catalogue/full/brigandine-plate-armour-3.jpg",
        "gallery": [
            "https://armstreet.com/catalogue/full/brigandine-plate-armour-3.jpg",
            "https://armstreet.com/catalogue/full/brigandine-plate-armour-2.jpg",
            "https://armstreet.com/catalogue/full/brigandine-plate-armour.jpg",
        ],
        "badge": "Популярный",
    },
    {
        "slug": "chainmail-coif",
        "name": "Кольчужный коиф с бармицей",
        "subtitle": "Защита головы и шеи из сварных колец",
        "status": "Готовый комплект",
        "category": "Шлемы",
        "era": "XIII век",
        "material": "Сталь",
        "sizes": ["S", "M", "L"],
        "price_from": 22000,
        "lead_time": "5 дней",
        "weight": "2.4 кг",
        "popularity": 74,
        "protection_class": "Средний",
        "history": (
            "Кольчужный коиф с бармицей использовался в Западной Европе с XI по XIV век. "
            "Надевался под шлем или самостоятельно. Защищал голову, шею и плечи "
            "от скользящих ударов. Незаменим в комплекте с топфхельмом или "
            "бацинетом без забрала."
        ),
        "description": [
            "Плетение — сварные стальные кольца диаметром 8 мм, толщина 1,2 мм. "
            "Внутри — тканевая подкладка из хлопка для комфорта при длительном ношении.",
            "Совместим со шлемами нашей мастерской. "
            "По заказу — увеличенная бармица, закрывающая всё лицо кроме глаз.",
        ],
        "image": "https://armstreet.com/catalogue/full/medieval-chainmail-coif-chestnut-3.jpg",
        "gallery": [
            "https://armstreet.com/catalogue/full/medieval-chainmail-coif-chestnut-3.jpg",
            "https://armstreet.com/catalogue/full/medieval-chainmail-coif-chestnut-2.jpg",
            "https://armstreet.com/catalogue/full/medieval-chainmail-coif-chestnut.jpg",
        ],
        "badge": "",
    },
    {
        "slug": "maximilian-full-set",
        "name": "Максимилиановский доспех",
        "subtitle": "Турнирный комплект, начало XVI века",
        "status": "Реконструкция",
        "category": "Полные комплекты",
        "era": "XVI век",
        "material": "Сталь",
        "sizes": ["L", "XL"],
        "price_from": 320000,
        "lead_time": "10-14 недель",
        "weight": "28 кг",
        "popularity": 95,
        "protection_class": "Высший",
        "history": (
            "Максимилиановский доспех получил название в честь императора Максимилиана I, "
            "при дворе которого он сложился в 1490–1520-е годы. "
            "Характерная черта — рифлёные каннелюры, усиливающие жёсткость пластин "
            "и придающие эффектный внешний вид. Использовался на турнирах и в парадных целях."
        ),
        "description": [
            "Реконструкция по образцам Венской оружейной палаты. "
            "Полный комплект: армет, горжет, наплечники, наручи, перчатки, "
            "нагрудник со спиной, набедренники, поножи с сабатонами.",
            "Каннелюры выполняются вручную. Материал — листовая сталь 1,5–2,5 мм. "
            "Поверхность — полировка до зеркального блеска или воронение.",
            "Изготавливается строго под заказ. Стоимость зависит от глубины детализации "
            "и наличия декоративных элементов (гравировка, золочение).",
        ],
        "image": "https://armstreet.com/catalogue/full/maximilian-armour-set-full-7.jpg",
        "gallery": [
            "https://armstreet.com/catalogue/full/maximilian-armour-set-full-7.jpg",
            "https://armstreet.com/catalogue/full/maximilian-armour-set-full-5.jpg",
            "https://armstreet.com/catalogue/full/maximilian-armour-set-full-3.jpg",
            "https://armstreet.com/catalogue/full/maximilian-armour-set-full-2.jpg",
        ],
        "badge": "Премиум",
    },
]


REVIEWS = [
    ("sallet", "Андрей Емельянов", "Шлем хорошо сидит, уверенно показал себя на тренировках и на фестивале. Подгонка подвесной системы заняла 10 минут.", 5, "12.03.2026"),
    ("sallet", "Виктор Лебедев", "Брал для реконструкции XIV века — смотрится аутентично. Воронение держится без нареканий.", 5, "28.02.2026"),
    ("milan-cuirass", "Роман Соколов", "Кираса сидит плотно, не болтается при движении. Качество клёпки хорошее, всё ровно.", 5, "05.03.2026"),
    ("riveted-gauntlets", "Сергей Ильин", "Рукавицы удобные, подвижность кисти сохраняется. Хватка на рукояти — нормальная.", 4, "01.03.2026"),
    ("brigandine", "Дмитрий Козлов", "Бригандина вышла тяжеловатой по ощущениям, но защита на фестивале порадовала. Пластины не гремят.", 4, "18.03.2026"),
    ("norman-shield", "Анна Сидорова", "Щит лёгкий для своего размера. Кожа натянута хорошо, умбон не скрипит.", 5, "22.03.2026"),
    ("gothic-armor", "Олег Петров", "Комплект сделали за 7 недель строго по меркам. Подгонка идеальная — ничего не давит.", 5, "10.04.2026"),
]


class Command(BaseCommand):
    help = "Заполняет базу демонстрационными данными (продукты, отзывы, клиенты, материалы)."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Удалить существующие данные перед загрузкой")

    def handle(self, *args, **options):
        if options["clear"]:
            Review.objects.all().delete()
            Order.objects.all().delete()
            Client.objects.all().delete()
            Product.objects.all().delete()
            IntegrationLink.objects.all().delete()
            Material.objects.all().delete()
            Colleague.objects.all().delete()
            self.stdout.write("Данные очищены.")

        products = {}
        created = skipped = 0
        for payload in PRODUCTS:
            obj, was_created = Product.objects.get_or_create(slug=payload["slug"], defaults=payload)
            products[payload["slug"]] = obj
            if was_created:
                created += 1
            else:
                skipped += 1

        self.stdout.write(f"Товары: {created} создано, {skipped} уже существовало.")

        reviews_created = 0
        for slug, author, text, rating, date in REVIEWS:
            product = products.get(slug)
            if product and not Review.objects.filter(product=product, author=author).exists():
                Review.objects.create(product=product, author=author, text=text, rating=rating, review_date=date)
                reviews_created += 1

        self.stdout.write(f"Отзывы: {reviews_created} создано.")

        clients_data = [
            {"name": "Иванов Иван", "vk_url": "https://vk.com/id000001", "status": Client.Status.COMPLETED, "notes": "Постоянный клиент, брал саллет и рукавицы."},
            {"name": "Петров Сергей", "vk_url": "https://vk.com/id000002", "status": Client.Status.ACTIVE, "notes": "Интересуется бригандиной."},
            {"name": "Сидорова Анна", "vk_url": "https://vk.com/id000003", "status": Client.Status.POTENTIAL, "notes": "Написала в ЛС группы, хочет щит."},
            {"name": "Козлов Дмитрий", "vk_url": "https://vk.com/id000004", "status": Client.Status.ACTIVE, "notes": "Реконструктор, интересуется доспехами XIV в."},
            {"name": "Вершинина Ольга", "vk_url": "https://vk.com/id000005", "status": Client.Status.POTENTIAL, "notes": "Хочет подарочный шлем мужу."},
        ]
        clients_created = 0
        clients = []
        for data in clients_data:
            obj, was_created = Client.objects.get_or_create(vk_url=data["vk_url"], defaults=data)
            clients.append(obj)
            if was_created:
                clients_created += 1

        self.stdout.write(f"Клиенты: {clients_created} создано.")

        orders_data = [
            {"client": clients[0], "client_name": clients[0].name, "product": products.get("sallet"), "product_name": "Шлем-саллет", "status": Order.Status.DONE, "total": 48000, "advance": 24000, "notes": "Выдан на фестивале."},
            {"client": clients[1], "client_name": clients[1].name, "product": products.get("brigandine"), "product_name": "Бригандина", "status": Order.Status.IN_PROGRESS, "total": 54000, "advance": 20000, "notes": "Размер L, клёпки латунные."},
            {"client": clients[3], "client_name": clients[3].name, "product": products.get("gothic-armor"), "product_name": "Готический доспех", "status": Order.Status.NEW, "total": 215000, "advance": 50000, "notes": "Ждёт уточнения мерок."},
        ]
        orders_created = 0
        for data in orders_data:
            if not Order.objects.filter(client=data["client"], product_name=data["product_name"]).exists():
                Order.objects.create(**data)
                orders_created += 1

        self.stdout.write(f"Заказы: {orders_created} создано.")

        materials_data = [
            {"name": "Листовая сталь 2 мм", "type": Material.Type.MATERIAL, "direction": Material.Direction.IRON, "unit": "кг", "price": 600, "stock": 40, "min_stock": 10},
            {"name": "Листовая сталь 1.5 мм", "type": Material.Type.MATERIAL, "direction": Material.Direction.ARMOR, "unit": "кг", "price": 580, "stock": 55, "min_stock": 15},
            {"name": "Кожа натуральная", "type": Material.Type.MATERIAL, "direction": Material.Direction.ARMOR, "unit": "м²", "price": 800, "stock": 12, "min_stock": 4},
            {"name": "Кольчужные кольца 8 мм", "type": Material.Type.MATERIAL, "direction": Material.Direction.IRON, "unit": "кг", "price": 1200, "stock": 18, "min_stock": 5},
            {"name": "Заклёпки стальные 4 мм", "type": Material.Type.CONSUMABLE, "direction": Material.Direction.IRON, "unit": "шт", "price": 3, "stock": 2000, "min_stock": 500},
            {"name": "Заклёпки латунные 4 мм", "type": Material.Type.CONSUMABLE, "direction": Material.Direction.ARMOR, "unit": "шт", "price": 5, "stock": 1500, "min_stock": 300},
            {"name": "Полировочная паста", "type": Material.Type.CONSUMABLE, "direction": Material.Direction.ARMOR, "unit": "шт", "price": 350, "stock": 8, "min_stock": 2},
            {"name": "Воронение (раствор)", "type": Material.Type.CONSUMABLE, "direction": Material.Direction.IRON, "unit": "л", "price": 900, "stock": 3, "min_stock": 1},
        ]
        mat_created = 0
        for data in materials_data:
            _, was_created = Material.objects.get_or_create(name=data["name"], defaults=data)
            if was_created:
                mat_created += 1

        self.stdout.write(f"Материалы: {mat_created} создано.")

        colleagues_data = [
            {"name": "Алексей Кузнецов", "direction": Colleague.Direction.IRON, "specialization": "Шлемы и кирасы", "contact": "vk.com/kuznetsov_forge"},
            {"name": "Роман Белов", "direction": Colleague.Direction.ARMOR, "specialization": "Латная защита ног и рук", "contact": "vk.com/belov_armor"},
            {"name": "Антон Горелов", "direction": Colleague.Direction.IRON, "specialization": "Кольчужное плетение и полировка", "contact": ""},
        ]
        col_created = 0
        for data in colleagues_data:
            _, was_created = Colleague.objects.get_or_create(name=data["name"], defaults=data)
            if was_created:
                col_created += 1

        self.stdout.write(f"Коллеги: {col_created} создано.")

        links_data = [
            ("telegram_order", "Telegram для заказа", settings.TELEGRAM_PUBLIC_URL or "https://t.me/kalradiaWarBand"),
            ("telegram_public", "Telegram-канал", settings.TELEGRAM_PUBLIC_URL or "https://t.me/kalradiaWarBand"),
            ("vk_community", "VK сообщество", settings.VK_COMMUNITY_URL or "https://vk.com/calradia_band"),
            ("vk_messages", "VK сообщения", settings.VK_MESSAGES_URL or "https://vk.com/calradia_band"),
        ]
        for key, label, url in links_data:
            IntegrationLink.objects.get_or_create(key=key, defaults={"label": label, "url": url})

        self.stdout.write(self.style.SUCCESS("Демонстрационные данные загружены."))
