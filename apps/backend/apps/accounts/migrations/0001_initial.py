import apps.accounts.models
import django.utils.translation
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                (
                    "is_superuser",
                    models.BooleanField(
                        default=False,
                        help_text="Designates that this user has all permissions without explicitly assigning them.",
                        verbose_name="superuser status",
                    ),
                ),
                ("public_id", models.SlugField(max_length=32, unique=True)),
                ("display_name", models.CharField(max_length=64)),
                ("avatar", models.URLField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("is_staff", models.BooleanField(default=False)),
                (
                    "groups",
                    models.ManyToManyField(
                        blank=True,
                        help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.group",
                        verbose_name="groups",
                    ),
                ),
                (
                    "user_permissions",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Specific permissions for this user.",
                        related_name="user_set",
                        related_query_name="user",
                        to="auth.permission",
                        verbose_name="user permissions",
                    ),
                ),
            ],
            options={
                "ordering": ("created_at",),
            },
            managers=[
                ("objects", apps.accounts.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("bio", models.CharField(blank=True, max_length=160)),
                ("birth_date", models.DateField(blank=True, null=True)),
                (
                    "preferred_language",
                    models.CharField(
                        choices=[("en", django.utils.translation.gettext_lazy("English")), ("ru", django.utils.translation.gettext_lazy("Russian"))],
                        default="en",
                        max_length=8,
                    ),
                ),
                (
                    "last_seen_visibility",
                    models.CharField(
                        choices=[("everyone", "Everyone"), ("contacts", "Contacts"), ("nobody", "Nobody")],
                        default="contacts",
                        max_length=16,
                    ),
                ),
                (
                    "profile_visibility",
                    models.CharField(
                        choices=[("everyone", "Everyone"), ("contacts", "Contacts"), ("nobody", "Nobody")],
                        default="contacts",
                        max_length=16,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(on_delete=models.deletion.CASCADE, related_name="profile", to="accounts.user"),
                ),
            ],
        ),
    ]
