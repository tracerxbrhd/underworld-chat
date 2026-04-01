try:
    from .celery import app as celery_app
except ImportError:  # pragma: no cover - keeps management commands usable without Celery extras.
    celery_app = None

__all__ = ("celery_app",)
