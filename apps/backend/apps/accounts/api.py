from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PublicUserProfileSerializer, UserProfileSerializer
from .models import UserProfile


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user.profile)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user.profile,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserProfileDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, public_id):
        profile = (
            UserProfile.objects.select_related("user")
            .filter(user__public_id=public_id, user__is_active=True)
            .first()
        )
        if not profile:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = PublicUserProfileSerializer(profile)
        return Response(serializer.data)
