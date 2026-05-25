from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("workshop", "0012_review_photos"),
    ]

    operations = [
        migrations.AddField(
            model_name="productset",
            name="discount_percent",
            field=models.PositiveSmallIntegerField(
                blank=True,
                null=True,
                help_text="Скидка в % (0–100). Если задана price_from, это поле игнорируется",
            ),
        ),
    ]
