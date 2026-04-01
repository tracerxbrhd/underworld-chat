# Руководство по деплою

## Будет ли это жить рядом с другим сайтом на том же выделенном сервере?

Да, если держать границы чистыми:

- использовать отдельный поддомен, например `chat.example.com`;
- привязать web-контейнер Docker к `127.0.0.1:${APP_HTTP_PORT}`, а не к `0.0.0.0:80`;
- пробросить этот порт наружу через хостовый Nginx reverse proxy;
- использовать отдельное имя Compose-проекта, например `underworld-chat-prod`.

Именно под это уже подготовлен `docker-compose.prod.yml`.

## Что уже подготовлено под production

- `docker-compose.prod.yml`
- `.env.production.example`
- `apps/backend/Dockerfile.prod`
- `infra/web/Dockerfile.prod`
- `infra/nginx/app.prod.conf`
- `infra/deploy/nginx-site.example.conf`
- `infra/deploy/underworld-chat.service.example`
- `scripts/deploy-prod.sh`
- `scripts/update-prod.sh`

## Шаги на сервере

1. Клонировать репозиторий на сервер.
2. Скопировать `.env.production.example` в `.env.production`.
3. Заполнить реальные секреты, домен и порты.
4. Собрать и поднять стек.
5. Добавить конфиг хостового Nginx для поддомена.
6. Выпустить TLS-сертификаты через Certbot или привычный тебе способ.

## Базовые зависимости на сервере

Если Docker и Nginx еще не установлены:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git
sudo systemctl enable --now docker nginx
sudo usermod -aG docker $USER
```

После добавления пользователя в группу `docker` нужно один раз перелогиниться.

## Минимальный набор команд

```bash
cp .env.production.example .env.production
nano .env.production

docker compose -f docker-compose.prod.yml --env-file .env.production build
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres redis minio
sleep 5
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm createbuckets
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm backend python manage.py migrate --noinput
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm backend python manage.py collectstatic --noinput
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f web backend ws
```

Либо одной командой:

```bash
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

Для следующих обновлений приложения:

```bash
chmod +x scripts/update-prod.sh
./scripts/update-prod.sh
```

## Полезные команды первого запуска

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f web backend ws worker
curl http://127.0.0.1:18080/healthz/
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm backend python manage.py createsuperuser
```

## Пример host Nginx

Используй `infra/deploy/nginx-site.example.conf` как шаблон для хостового Nginx. Ключевая идея: публичный Nginx слушает `80/443`, а Docker-сервис слушает только `127.0.0.1:${APP_HTTP_PORT}`.

Типовой порядок:

```bash
sudo cp infra/deploy/nginx-site.example.conf /etc/nginx/sites-available/underworld-chat.conf
sudo ln -s /etc/nginx/sites-available/underworld-chat.conf /etc/nginx/sites-enabled/underworld-chat.conf
sudo nginx -t
sudo systemctl reload nginx
```

После этого выдать TLS:

```bash
sudo certbot --nginx -d chat.example.com
```

Перед перезагрузкой Nginx открой скопированный конфиг и замени:

- `chat.example.com` на свой реальный поддомен;
- `127.0.0.1:18080` на то же значение, что указано в `APP_HTTP_PORT` внутри `.env.production`.

## Необязательный systemd-автозапуск

Политика `restart: unless-stopped` уже включена, так что этот шаг опционален. Если хочешь отдельный unit:

```bash
sudo cp infra/deploy/underworld-chat.service.example /etc/systemd/system/underworld-chat.service
sudo nano /etc/systemd/system/underworld-chat.service
sudo systemctl daemon-reload
sudo systemctl enable --now underworld-chat.service
```

Только сначала замени `WorkingDirectory=/opt/underworld-chat` на реальный путь к репозиторию на сервере.

## Обновления

```bash
./scripts/update-prod.sh
```
