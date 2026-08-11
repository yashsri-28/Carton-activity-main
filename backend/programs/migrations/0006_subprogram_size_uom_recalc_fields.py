# Generated manually (hand-written to match the model changes in this patch)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('programs', '0005_cartonprogram_program_type_bathrobeprogramdetails_and_more'),
        # NOTE: the repo has two separate, never-merged '0003' migrations
        # (0003_alter_sampleprogram_length_cm_and_more and
        # 0003_cartonprogram_remark_and_more), both branching off 0002_initial.
        # 0004/0005 only chain through the former, leaving the latter an
        # unmerged leaf. Depending on it here merges the two branches so this
        # migration (and everything after it) has a single, unambiguous
        # migration history. Functionally harmless either way since `migrate`
        # applies both branches regardless, but this avoids the
        # "multiple leaf nodes" error next time someone runs makemigrations.
        ('programs', '0003_cartonprogram_remark_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='cartonprogramsubprogram',
            name='size',
            field=models.CharField(
                choices=[
                    ('SINGLE', 'Single'),
                    ('TWIN', 'Twin'),
                    ('TWIN XL', 'Twin XL'),
                    ('FULL', 'Full/Double'),
                    ('QUEEN', 'Queen'),
                    ('KING', 'King'),
                    ('CALIFORNIA KING', 'California King'),
                    ('OTHER', 'Other'),
                ],
                max_length=30,
                null=True,
                blank=True,
            ),
        ),
        migrations.AddField(
            model_name='cartonprogramsubprogram',
            name='product_type',
            field=models.CharField(
                choices=[
                    ('SHEET_SET', 'Sheet Set'),
                    ('FLAT_SHEET', 'Flat Sheet'),
                    ('FITTED_SHEET', 'Fitted Sheet'),
                    ('PILLOWCASE', 'Pillowcase'),
                    ('DUVET_COVER', 'Duvet Cover'),
                    ('OTHER', 'Other'),
                ],
                max_length=30,
                null=True,
                blank=True,
            ),
        ),
        migrations.AddField(
            model_name='cartonprogramsubprogram',
            name='weight_uom',
            field=models.CharField(
                choices=[('GM', 'Grams'), ('KG', 'Kilograms'), ('LB', 'Pounds')],
                default='GM',
                max_length=5,
            ),
        ),
        migrations.AddField(
            model_name='cartonprogramsubprogram',
            name='self_fabric_bag',
            field=models.CharField(
                choices=[('YES', 'Yes'), ('NO', 'No')],
                max_length=3,
                null=True,
                blank=True,
            ),
        ),
        migrations.AddField(
            model_name='cartonprogramsubprogram',
            name='is_recalculated',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='cartonprogramsubprogram',
            name='last_recalculated_on',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='cartonprogramsubprogram',
            name='ribbon',
            field=models.CharField(
                choices=[('YES', 'Yes'), ('NO', 'No')],
                max_length=3,
                null=True,
                blank=True,
            ),
        ),
        migrations.AlterField(
            model_name='cartonprogramsubprogram',
            name='belly_band',
            field=models.CharField(
                choices=[('YES', 'Yes'), ('NO', 'No')],
                max_length=3,
                null=True,
                blank=True,
            ),
        ),
    ]
