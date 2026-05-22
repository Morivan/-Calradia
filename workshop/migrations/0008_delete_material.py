from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("workshop", "0007_order_assigned_to"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Material",
        ),
    ]
