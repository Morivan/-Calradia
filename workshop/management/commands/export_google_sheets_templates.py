import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from workshop.models import FinanceCalculation, MaterialReference


class Command(BaseCommand):
    help = "Выгружает CSV-шаблоны для Google Sheets из текущей базы данных."

    def handle(self, *args, **options):
        export_dir = Path("exports") / "google-sheets"
        export_dir.mkdir(parents=True, exist_ok=True)

        materials_path = export_dir / "Справочник материалов.csv"
        history_path = export_dir / "История расчётов.csv"

        with materials_path.open("w", encoding="utf-8-sig", newline="") as file:
            writer = csv.writer(file, delimiter=";")
            writer.writerow(
                [
                    "Название материала",
                    "Цена за единицу",
                    "Единица измерения",
                    "Текущий остаток на складе",
                    "Примечание",
                ]
            )
            for item in MaterialReference.objects.all():
                unit = item.unit_price.split("/", 1)[1] if "/" in item.unit_price else ""
                writer.writerow([item.name, item.unit_price, unit, item.stock, item.note])

        with history_path.open("w", encoding="utf-8-sig", newline="") as file:
            writer = csv.writer(file, delimiter=";")
            writer.writerow(
                [
                    "Дата расчета",
                    "Товар",
                    "Материал",
                    "Вес",
                    "Часы",
                    "Себестоимость",
                    "Наценка",
                    "Итоговая цена",
                ]
            )
            for row in FinanceCalculation.objects.all():
                writer.writerow(
                    [
                        row.calculation_date,
                        row.product_name,
                        row.material,
                        row.weight,
                        row.hours,
                        row.cost,
                        row.markup,
                        row.total,
                    ]
                )

        self.stdout.write(self.style.SUCCESS(f"CSV-шаблоны сохранены в {export_dir.resolve()}"))
