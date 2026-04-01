from rest_framework.views import APIView

from apps.common.api import planned_response


class AttachmentInitView(APIView):
    def post(self, request):
        return planned_response(
            request,
            "/api/attachments/init",
            note_en="Create an attachment row and issue an upload target or multipart upload session.",
            note_ru="Создать запись вложения и выдать upload target или multipart-сессию загрузки.",
        )


class AttachmentUploadPartView(APIView):
    def post(self, request, attachment_id):
        return planned_response(
            request,
            f"/api/attachments/{attachment_id}/upload-part",
            note_en="Accept upload-part bookkeeping for large files or chunked browser uploads.",
            note_ru="Принять служебные данные upload-part для больших файлов или чанковой загрузки из браузера.",
        )


class AttachmentCompleteView(APIView):
    def post(self, request, attachment_id):
        return planned_response(
            request,
            f"/api/attachments/{attachment_id}/complete",
            note_en="Finalize the upload, validate metadata, and enqueue background processing.",
            note_ru="Завершить загрузку, проверить метаданные и поставить фоновые задачи в очередь.",
        )


class AttachmentDownloadView(APIView):
    def get(self, request, attachment_id):
        return planned_response(
            request,
            f"/api/attachments/{attachment_id}/download",
            note_en="Authorize the caller and return a proxied or signed download target.",
            note_ru="Авторизовать запрос и вернуть проксированную или подписанную ссылку на скачивание.",
        )
