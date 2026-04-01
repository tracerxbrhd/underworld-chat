# Руководство по деплою

## Рекомендуемый сценарий

Этот репозиторий теперь подготовлен прежде всего под полностью чистый сервер с Ubuntu 24, где крутится только Underworld Chat.

Самый простой production-путь такой:

- ставим Docker на чистую Ubuntu;
- поднимаем стек через `docker compose`;
- публикуем приложение сразу на `80` порту хоста;
- открываем сервис по IP сервера;
- если проект нужно заменить, просто сносим стек и выкатываем другой.

Для такого сценария внешний host Nginx не нужен: внутри production-стека уже есть свой Nginx-контейнер.

## Что подготовлено

- `docker-compose.prod.yml`
- `.env.production.example`
- `scripts/bootstrap-ubuntu-24.sh`
- `scripts/deploy-prod.sh`
- `scripts/update-prod.sh`
- `scripts/destroy-prod.sh`
- `apps/backend/Dockerfile.prod`
- `infra/web/Dockerfile.prod`
- `infra/nginx/app.prod.conf`

## Быстрый сценарий для чистого Ubuntu 24 сервера

### 1. Установить зависимости

На чистом сервере:

```bash
apt update
apt install -y git
git clone <URL_ТВОЕГО_РЕПО> /opt/underworld-chat
cd /opt/underworld-chat
sudo bash scripts/bootstrap-ubuntu-24.sh
```

После этого перелогинься или открой новую SSH-сессию, чтобы применилось членство в группе `docker`.

### 2. Подготовить production env

```bash
cd /opt/underworld-chat
cp .env.production.example .env.production
nano .env.production
```

Минимум проверь и поправь:

- `APP_HTTP_BIND=0.0.0.0`
- `APP_HTTP_PORT=80`
- `APP_DOMAIN=185.68.244.224`
- `DJANGO_ALLOWED_HOSTS=185.68.244.224`
- `DJANGO_CORS_ALLOWED_ORIGINS=http://185.68.244.224`
- `DJANGO_CSRF_TRUSTED_ORIGINS=http://185.68.244.224`
- `POSTGRES_PASSWORD`
- `DJANGO_SECRET_KEY`
- `MASTER_ENCRYPTION_KEY`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`

Важная оговорка по MinIO:

- `MINIO_ROOT_PASSWORD` должен быть длиной минимум 8 символов;
- `S3_ACCESS_KEY` должен совпадать с `MINIO_ROOT_USER`;
- `S3_SECRET_KEY` должен совпадать с `MINIO_ROOT_PASSWORD`.

### 3. Открыть порт в firewall

Если используешь `ufw`:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw status
```

### 4. Запустить проект

```bash
cd /opt/underworld-chat
chmod +x scripts/*.sh
./scripts/deploy-prod.sh
```

### 5. Проверить, что все поднялось

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=100 web backend ws worker
curl http://127.0.0.1/healthz/
curl http://185.68.244.224/healthz/
```

После этого приложение должно открываться по:

```text
http://185.68.244.224
```

## Обновление приложения

```bash
cd /opt/underworld-chat
git pull
chmod +x scripts/*.sh
./scripts/update-prod.sh
```

## Полный снос стека

Если хочешь полностью освободить сервер под другой проект:

```bash
cd /opt/underworld-chat
CONFIRM_DESTROY=underworld-chat ./scripts/destroy-prod.sh
```

Эта команда:

- остановит контейнеры;
- удалит volumes PostgreSQL, Redis и MinIO;
- удалит сети текущего compose-проекта.

Файлы самого репозитория она не удаляет.

После этого можно:

- удалить папку репозитория вручную;
- клонировать другой проект;
- поднять новый стек на этом же сервере.

## Что делать, если порт 80 уже занят

Если на сервере уже что-то слушает `80`, есть два варианта:

1. остановить старый проект и освободить порт;
2. временно сменить `APP_HTTP_PORT` в `.env.production`, например на `18080`, и открывать сервис по `http://IP:18080`.

Проверить, кто занял порт:

```bash
sudo ss -ltnp | grep :80
docker ps
```

## Опциональный shared-host режим

Если позже снова понадобится держать несколько проектов на одном сервере одновременно, этот же репозиторий можно использовать и в старом режиме:

- `APP_HTTP_BIND=127.0.0.1`
- `APP_HTTP_PORT=18080`
- внешний host Nginx проксирует трафик в Docker

Шаблоны для этого лежат в:

- `infra/deploy/nginx-site.example.conf`
- `infra/deploy/nginx-site.ip.example.conf`
- `infra/deploy/underworld-chat.service.example`
