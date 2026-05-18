from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("workshop", "0005_order_product_fk"),
    ]

    operations = [
        migrations.CreateModel(
            name="VKPost",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("post_id", models.BigIntegerField(unique=True)),
                ("owner_id", models.BigIntegerField()),
                ("text", models.TextField(blank=True)),
                ("photo_url", models.URLField(blank=True)),
                ("posted_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-posted_at"],
            },
        ),
    ]
