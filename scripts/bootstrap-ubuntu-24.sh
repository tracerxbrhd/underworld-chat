#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root: sudo bash scripts/bootstrap-ubuntu-24.sh"
  exit 1
fi

TARGET_USER="${SUDO_USER:-${USER:-root}}"

apt update
apt install -y ca-certificates curl gnupg git

install -m 0755 -d /etc/apt/keyrings

if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
fi

chmod a+r /etc/apt/keyrings/docker.gpg

cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "${UBUNTU_CODENAME}") stable
EOF

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

if id "$TARGET_USER" >/dev/null 2>&1; then
  usermod -aG docker "$TARGET_USER" || true
fi

cat <<EOF

Ubuntu 24 bootstrap completed.

Installed:
- git
- Docker Engine
- Docker Compose plugin
- Buildx plugin

Next steps:
1. Re-login as ${TARGET_USER} so docker group membership is applied.
2. Copy this repository to the server.
3. Copy .env.production.example to .env.production and adjust the values.
4. Run: chmod +x scripts/*.sh
5. Run: ./scripts/deploy-prod.sh

Optional firewall commands:
- sudo ufw allow OpenSSH
- sudo ufw allow 80/tcp
- sudo ufw allow 443/tcp

EOF
