# Underworld Chat

Underworld Chat is a privacy-first messenger scaffold designed around user-chosen logins, passwords, and device sessions instead of phone numbers.

## Product Shape

- Public landing page for guests
- Authenticated single-page dialog workspace
- Left-side dialog list and right-side chat panel
- Open registration without mandatory invite codes
- Editable profile with avatar, bio, birth date, and display name
- Immutable account login (`public_id`)
- Personal notes channel scaffold with the same interaction model as a normal chat
- Chat and user search with quick direct-dialog creation

## Stack

- Backend: Django + Django REST Framework + ASGI/Channels
- Realtime: WebSocket over ASGI
- Database: PostgreSQL
- Cache / presence / broker: Redis
- Frontend: React + Vite + TypeScript
- Files: MinIO (S3-compatible)
- Background jobs: Celery
- Reverse proxy: Nginx
- Local development: Docker Compose

## Internationalization

The repository is prepared for both English and Russian:

- bilingual repository documentation;
- frontend translation dictionary and language switcher;
- Django language settings with `en` and `ru` enabled;
- room for future gettext-based backend translations.

## License

This project is released under the Apache License 2.0 with a `NOTICE` file that preserves attribution to `tracerxbrhd`.

## Local Start

1. Copy `.env.example` to `.env`.
2. Review secrets and ports.
3. Start everything with `docker compose up --build`.
4. Open `http://localhost`.

## Deployment

- Production compose: `docker-compose.prod.yml`
- Server guide: `docs/deployment.en.md`
- Ubuntu 24 bootstrap script: `scripts/bootstrap-ubuntu-24.sh`
- Full production teardown script: `scripts/destroy-prod.sh`
