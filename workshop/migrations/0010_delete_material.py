from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("workshop", "0009_review_remove_rating_add_vk_photo"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Material",
        ),
    ]
