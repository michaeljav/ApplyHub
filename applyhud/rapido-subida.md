# Subida rápida de ApplyHUD

Requisitos previos:
- Docker Desktop (o Docker Engine + Docker Compose v2) instalado y corriendo.
- Puerto `3000` libre para la aplicación y `5432` para la base de datos.

## Levantar todo con un solo comando

```bash
docker compose up --build -d
docker compose --env-file .env up --build -d
```

Eso construirá la imagen de Next.js, levantará Postgres con las credenciales solicitadas y ejecutará automáticamente:
- `prisma migrate deploy` para aplicar las migraciones.
- La inserción del usuario administrador (`admin@iad.gob.do`) usando el hash de contraseña provisto.
- Credenciales del admin por defecto: usuario `admin@iad.gob.do` y contraseña `Admin123*`.

## Ver estado y logs
- Ver logs en vivo: `docker compose logs -f app`
- Verificar Postgres: `docker compose logs -f postgres`

## Apagar
- Detener los servicios pero conservar los datos: `docker compose down`
- Detener y borrar volúmenes (incluye la data del admin): `docker compose down -v`

La aplicación quedará disponible en `http://localhost:3000` tan pronto los contenedores estén saludables.

## Usar solo la base de datos desde tu máquina

Si quieres correr Next.js local (`npm run dev`) pero reutilizar el Postgres del compose:

1. Levanta únicamente la base: `docker compose up -d postgres`
2. Verifica que el puerto `5432` esté libre en tu sistema (el compose lo expone al host).
3. Ejecuta `npm run dev`. El `.env` usa `localhost:5432`, así que Prisma hablará con ese contenedor automáticamente.
