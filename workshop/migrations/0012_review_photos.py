from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("workshop", "0011_review_author_optional"),
    ]

    operations = [
        migrations.AddField(
            model_name="review",
            name="photos",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
