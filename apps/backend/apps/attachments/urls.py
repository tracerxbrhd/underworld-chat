from django.urls import path

from .api import (
    AttachmentCompleteView,
    AttachmentDownloadView,
    AttachmentInitView,
    AttachmentUploadPartView,
)

urlpatterns = [
    path("init", AttachmentInitView.as_view(), name="attachment-init"),
    path("<uuid:attachment_id>/upload-part", AttachmentUploadPartView.as_view(), name="attachment-upload-part"),
    path("<uuid:attachment_id>/complete", AttachmentCompleteView.as_view(), name="attachment-complete"),
    path("<uuid:attachment_id>/download", AttachmentDownloadView.as_view(), name="attachment-download"),
]

