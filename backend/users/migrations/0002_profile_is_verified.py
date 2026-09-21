# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='is_verified',
            field=models.BooleanField(
                default=False,
                help_text="L'utilisateur a vérifié son identité via OTP"
            ),
        ),
    ]
