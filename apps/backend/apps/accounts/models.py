from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimestampedModel, UUIDPrimaryKeyModel


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, public_id: str, password: str | None = None, **extra_fields):
        if not public_id:
            raise ValueError("The public_id field must be set.")

        display_name = extra_fields.pop("display_name", public_id)
        user = self.model(public_id=public_id, display_name=display_name, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_user(self, public_id: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(public_id, password, **extra_fields)

    def create_superuser(self, public_id: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if not extra_fields.get("is_staff"):
            raise ValueError("Superuser must have is_staff=True.")
        if not extra_fields.get("is_superuser"):
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(public_id, password, **extra_fields)


class User(UUIDPrimaryKeyModel, TimestampedModel, AbstractBaseUser, PermissionsMixin):
    public_id = models.SlugField(max_length=32, unique=True)
    display_name = models.CharField(max_length=64)
    avatar = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "public_id"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        ordering = ("created_at",)

    def __str__(self) -> str:
        return self.display_name


class UserProfile(UUIDPrimaryKeyModel, TimestampedModel):
    class Visibility(models.TextChoices):
        EVERYONE = "everyone", "Everyone"
        CONTACTS = "contacts", "Contacts"
        NOBODY = "nobody", "Nobody"

    class PreferredLanguage(models.TextChoices):
        ENGLISH = "en", _("English")
        RUSSIAN = "ru", _("Russian")

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.CharField(max_length=160, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    preferred_language = models.CharField(
        max_length=8,
        choices=PreferredLanguage.choices,
        default=PreferredLanguage.ENGLISH,
    )
    last_seen_visibility = models.CharField(
        max_length=16,
        choices=Visibility.choices,
        default=Visibility.CONTACTS,
    )
    profile_visibility = models.CharField(
        max_length=16,
        choices=Visibility.choices,
        default=Visibility.CONTACTS,
    )

    def __str__(self) -> str:
        return f"Profile<{self.user.public_id}>"
