#!/bin/bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ] && [ -f .env ]; then
  set -a
  # shellcheck source=/dev/null
  . ./.env
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL no está definido. Revisa tu archivo .env o variables de entorno." >&2
  exit 1
fi

echo "Esperando a que la base de datos esté lista..."
until pg_isready -d "$DATABASE_URL"; do
  sleep 2
done

echo "Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

echo "Insertando/actualizando el usuario administrador..."
node scripts/seed-admin.js

echo "Iniciando servidor de Next.js..."
npm run start
