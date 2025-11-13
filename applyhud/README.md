# Selección – Portal de Vacantes y Gestión de Postulaciones

Este proyecto es un portal completo para la **solicitud de documentos personales para selección y designación de profesionales y técnicos**.

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

# 🚀 0. Pasos Rápidos (TL;DR)

Si quieres poner el proyecto a funcionar rápido:

1. Descomprime el proyecto.
2. Crea `.env` en la raíz con:

   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/appyhub_db"
   UPLOAD_DIR="./uploads"
   PERMITIR_MULTIPLES_VACANTES="false"
   AUTH_SECRET="cambia-esto"
   NEXTAUTH_SECRET="cambia-esto"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. Instala dependencias:

   ```bash
   npm install
   ```

4. Crea carpeta de uploads:

   ```bash
   mkdir uploads
   ```

5. Ejecuta migraciones Prisma:

   ```bash
   npm run prisma:migrate
   ```

6. Crea un usuario ADMIN en la BD (con password **HASH** bcrypt).  
    Ejemplo SQL:

   ```sql
   INSERT INTO "Usuario" ("nombre", "email", "password", "rol", "activo", "createdAt", "updatedAt")
   VALUES (
   'Admin IAD',
   'admin@iad.gob.do',
   '$2a$10$yfKBtMfXPADmlGhUS6OaYu.7KR8jtGXTzI4lDcwBHfWCQGi0RklH6',
   'ADMIN',
   true,
   NOW(),NOW()
   );
   ```

7. Inicia el proyecto:

   ```bash
   npm run dev
   ```

8. Abre:

   - Portal público: http://localhost:3000/vacantes
   - Login RRHH/Admin: http://localhost:3000/login
   - Panel RRHH: http://localhost:3000/admin/vacantes

¡Listo!

---

# 1. Requisitos previos

- Node.js 18+
- PostgreSQL corriendo localmente
- Una base de datos creada para este proyecto
- npm (o el manejador que prefieras)

---

# 2. Instalación

1. Clonar o descomprimir este repositorio.

2. Instalar dependencias:

```bash
npm install
```

3. Crear el archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/seleccion_iad"
UPLOAD_DIR="./uploads"
PERMITIR_MULTIPLES_VACANTES="false"
AUTH_SECRET="cambia-esto-por-un-string-seguro"
NEXTAUTH_SECRET="cambia-esto-por-un-string-seguro"
NEXTAUTH_URL="http://localhost:3000"
```

### Detalles:

- `DATABASE_URL`: cadena de conexión PostgreSQL.
- `UPLOAD_DIR`: ruta donde se guardarán los archivos de los postulantes.
- `PERMITIR_MULTIPLES_VACANTES`:
  - `"false"` → una cédula solo puede postularse a una vacante total.
  - `"true"` → puede postularse a varias vacantes (nunca a la misma dos veces).
- `AUTH_SECRET` y `NEXTAUTH_SECRET`: claves para firmar JWTs.
- `NEXTAUTH_URL`: URL base del proyecto.

4. Ejecutar migraciones Prisma:

```bash
npm run prisma:migrate
```

5. Generar Prisma Client:

```bash
npm run prisma:generate
```

6. Crear un usuario ADMIN / RRHH en la tabla `Usuario`.

Ejemplo SQL (contraseña en hash bcrypt):

```sql
INSERT INTO "Usuario" ("nombre", "email", "password", "rol", "activo")
VALUES (
  'Admin IAD',
  'admin@iad.gob.do',
  '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'ADMIN',
  true
);
```

---

# 3. Ejecutar el proyecto

```bash
npm run dev
```

Abrir:

- Vacantes públicas: http://localhost:3000/vacantes
- Login RRHH: http://localhost:3000/login
- Panel RRHH: http://localhost:3000/admin/vacantes

---

# 4. Flujo de Uso

## 4.1. Portal Público

Rutas:

- `/vacantes` → lista de vacantes activas
- `/vacantes/[id]` → detalle de vacante
- `/vacantes/[id]/aplicar` → formulario de postulación

Validaciones backend:

- Fechas (inicio/fin)
- Límite de postulantes
- Regla global de una o múltiples vacantes
- No repetir la misma vacante por cédula

Archivos:

- Guardados en `UPLOAD_DIR`
- Con nombres únicos generados automáticamente

---

## 4.2. Panel de Recursos Humanos

### `/admin/vacantes`

- Título, fechas, límite, cantidad de postulantes
- Estado calculado (Próxima, Abierta, Cerrada, Límite alcanzado)
- Filtros y ordenamiento
- Botón **Ver postulantes**

### `/admin/vacantes/[id]/postulaciones`

- Lista de postulantes
- Nombre completo, cédula, email, teléfono, fecha
- Estado interno
- Búsquedas
- Filtros
- Exportar CSV/Excel
- Descargar **ZIP general** (PDF + documentos por postulante)

### `/admin/postulaciones/[id]`

- Datos del postulante
- Confirmaciones legales
- Información de la vacante
- Lista de documentos subidos con enlaces protegidos
- Cambiar estado interno
- Descargar PDF del postulante
- Descargar ZIP del postulante

---

## 4.3. Seguridad

- Autenticación implementada con **Auth.js (NextAuth)**:
  - Credentials Provider (email + password)
  - JWT firmado
  - Rol: `ADMIN` o `RRHH`
- Middleware protege:
  - `/admin/**`
  - `/api/**` que regresen datos sensibles
- Archivos protegidos: nunca se sirven desde el filesystem directamente.
  - Se usan endpoints seguros que requieren sesión y rol.

---

# 5. Estructura de Carpetas

```
src/
  app/
    login/
    vacantes/
    admin/
    api/
  lib/
    auth.ts
    prisma.ts
    upload.ts
    config.ts
prisma/
  schema.prisma
uploads/  (se crea al ejecutar el proyecto)
```

---

# 6. Notas

- El proyecto está preparado para correr **sin Docker por ahora**.
- Puedes agregar Docker cuando lo desees.
- Validaciones adicionales (ej. cédula dominicana) pueden añadirse fácilmente.

---

# 7. Troubleshooting

Si tienes errores:

```bash
rm -rf node_modules package-lock.json
npm install
```

Verifica tu versión de Node (mínimo 18+).

---

# 8 Crear vacantes usando Prisma Studio (GUI sobre la BD)

Como estamos usando Prisma, lo más limpio ahora mismo es usar su panel web para crear los primeros registros.

En la raíz del proyecto:

npx prisma studio

o si tienes script en package.json:

npm run prisma:studio

Eso te abre en el navegador algo como:

http://localhost:5555
