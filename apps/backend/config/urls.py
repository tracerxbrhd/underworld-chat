from django.contrib import admin
from django.urls import include, path

from apps.common.views import HealthcheckView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz/", HealthcheckView.as_view(), name="healthz"),
    path("api/", include("config.api_urls")),
]

