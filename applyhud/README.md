# Selección IAD – Portal de Vacantes y Gestión de Postulaciones

Este proyecto es un portal completo para la **solicitud de documentos personales para selección y designación de profesionales y técnicos**, pensado para el Instituto Agrario Dominicano (IAD).

Incluye:

- Portal público de **vacantes**.
- Formulario de **postulación** con carga de documentos.
- Panel de **Recursos Humanos** (RRHH) para:
  - Ver vacantes.
  - Ver postulantes por vacante.
  - Ver detalle de cada postulante.
  - Descargar **PDF** y **ZIP** de expedientes.
- Autenticación con **Auth.js (NextAuth)** con **JWT + roles (ADMIN / RRHH)**.
- Persistencia con **PostgreSQL + Prisma**.
- Frontend en **Next.js (App Router) + Ant Design + React Query**.
- Archivos guardados en **carpeta local** configurada por `.env`.

---

## 1. Requisitos previos

- Node.js 18+
- PostgreSQL en ejecución
- npm (o pnpm / yarn si prefieres adaptarlo)
- Crear una base de datos vacía para este proyecto.

---

## 2. Instalación

1. Clonar o descomprimir este proyecto.

2. Instalar dependencias:

```bash
npm install
```

3. Crear el archivo `.env` en la raíz del proyecto con al menos:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/seleccion_iad"
UPLOAD_DIR="./uploads"
PERMITIR_MULTIPLES_VACANTES="false"
AUTH_SECRET="cambia-esto-por-un-string-seguro"
NEXTAUTH_SECRET="cambia-esto-por-un-string-seguro"
NEXTAUTH_URL="http://localhost:3000"
```

- `DATABASE_URL`: cadena de conexión a tu PostgreSQL.
- `UPLOAD_DIR`: carpeta donde se guardarán los archivos subidos.
- `PERMITIR_MULTIPLES_VACANTES`:
  - `"false"` → una cédula solo puede postularse a **una vacante total**.
  - `"true"` → puede postular a varias vacantes distintas (nunca dos veces a la misma).
- `AUTH_SECRET` / `NEXTAUTH_SECRET`: claves para la firma del JWT de Auth.js.
- `NEXTAUTH_URL`: URL base del proyecto.

4. Ejecutar migraciones de Prisma:

```bash
npm run prisma:migrate
```

5. Generar el cliente de Prisma (opcional si `migrate` ya lo ejecutó):

```bash
npm run prisma:generate
```

6. Crear al menos un usuario ADMIN y/o RRHH en la tabla `Usuario`.

Puedes hacerlo con un script de seed o manualmente (ejemplo en SQL):

```sql
INSERT INTO "Usuario" ("nombre", "email", "password", "rol", "activo")
VALUES (
  'Admin IAD',
  'admin@iad.gob.do',
  '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', -- hash bcrypt
  'ADMIN',
  true
);
```

> Genera el hash con bcrypt (ej. usando un pequeño script Node).

---

## 3. Ejecutar el proyecto

```bash
npm run dev
```

Abrir en el navegador:

- Portal público de vacantes: http://localhost:3000/vacantes
- Login RRHH/Admin: http://localhost:3000/login
- Panel de vacantes RRHH: http://localhost:3000/admin/vacantes

---

## 4. Flujo de uso

### 4.1. Portal público

- `/vacantes` muestra la lista de vacantes activas (según fechas y límite).
- `/vacantes/[id]` muestra el detalle de la vacante.
- `/vacantes/[id]/aplicar` permite que un postulante complete el formulario y suba documentos.

El backend valida:

- Fechas de la vacante.
- Límite de postulantes (si existe).
- Regla de negocio de cantidad de vacantes por cédula.
- Que no se repita la misma vacante para la misma cédula.

Los archivos se guardan en la carpeta `UPLOAD_DIR` con nombres únicos.

### 4.2. Panel de Recursos Humanos

- `/admin/vacantes`: vista de todas las vacantes con:
  - Título, fechas, límite, cantidad de postulantes, estado calculado.
  - Acción **“Ver postulantes”** para cada vacante.

- `/admin/vacantes/[id]/postulaciones`:
  - Lista de postulantes de esa vacante.
  - Ver nombre completo, cédula, correo, teléfono, fecha, estado interno.
  - Acción **“Ver detalle”**.
  - Botón para **descargar ZIP general** de la vacante (un folder por postulante).

- `/admin/postulaciones/[id]`:
  - Vista detallada del postulante:
    - Datos personales.
    - Vacante a la que aplicó.
    - Confirmaciones (es dominicano, no jubilado, aceptó términos).
    - Requisitos y beneficios de la vacante.
    - Lista de documentos subidos con enlaces de descarga.
    - Selector de **estado interno** (pendiente, revisado, completo, descartado).
  - Botones:
    - Descargar **PDF** del postulante.
    - Descargar **ZIP** del postulante (PDF + documentos).

### 4.3. Seguridad

- Autenticación con Auth.js (NextAuth) usando Credentials Provider (email + password).
- JWT con rol (`ADMIN` / `RRHH`).
- Middleware protege rutas `/admin/**` y `/api/admin/**`.
- Rutas de descarga de archivos `/api/files/[id]` están protegidas por backend (requieren sesión con rol).

---

## 5. Estructura principal de carpetas

- `src/app`
  - `page.tsx` → redirige a `/vacantes`.
  - `login/` → pantalla de login.
  - `vacantes/` → portal público de vacantes.
  - `admin/` → panel de RRHH.
  - `api/` → rutas de API (vacantes, postulaciones, auth, pdf, zip, archivos).
- `src/lib`
  - `prisma.ts` → cliente Prisma.
  - `auth.ts` → configuración Auth.js.
  - `upload.ts` → helper para guardar archivos.
  - `config.ts` → lectura de `PERMITIR_MULTIPLES_VACANTES`.
- `prisma/`
  - `schema.prisma` → modelos de datos.

---

## 6. Notas

- El proyecto está pensado para correr **sin Docker inicialmente**, solo con Node + PostgreSQL.
- Si en el futuro deseas contenedores, puedes agregar un `Dockerfile` y `docker-compose.yml` usando esta base.
- Puedes extender las validaciones (ej. formato de cédula dominicana) según tus necesidades.

---

## 7. Soporte

Si al montar el proyecto surge algún error de dependencias, ejecuta:

```bash
rm -rf node_modules package-lock.json
npm install
```

Y asegúrate de que tu versión de Node sea 18 o superior.
