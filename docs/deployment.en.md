# Deployment Guide

## Will it coexist with another site on the same dedicated server?

Yes, if you keep the boundaries clean:

- use a separate subdomain such as `chat.example.com`;
- bind the Docker web container to `127.0.0.1:${APP_HTTP_PORT}` instead of `0.0.0.0:80`;
- let the host Nginx reverse-proxy that subdomain to the container port;
- keep a distinct Compose project name such as `underworld-chat-prod`.

That is exactly how `docker-compose.prod.yml` is prepared.

## Files prepared for production

- `docker-compose.prod.yml`
- `.env.production.example`
- `apps/backend/Dockerfile.prod`
- `infra/web/Dockerfile.prod`
- `infra/nginx/app.prod.conf`
- `infra/deploy/nginx-site.example.conf`
- `infra/deploy/underworld-chat.service.example`
- `scripts/deploy-prod.sh`
- `scripts/update-prod.sh`

## Server steps

1. Clone the repository on the server.
2. Copy `.env.production.example` to `.env.production`.
3. Fill in real secrets, domain, and ports.
4. Build and start the stack.
5. Add the host Nginx site for your subdomain.
6. Issue TLS certificates with Certbot or your usual flow.

Important MinIO note for the current stack:

- `MINIO_ROOT_PASSWORD` must be at least 8 characters long;
- keep `S3_ACCESS_KEY` equal to `MINIO_ROOT_USER`;
- keep `S3_SECRET_KEY` equal to `MINIO_ROOT_PASSWORD`.

The current production setup uses the same MinIO credentials for bootstrap and backend storage access.

## Basic server prerequisites

For Ubuntu 24.04, the safest path is Docker's official Ubuntu repository:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo ${UBUNTU_CODENAME}) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker nginx
sudo usermod -aG docker $USER
```

Log out and back in once after adding your user to the `docker` group.

If you prefer Ubuntu's own packages, `docker-compose-v2` is also available for Noble 24.04, but mixing Ubuntu-packaged Docker with Docker's official packages is a bad idea. Pick one route and keep it consistent.

## Minimal commands

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

Or simply:

```bash
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

For later application updates:

```bash
chmod +x scripts/update-prod.sh
./scripts/update-prod.sh
```

## Useful first-run commands

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f web backend ws worker
curl http://127.0.0.1:18080/healthz/
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm backend python manage.py createsuperuser
```

## Host Nginx example

Use `infra/deploy/nginx-site.example.conf` as the template for the host machine Nginx. The important part is that the public Nginx listens on `80/443`, while Docker only listens on `127.0.0.1:${APP_HTTP_PORT}`.

Typical flow:

```bash
sudo cp infra/deploy/nginx-site.example.conf /etc/nginx/sites-available/underworld-chat.conf
sudo ln -s /etc/nginx/sites-available/underworld-chat.conf /etc/nginx/sites-enabled/underworld-chat.conf
sudo nginx -t
sudo systemctl reload nginx
```

Then add TLS:

```bash
sudo certbot --nginx -d chat.example.com
```

Before reloading Nginx, edit the copied config and replace:

- `chat.example.com` with your real subdomain;
- `127.0.0.1:18080` with the same value as `APP_HTTP_PORT` in `.env.production`.

## Optional systemd autostart

Docker restart policies are already enabled, so this is optional. If you want a dedicated unit:

```bash
sudo cp infra/deploy/underworld-chat.service.example /etc/systemd/system/underworld-chat.service
sudo nano /etc/systemd/system/underworld-chat.service
sudo systemctl daemon-reload
sudo systemctl enable --now underworld-chat.service
```

Change `WorkingDirectory=/opt/underworld-chat` to the real repository path on your server first.

## Updates

```bash
./scripts/update-prod.sh
```
