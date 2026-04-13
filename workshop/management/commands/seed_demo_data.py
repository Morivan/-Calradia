from django.conf import settings
from django.core.management.base import BaseCommand

from workshop.models import Client, FinanceCalculation, IntegrationLink, MarketingPublication, MaterialReference, Message, Order, Product, Review


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
        "history": "Комплект позднесредневекового строевого доспеха по мотивам музейных оригиналов.",
        "description": ["Полный комплект для реконструкции и показательных выступлений.", "Собирается по индивидуальным меркам заказчика."],
        "image": "https://armstreet.com/catalogue/full/medieval-knight-gothic-plate-armour-kit-31.jpg",
        "gallery": [
            "https://armstreet.com/catalogue/full/medieval-knight-gothic-plate-armour-kit-31.jpg",
            "https://armstreet.com/catalogue/full/medieval-knight-gothic-plate-armour-kit-34.jpg",
            "https://armstreet.com/catalogue/full/medieval-knight-gothic-plate-armour-kit-33.jpg",
            "https://armstreet.com/catalogue/full/medieval-knight-gothic-plate-armour-kit-26.jpg",
        ],
        "badge": "Новинка",
    },
    {
        "slug": "sallet",
        "name": "Шлем-саллет с забралом",
        "subtitle": "Позднесредневековый шлем, XV век",
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
        "history": "Универсальный шлем для тяжёлой пехоты и конницы.",
        "description": ["Подходит для строевой реконструкции и тренировок.", "Возможна подгонка подвесной системы под владельца."],
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
        "subtitle": "Защита корпуса для строя и турнира",
        "status": "Готовый комплект",
        "category": "Нагрудники",
        "era": "XV век",
        "material": "Латунь и сталь",
        "sizes": ["M", "L"],
        "price_from": 72000,
        "lead_time": "10 дней",
        "weight": "7.2 кг",
        "popularity": 92,
        "protection_class": "Высший",
        "history": "Миланская школа доспеха с характерной гладкой формой корпуса.",
        "description": ["Подходит для реконструкции и турнирной подготовки.", "Возможна комплектация подвесами и дополнительной защитой."],
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
        "subtitle": "Кольчужная защита кистей и запястий",
        "status": "Под заказ",
        "category": "Рукавицы",
        "era": "XIV век",
        "material": "Комбинированный",
        "sizes": ["S", "M", "L"],
        "price_from": 14525,
        "lead_time": "2-3 недели",
        "weight": "0.9 кг",
        "popularity": 71,
        "protection_class": "Средний",
        "history": "Практичная защита для фестивального и тренировочного формата.",
        "description": ["Кольчужное плетение с мягкой внутренней основой.", "Хорошо сочетается с наручами и лёгким латным комплектом."],
        "image": "https://i2.storeland.net/1/4375/43746231/afacdb/varezhka-kolchuzhnaya-klpano-sechnaya.jpg",
        "gallery": ["https://i2.storeland.net/1/4375/43746231/afacdb/varezhka-kolchuzhnaya-klpano-sechnaya.jpg"],
        "badge": "",
    },
]


class Command(BaseCommand):
    help = "Заполняет базу демонстрационными данными."

    def handle(self, *args, **options):
        Review.objects.all().delete()
        Message.objects.all().delete()
        Order.objects.all().delete()
        Client.objects.all().delete()
        MarketingPublication.objects.all().delete()
        FinanceCalculation.objects.all().delete()
        MaterialReference.objects.all().delete()
        Product.objects.all().delete()
        IntegrationLink.objects.all().delete()

        products = {}
        for payload in PRODUCTS:
            product = Product.objects.create(**payload)
            products[payload["slug"]] = product

        Review.objects.create(product=products["sallet"], author="Андрей Емельянов", text="Шлем хорошо сидит и уверенно показал себя на тренировках.", rating=5, review_date="02.03.2026")
        Review.objects.create(product=products["riveted-gauntlets"], author="Роман Соколов", text="Рукавицы удобные, подвижность кисти сохраняется.", rating=5, review_date="06.03.2026")

        MaterialReference.objects.bulk_create([
            MaterialReference(name="Сталь", unit_price="500 руб/кг", stock="82 кг", note="Основной материал для шлемов и латных элементов"),
            MaterialReference(name="Кожа", unit_price="200 руб/м²", stock="35 м²", note="Ремни, подвесы и внутренние элементы"),
            MaterialReference(name="Крепёж", unit_price="10 руб/шт", stock="540 шт", note="Заклёпки, кольца и крепёжные элементы"),
        ])

        FinanceCalculation.objects.bulk_create([
            FinanceCalculation(calculation_date="10.03.2026", product=products["milan-cuirass"], product_name="Кираса", material="Сталь", weight="2 кг", hours="20 ч", cost="7 000 руб", markup="300%", total="28 000 руб"),
            FinanceCalculation(calculation_date="08.03.2026", product=products["sallet"], product_name="Шлем-саллет", material="Сталь", weight="1.6 кг", hours="14 ч", cost="5 000 руб", markup="280%", total="19 000 руб"),
            FinanceCalculation(calculation_date="05.03.2026", product=products["riveted-gauntlets"], product_name="Клёпаные рукавицы", material="Комбинированный", weight="0.9 кг", hours="12 ч", cost="4 150 руб", markup="250%", total="14 525 руб"),
        ])

        ilya = Client.objects.create(name="Илья Романов", source=Client.Source.TELEGRAM, handle="@ilya_romanov", contact="@ilya_romanov", external_id="demo_telegram_1", last_message="Интересует кираса из стали, размер L.", last_time="10:42", unread=2)
        maria = Client.objects.create(name="Мария Волкова", source=Client.Source.VK, handle="vk.com/maria.volkova", contact="Личные сообщения VK", external_id="demo_vk_1", last_message="Есть ли готовый шлем размера M?", last_time="09:15", unread=1)

        order = Order.objects.create(client=ilya, product=products["milan-cuirass"], status=Order.Status.CONFIRMED, total_cost=21000, items=["Кираса", "Подгонка по меркам"], notes="Согласован размер L, материал сталь.")
        Message.objects.bulk_create([
            Message(client=ilya, order=order, direction=Message.Direction.CLIENT, text="Здравствуйте, интересует кираса из стали, размер L.", sent_at_label="10:35"),
            Message(client=ilya, order=order, direction=Message.Direction.MANAGER, text="Добрый день. Подскажите, интересует строевая или турнирная версия?", sent_at_label="10:38", is_read=True),
            Message(client=ilya, order=order, direction=Message.Direction.CLIENT, text="Скорее строевая, с акцентом на реконструкцию XV века.", sent_at_label="10:42"),
            Message(client=maria, direction=Message.Direction.CLIENT, text="Есть ли готовый шлем размера M?", sent_at_label="09:15"),
        ])

        MarketingPublication.objects.bulk_create([
            MarketingPublication(title="Новая кираса из стали — готово!", day="25", month_label="декабря", text="Завершили кирасу для строевой реконструкции. Ручная подгонка и крепёж под индивидуальные мерки.", product=products["milan-cuirass"], channels=["VK", "Telegram"], publish_time="14:00", status=MarketingPublication.Status.SCHEDULED, color_class="marketing-status-scheduled"),
            MarketingPublication(title="Шлем-саллет в наличии", day="21", month_label="декабря", text="Открыли запись на готовый шлем-саллет размера M.", product=products["sallet"], channels=["Telegram"], publish_time="11:30", status=MarketingPublication.Status.PUBLISHED, color_class="marketing-status-published"),
            MarketingPublication(title="Подборка рукавиц", day="18", month_label="декабря", text="Собрали подборку рукавиц для XIV века.", product=products["riveted-gauntlets"], channels=["VK"], publish_time="16:00", status=MarketingPublication.Status.ERROR, color_class="marketing-status-error", error_message="Нет прав публикации в VK."),
            MarketingPublication(title="Чек-лист снятия мерок", day="28", month_label="декабря", text="Готовим пост с памяткой по меркам для шлемов и нагрудников.", channels=["VK", "Telegram"], publish_time="10:00", status=MarketingPublication.Status.DRAFT, color_class="marketing-status-draft"),
        ])

        IntegrationLink.objects.bulk_create([
            IntegrationLink(key="telegram_order", label="Telegram для заказа", url=settings.TELEGRAM_PUBLIC_URL),
            IntegrationLink(key="telegram_public", label="Telegram", url=settings.TELEGRAM_PUBLIC_URL),
            IntegrationLink(key="vk_community", label="VK сообщество", url=settings.VK_COMMUNITY_URL),
            IntegrationLink(key="vk_messages", label="VK сообщения", url=settings.VK_MESSAGES_URL),
            IntegrationLink(key="google_sheets", label="Google Sheets", url=settings.GOOGLE_SHEETS_URL),
        ])

        self.stdout.write(self.style.SUCCESS("Демонстрационные данные успешно загружены."))
