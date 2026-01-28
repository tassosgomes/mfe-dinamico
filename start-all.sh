#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

echo "[start-all] Starting MFE RBAC POC..."

echo "[start-all] Starting Keycloak (Docker)..."
docker compose up -d keycloak

echo "[start-all] Waiting for Keycloak to be ready..."
until curl -sf http://localhost:8080/health/ready > /dev/null; do
  sleep 2
done

echo "[start-all] Keycloak ready."

echo "[start-all] Starting Backend API..."
(
  cd "$ROOT_DIR/backend"
  npm run dev
) &

sleep 1

echo "[start-all] Starting Host App..."
(
  cd "$ROOT_DIR/host"
  npm run dev
) &

echo "[start-all] Starting Remotes..."
(
  cd "$ROOT_DIR/admin-remote"
  npm run dev
) &

(
  cd "$ROOT_DIR/sales-remote"
  npm run dev
) &

(
  cd "$ROOT_DIR/user-remote"
  npm run dev
) &

echo ""
echo "[start-all] Services started."
echo ""
echo "URLs:"
echo "- Keycloak:     http://localhost:8080"
echo "- Backend API:  http://localhost:3001"
echo "- Host App:     http://localhost:5173"
echo "- Admin Remote: http://localhost:5174"
echo "- Sales Remote: http://localhost:5175"
echo "- User Remote:  http://localhost:5176"
echo ""
echo "Test users:"
echo "- ADMIN: ana@corp.com / admin123"
echo "- SALES: carlos@corp.com / sales123"
echo "- USER:  joao@corp.com / user123"
