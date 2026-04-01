# Deployment Guide

## Recommended setup

This repository is now primarily prepared for a completely clean Ubuntu 24 server that runs only Underworld Chat.

The simplest production path is:

- install Docker on a fresh Ubuntu machine;
- start the stack with `docker compose`;
- publish the app directly on host port `80`;
- open the service by the server IP;
- if you want to swap projects later, tear the stack down and deploy another one.

In this mode you do not need a separate host Nginx layer: the production stack already ships with its own Nginx container.

## Files prepared for this flow

- `docker-compose.prod.yml`
- `.env.production.example`
- `scripts/bootstrap-ubuntu-24.sh`
- `scripts/deploy-prod.sh`
- `scripts/update-prod.sh`
- `scripts/destroy-prod.sh`
- `apps/backend/Dockerfile.prod`
- `infra/web/Dockerfile.prod`
- `infra/nginx/app.prod.conf`

## Quick path for a fresh Ubuntu 24 server

### 1. Install dependencies

On a clean server:

```bash
apt update
apt install -y git
git clone <YOUR_REPOSITORY_URL> /opt/underworld-chat
cd /opt/underworld-chat
sudo bash scripts/bootstrap-ubuntu-24.sh
```

Then log out and back in, or open a new SSH session, so Docker group membership takes effect.

### 2. Prepare the production env file

```bash
cd /opt/underworld-chat
cp .env.production.example .env.production
nano .env.production
```

At minimum review and adjust:

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

Important MinIO note:

- `MINIO_ROOT_PASSWORD` must be at least 8 characters long;
- `S3_ACCESS_KEY` must match `MINIO_ROOT_USER`;
- `S3_SECRET_KEY` must match `MINIO_ROOT_PASSWORD`.

### 3. Open the firewall port

If you use `ufw`:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw status
```

### 4. Start the project

```bash
cd /opt/underworld-chat
chmod +x scripts/*.sh
./scripts/deploy-prod.sh
```

### 5. Verify the stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=100 web backend ws worker
curl http://127.0.0.1/healthz/
curl http://185.68.244.224/healthz/
```

The app should then open at:

```text
http://185.68.244.224
```

## Updating the application

```bash
cd /opt/underworld-chat
git pull
chmod +x scripts/*.sh
./scripts/update-prod.sh
```

## Destroying the stack completely

If you want to fully free the server for another project:

```bash
cd /opt/underworld-chat
CONFIRM_DESTROY=underworld-chat ./scripts/destroy-prod.sh
```

This command will:

- stop the containers;
- remove PostgreSQL, Redis, and MinIO volumes;
- remove the compose project networks.

It does not delete the repository files themselves.

After that you can:

- remove the repository directory manually;
- clone a different project;
- deploy a new stack on the same server.

## What if port 80 is already occupied?

If something already listens on port `80`, you have two options:

1. stop the old project and free the port;
2. temporarily change `APP_HTTP_PORT` in `.env.production`, for example to `18080`, and open the service by `http://IP:18080`.

To check what is using port `80`:

```bash
sudo ss -ltnp | grep :80
docker ps
```

## Optional shared-host mode

If you later need to host multiple projects on the same server again, this repository can still be used in the old coexistence mode:

- `APP_HTTP_BIND=127.0.0.1`
- `APP_HTTP_PORT=18080`
- a host Nginx reverse proxy forwards traffic into Docker

Templates for that mode are still available in:

- `infra/deploy/nginx-site.example.conf`
- `infra/deploy/nginx-site.ip.example.conf`
- `infra/deploy/underworld-chat.service.example`
