from rest_framework import serializers

from .models import User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    public_id = serializers.CharField(source="user.public_id", read_only=True)
    display_name = serializers.CharField(source="user.display_name")
    avatar = serializers.URLField(source="user.avatar", allow_blank=True, required=False)

    class Meta:
        model = UserProfile
        fields = (
            "public_id",
            "display_name",
            "avatar",
            "bio",
            "birth_date",
            "preferred_language",
            "last_seen_visibility",
            "profile_visibility",
        )

    def update(self, instance: UserProfile, validated_data):
        user_payload = validated_data.pop("user", {})
        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)
        instance.save()

        user = instance.user
        if "display_name" in user_payload:
            user.display_name = user_payload["display_name"]
        if "avatar" in user_payload:
            user.avatar = user_payload["avatar"]
        user.save(update_fields=["display_name", "avatar", "updated_at"])

        return instance


class CompactUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "public_id", "display_name", "avatar")


class PublicUserProfileSerializer(serializers.ModelSerializer):
    public_id = serializers.CharField(source="user.public_id", read_only=True)
    display_name = serializers.CharField(source="user.display_name", read_only=True)
    avatar = serializers.URLField(source="user.avatar", read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            "public_id",
            "display_name",
            "avatar",
            "bio",
            "birth_date",
        )
