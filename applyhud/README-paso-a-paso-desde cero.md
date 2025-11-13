
# Selección IAD – Guía paso a paso (desde cero)

Este documento te permite **crear el proyecto desde cero**, archivo por archivo, copiando y pegando el código.

La idea es:

1. Crear el proyecto base de Next.js.
2. Instalar dependencias.
3. Configurar Prisma y base de datos.
4. Crear helpers (`lib/`).
5. Crear páginas (`app/`) públicas y de RRHH.
6. Crear rutas de API (`app/api/`).
7. Configurar autenticación con Auth.js (NextAuth).
8. Probar que todo funcione.

> ⚠️ Todo el contenido está pensado para **Next.js 14 (App Router)** con **TypeScript**, **PostgreSQL** y **Node 18+**.

---

## 0. Prerrequisitos

- Node.js 18+ instalado
- PostgreSQL en ejecución
- Crear una base de datos vacía, por ejemplo: `seleccion_iad`
- Tener `npm` disponible

---

## 1. Crear proyecto base de Next.js

En la carpeta donde quieras crear el proyecto:

```bash
npx create-next-app@latest seleccion-iad
```

Responde:

- TypeScript: **Yes**
- App Router: **Yes**
- Tailwind: **No**
- ESLint: **Yes**
- Src directory: **Yes**
- Import alias: **@/**

Entra a la carpeta del proyecto:

```bash
cd seleccion-iad
```

---

## 2. Reemplazar/ajustar `package.json`

Abre `package.json` y reemplaza su contenido por este:

```json
{
  "name": "seleccion-iad",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@ant-design/icons": "^5.0.0",
    "@prisma/client": "^5.19.0",
    "@tanstack/react-query": "^5.51.0",
    "@tanstack/react-query-devtools": "^5.51.0",
    "adm-zip": "^0.5.12",
    "antd": "^5.20.0",
    "bcryptjs": "^2.4.3",
    "next": "14.2.4",
    "next-auth": "^5.0.0",
    "pdfkit": "^0.15.0",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.2",
    "@types/node": "20.11.30",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "14.2.4",
    "prisma": "^5.19.0",
    "typescript": "5.5.4"
  }
}
```

Luego ejecuta:

```bash
npm install
```

---

## 3. Configurar `next.config.mjs`

Edita `next.config.mjs` en la raíz:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  }
};

export default nextConfig;
```

---

## 4. Configurar TypeScript (`tsconfig.json`)

Reemplaza el contenido de `tsconfig.json` por:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["next-auth"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

En `next-env.d.ts` agrega (si no existe la parte de pdfkit):

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module "pdfkit";
```

---

## 5. Crear `.gitignore`

En la raíz, crea **`.gitignore`**:

```gitignore
node_modules/
dist/
build/
.next/
out/
.tmp/
temp/
tmp/
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

.env
.env.local
.env.development
.env.production
.env.test

prisma/dev.db
prisma/dev.db-journal
prisma/*.sqlite
prisma/*.db
prisma/migrations/

uploads/
uploads/*

.vercel/
.vscode/
.idea/
*.swp
Thumbs.db
```

---

## 6. Crear `.env` (o `.env.local`)

En la raíz del proyecto, crea `.env`:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/seleccion_iad"
UPLOAD_DIR="./uploads"
PERMITIR_MULTIPLES_VACANTES="false"

AUTH_SECRET="cambia-esto-por-un-string-largo-y-seguro"
NEXTAUTH_SECRET="cambia-esto-por-un-string-largo-y-seguro"
NEXTAUTH_URL="http://localhost:3000"
```

Crea la carpeta de uploads:

```bash
mkdir uploads
```

---

## 7. Configurar Prisma

### 7.1. Inicializar Prisma

```bash
npx prisma init
```

Esto creará `prisma/schema.prisma`. Reemplázalo por:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Vacante {
  id                   Int                  @id @default(autoincrement())
  titulo               String
  requisitos           String
  beneficios           String
  fechaInicio          DateTime
  fechaFin             DateTime
  limitePostulantes    Int?
  documentosRequeridos VacanteDocumento[]
  postulaciones        Postulacion[]
  createdAt            DateTime             @default(now())
}

model VacanteDocumento {
  id            Int      @id @default(autoincrement())
  vacanteId     Int
  nombre        String
  descripcion   String?
  obligatorio   Boolean
  extensiones   String[]
  tamanoMaxMB   Int?
  orden         Int

  vacante       Vacante @relation(fields: [vacanteId], references: [id])
}

model Postulacion {
  id              Int                 @id @default(autoincrement())
  vacanteId       Int
  nombres         String
  apellidos       String
  cedula          String
  email           String
  telefono        String
  esDominicano    Boolean
  noJubilado      Boolean
  aceptoTerminos  Boolean
  fecha           DateTime            @default(now())
  estadoInterno   String              @default("pendiente")
  archivos        PostulacionArchivo[]
  vacante         Vacante             @relation(fields: [vacanteId], references: [id])

  @@unique([vacanteId, cedula])
}

model PostulacionArchivo {
  id              Int      @id @default(autoincrement())
  postulacionId   Int
  nombreLogico    String
  nombreFinal     String
  ruta            String
  createdAt       DateTime @default(now())

  postulacion     Postulacion @relation(fields: [postulacionId], references: [id])
}

model Usuario {
  id        Int      @id @default(autoincrement())
  nombre    String
  email     String   @unique
  password  String
  rol       String
  activo    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 7.2. Ejecutar migraciones

```bash
npm run prisma:migrate
```

(Te pedirá un nombre para la migración, por ejemplo: `init`)

---

## 8. Crear helpers en `src/lib`

Crea la carpeta `src/lib`.

### 8.1. `src/lib/prisma.ts`

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### 8.2. `src/lib/config.ts`

```ts
export function permitirMultiplesVacantes(): boolean {
  return process.env.PERMITIR_MULTIPLES_VACANTES === 'true';
}
```

### 8.3. `src/lib/upload.ts`

```ts
import fs from 'fs';
import path from 'path';

export async function guardarArchivoLocal(
  file: File,
  nombreLogico: string,
  vacanteId: number,
  postulacionId: number
) {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const timestamp = Date.now();
  const safeOriginal = file.name.replace(/\\s+/g, '-');
  const nombreFinal = `vac-${vacanteId}_post-${postulacionId}_${timestamp}_${nombreLogico}_${safeOriginal}`;
  const filePath = path.join(uploadDir, nombreFinal);

  await fs.promises.writeFile(filePath, buffer);

  return { nombreFinal, ruta: filePath };
}
```

### 8.4. `src/lib/auth.ts` (Auth.js / NextAuth)

```ts
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email }
        });
        if (!user || !user.activo) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;
        return {
          id: String(user.id),
          name: user.nombre,
          email: user.email,
          rol: user.rol
        } as any;
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = (user as any).rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).rol = token.rol;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  }
};
```

---

## 9. Configurar NextAuth API

Crea la carpeta: `src/app/api/auth/[...nextauth]/`

### 9.1. `src/app/api/auth/[...nextauth]/route.ts`

```ts
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
```

---

## 10. Configurar middleware de seguridad

En la raíz, crea `middleware.ts`:

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const protectedPrefixes = ['/admin', '/api/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const rol = (token as any).rol;
  if (rol !== 'ADMIN' && rol !== 'RRHH') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
```

---

## 11. Provider global (React Query + Session)

Crea `src/app/Providers.tsx`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

---

## 12. Layout y estilos globales

### 12.1. `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import Providers from './Providers';
import 'antd/dist/reset.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Selección IAD',
  description: 'Portal de selección y designación de profesionales y técnicos'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 12.2. `src/app/globals.css`

```css
html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### 12.3. `src/app/page.tsx`

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/vacantes');
}
```

---

## 13. Página de login (`/login`)

Crea `src/app/login/page.tsx`:

```tsx
'use client';

import { Button, Card, Form, Input, Typography, Alert } from 'antd';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const onFinish = async (values: any) => {
    setLoading(true);
    setError(null);
    const callbackUrl = searchParams.get('callbackUrl') || '/admin/vacantes';
    const res = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
      callbackUrl
    });
    setLoading(false);
    if (res?.error) {
      setError('Credenciales inválidas');
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card title="Acceso Recursos Humanos" style={{ width: 400 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Correo" name="email" rules={[{ required: true, message: 'Ingrese su correo' }]}>
            <Input type="email" />
          </Form.Item>
          <Form.Item label="Contraseña" name="password" rules={[{ required: true, message: 'Ingrese su contraseña' }]}>
            <Input.Password />
          </Form.Item>
          {error && (
            <Alert type="error" message={error} style={{ marginBottom: 16 }} />
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Iniciar sesión
            </Button>
          </Form.Item>
        </Form>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
          Solo usuarios autorizados del IAD.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
```

---

## 14. Páginas públicas de vacantes

### 14.1. Listado de vacantes: `src/app/vacantes/page.tsx`

```tsx
import { Vacante } from '@prisma/client';
import { Table, Tag } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';

interface VacanteWithCount extends Vacante {
  _count: { postulaciones: number };
}

async function getVacantes(): Promise<VacanteWithCount[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/vacantes`, {
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Error cargando vacantes');
  return res.json();
}

function calcularEstado(v: VacanteWithCount): string {
  const hoy = dayjs();
  const inicio = dayjs(v.fechaInicio);
  const fin = dayjs(v.fechaFin);
  if (inicio.isAfter(hoy, 'day')) return 'Próxima';
  if (fin.isBefore(hoy, 'day')) return 'Cerrada';
  if (v.limitePostulantes && v._count.postulaciones >= v.limitePostulantes) return 'Límite alcanzado';
  return 'Abierta';
}

export default async function VacantesPage() {
  const vacantes = await getVacantes();

  const columns = [
    {
      title: 'Vacante',
      dataIndex: 'titulo',
      key: 'titulo',
      render: (text: string, record: VacanteWithCount) => (
        <Link href={`/vacantes/${record.id}`}>{text}</Link>
      )
    },
    {
      title: 'Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      render: (value: string) => dayjs(value).format('DD/MM/YYYY')
    },
    {
      title: 'Fin',
      dataIndex: 'fechaFin',
      key: 'fechaFin',
      render: (value: string) => dayjs(value).format('DD/MM/YYYY')
    },
    {
      title: 'Postulantes',
      key: 'postulantes',
      render: (_: any, record: VacanteWithCount) => record._count.postulaciones
    },
    {
      title: 'Estado',
      key: 'estado',
      render: (_: any, record: VacanteWithCount) => {
        const estado = calcularEstado(record);
        const color =
          estado === 'Abierta'
            ? 'green'
            : estado === 'Próxima'
            ? 'blue'
            : estado === 'Límite alcanzado'
            ? 'orange'
            : 'red';
        return <Tag color={color}>{estado}</Tag>;
      }
    }
  ];

  return (
    <main style={{ padding: 24 }}>
      <h1>Vacantes disponibles</h1>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={vacantes}
        pagination={false}
        style={{ marginTop: 16 }}
      />
    </main>
  );
}
```

### 14.2. Detalle de vacante: `src/app/vacantes/[id]/page.tsx`

```tsx
import { Vacante, VacanteDocumento } from '@prisma/client';
import dayjs from 'dayjs';
import Link from 'next/link';

interface VacanteDetalle extends Vacante {
  documentosRequeridos: VacanteDocumento[];
  _count: { postulaciones: number };
}

async function getVacante(id: string): Promise<VacanteDetalle> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/vacantes/${id}`, {
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Error cargando vacante');
  return res.json();
}

export default async function VacantePage({ params }: { params: { id: string } }) {
  const vacante = await getVacante(params.id);
  const hoy = dayjs();
  const inicio = dayjs(vacante.fechaInicio);
  const fin = dayjs(vacante.fechaFin);
  const dentroDeFechas = !inicio.isAfter(hoy, 'day') && !fin.isBefore(hoy, 'day');
  const limiteAlcanzado =
    vacante.limitePostulantes != null &&
    vacante._count.postulaciones >= vacante.limitePostulantes;

  const puedeAplicar = dentroDeFechas && !limiteAlcanzado;

  return (
    <main style={{ padding: 24 }}>
      <h1>{vacante.titulo}</h1>
      <p>
        Publicación: {inicio.format('DD/MM/YYYY')} - {fin.format('DD/MM/YYYY')}
      </p>
      {vacante.limitePostulantes && (
        <p>
          Límite de postulantes: {vacante._count.postulaciones}/
          {vacante.limitePostulantes}
        </p>
      )}
      <h2>Requisitos mínimos</h2>
      <p style={{ whiteSpace: 'pre-line' }}>{vacante.requisitos}</p>
      <h2>Beneficios</h2>
      <p style={{ whiteSpace: 'pre-line' }}>{vacante.beneficios}</p>
      <h2>Documentos requeridos</h2>
      <ul>
        {vacante.documentosRequeridos
          .sort((a, b) => a.orden - b.orden)
          .map((doc) => (
            <li key={doc.id}>
              <strong>{doc.nombre}</strong>
              {doc.obligatorio ? ' (Obligatorio)' : ' (Opcional)'}
              {doc.descripcion && <> – {doc.descripcion}</>}
            </li>
          ))}
      </ul>

      {puedeAplicar ? (
        <Link href={`/vacantes/${vacante.id}/aplicar`}>
          Aplicar a esta vacante
        </Link>
      ) : (
        <p style={{ color: 'red', marginTop: 16 }}>
          Esta vacante no está disponible para nuevas postulaciones.
        </p>
      )}
    </main>
  );
}
```

### 14.3. Formulario de postulación: `src/app/vacantes/[id]/aplicar/page.tsx`

```tsx
'use client';

import { Form, Input, Checkbox, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface VacanteDocumento {
  id: number;
  nombre: string;
  descripcion: string | null;
  obligatorio: boolean;
  orden: number;
}

interface VacanteDetalle {
  id: number;
  titulo: string;
  documentosRequeridos: VacanteDocumento[];
}

export default function AplicarPage({ params }: { params: { id: string } }) {
  const [vacante, setVacante] = useState<VacanteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/vacantes/${params.id}`)
      .then((r) => r.json())
      .then((data) => setVacante(data))
      .finally(() => setLoading(false));
  }, [params.id]);

  const onFinish = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append('vacanteId', params.id);
      formData.append('nombres', values.nombres);
      formData.append('apellidos', values.apellidos);
      formData.append('cedula', values.cedula);
      formData.append('email', values.email);
      formData.append('telefono', values.telefono);
      formData.append('esDominicano', values.esDominicano ? 'true' : 'false');
      formData.append('noJubilado', values.noJubilado ? 'true' : 'false');
      formData.append('aceptoTerminos', values.aceptoTerminos ? 'true' : 'false');

      (vacante?.documentosRequeridos || []).forEach((doc) => {
        const field = values[`doc_${doc.id}`];
        if (field && field.file) {
          formData.append(`doc_${doc.id}`, field.file.originFileObj);
          formData.append(`doc_${doc.id}_nombreLogico`, doc.nombre);
        }
      });

      const res = await fetch('/api/postulaciones', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Error al enviar la postulación');
      }

      message.success('Postulación enviada correctamente');
      router.push('/vacantes');
    } catch (e: any) {
      message.error(e.message);
    }
  };

  if (loading || !vacante) return <main style={{ padding: 24 }}>Cargando...</main>;

  return (
    <main style={{ padding: 24, maxWidth: 700 }}>
      <h1>Aplicar a: {vacante.titulo}</h1>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Nombres" name="nombres" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Apellidos" name="apellidos" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Cédula" name="cedula" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Correo electrónico" name="email" rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Teléfono" name="telefono" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="esDominicano" valuePropName="checked" rules={[{ validator:(_, v)=> v ? Promise.resolve() : Promise.reject('Debe confirmar que es dominicano') }]}>
          <Checkbox>Soy dominicano</Checkbox>
        </Form.Item>
        <Form.Item name="noJubilado" valuePropName="checked" rules={[{ validator:(_, v)=> v ? Promise.resolve() : Promise.reject('Debe confirmar que no es jubilado/pensionado') }]}>
          <Checkbox>No soy jubilado ni pensionado del Estado</Checkbox>
        </Form.Item>
        <Form.Item name="aceptoTerminos" valuePropName="checked" rules={[{ validator:(_, v)=> v ? Promise.resolve() : Promise.reject('Debe aceptar los términos') }]}>
          <Checkbox>Acepto los términos y condiciones del proceso</Checkbox>
        </Form.Item>

        <h3>Documentos</h3>
        {vacante.documentosRequeridos
          .sort((a, b) => a.orden - b.orden)
          .map((doc) => (
            <Form.Item
              key={doc.id}
              label={`${doc.nombre} ${doc.obligatorio ? '(Obligatorio)' : '(Opcional)'}`}
              name={`doc_${doc.id}`}
              rules={doc.obligatorio ? [{ required: true, message: 'Este documento es obligatorio' }] : []}
            >
              <Upload beforeUpload={() => false} maxCount={1}>
                <Button icon={<UploadOutlined />}>Seleccionar archivo</Button>
              </Upload>
            </Form.Item>
          ))}

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Enviar postulación
          </Button>
        </Form.Item>
      </Form>
    </main>
  );
}
```

---

## 15. Rutas de API para vacantes y postulaciones

### 15.1. `GET /api/vacantes`

Crea `src/app/api/vacantes/route.ts`:

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const vacantes = await prisma.vacante.findMany({
    include: {
      _count: { select: { postulaciones: true } }
    },
    orderBy: { fechaInicio: 'asc' }
  });
  return NextResponse.json(vacantes);
}
```

### 15.2. `GET /api/vacantes/admin` (RRHH)

Crea `src/app/api/vacantes/admin/route.ts`:

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const vacantes = await prisma.vacante.findMany({
    include: {
      _count: { select: { postulaciones: true } }
    },
    orderBy: { fechaInicio: 'asc' }
  });
  return NextResponse.json(vacantes);
}
```

### 15.3. `GET /api/vacantes/[id]`

Crea carpeta `src/app/api/vacantes/[id]/` y dentro `route.ts`:

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const id = Number(params.id);
  const vacante = await prisma.vacante.findUnique({
    where: { id },
    include: {
      documentosRequeridos: true,
      _count: { select: { postulaciones: true } }
    }
  });
  if (!vacante) {
    return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 });
  }
  return NextResponse.json(vacante);
}
```

### 15.4. `GET /api/vacantes/[id]/postulaciones`

Crea carpeta `src/app/api/vacantes/[id]/postulaciones/` con `route.ts`:

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const id = Number(params.id);
  const postulaciones = await prisma.postulacion.findMany({
    where: { vacanteId: id },
    orderBy: { fecha: 'asc' }
  });
  return NextResponse.json(postulaciones);
}
```

### 15.5. `POST /api/postulaciones`

Crea `src/app/api/postulaciones/route.ts`:

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';
import { permitirMultiplesVacantes } from '@/lib/config';
import { guardarArchivoLocal } from '@/lib/upload';

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const vacanteId = Number(form.get('vacanteId'));
    const nombres = String(form.get('nombres') || '');
    const apellidos = String(form.get('apellidos') || '');
    const cedula = String(form.get('cedula') || '');
    const email = String(form.get('email') || '');
    const telefono = String(form.get('telefono') || '');
    const esDominicano = form.get('esDominicano') === 'true';
    const noJubilado = form.get('noJubilado') === 'true';
    const aceptoTerminos = form.get('aceptoTerminos') === 'true';

    if (!vacanteId || !nombres || !apellidos || !cedula || !email || !telefono) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const vacante = await prisma.vacante.findUnique({
      where: { id: vacanteId },
      include: { documentosRequeridos: true, _count: { select: { postulaciones: true } } }
    });
    if (!vacante) {
      return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 });
    }

    const hoy = dayjs();
    const inicio = dayjs(vacante.fechaInicio);
    const fin = dayjs(vacante.fechaFin);
    if (inicio.isAfter(hoy, 'day') || fin.isBefore(hoy, 'day')) {
      return NextResponse.json({ error: 'La vacante no está disponible' }, { status: 400 });
    }

    if (
      vacante.limitePostulantes != null &&
      vacante._count.postulaciones >= vacante.limitePostulantes
    ) {
      return NextResponse.json({ error: 'Se alcanzó el límite de postulantes' }, { status: 400 });
    }

    if (!permitirMultiplesVacantes()) {
      const yaPostulo = await prisma.postulacion.findFirst({
        where: { cedula }
      });
      if (yaPostulo) {
        return NextResponse.json(
          { error: 'Ya existe una postulación con esta cédula. Solo se permite una vacante.' },
          { status: 400 }
        );
      }
    }

    const existenteMismaVacante = await prisma.postulacion.findUnique({
      where: { vacanteId_cedula: { vacanteId, cedula } }
    });
    if (existenteMismaVacante) {
      return NextResponse.json(
        { error: 'Ya existe una postulación para esta vacante con esta cédula.' },
        { status: 400 }
      );
    }

    const postulacion = await prisma.postulacion.create({
      data: {
        vacanteId,
        nombres,
        apellidos,
        cedula,
        email,
        telefono,
        esDominicano,
        noJubilado,
        aceptoTerminos
      }
    });

    const docs = vacante.documentosRequeridos;
    for (const doc of docs) {
      const fieldName = `doc_${doc.id}`;
      const archivo = form.get(fieldName) as File | null;
      if (doc.obligatorio && !archivo) {
        return NextResponse.json(
          { error: `Falta documento obligatorio: ${doc.nombre}` },
          { status: 400 }
        );
      }
      if (archivo) {
        const { nombreFinal, ruta } = await guardarArchivoLocal(
          archivo,
          doc.nombre.replace(/\\s+/g, '-').toLowerCase(),
          vacanteId,
          postulacion.id
        );
        await prisma.postulacionArchivo.create({
          data: {
            postulacionId: postulacion.id,
            nombreLogico: doc.nombre,
            nombreFinal,
            ruta
          }
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Error procesando la postulación' }, { status: 500 });
  }
}
```

---

## 16. Vistas de RRHH (Admin)

### 16.1. Lista de vacantes para RRHH: `src/app/admin/vacantes/page.tsx`

```tsx
'use client';

import { Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Link from 'next/link';

interface Vacante {
  id: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  limitePostulantes: number | null;
  _count: { postulaciones: number };
}

function calcularEstado(v: Vacante): string {
  const hoy = dayjs();
  const inicio = dayjs(v.fechaInicio);
  const fin = dayjs(v.fechaFin);
  if (inicio.isAfter(hoy, 'day')) return 'Próxima';
  if (fin.isBefore(hoy, 'day')) return 'Cerrada';
  if (v.limitePostulantes && v._count.postulaciones >= v.limitePostulantes) return 'Límite alcanzado';
  return 'Abierta';
}

export default function AdminVacantesPage() {
  const { data, isLoading } = useQuery<Vacante[]>({
    queryKey: ['admin-vacantes'],
    queryFn: async () => {
      const res = await fetch('/api/vacantes/admin');
      if (!res.ok) throw new Error('Error cargando vacantes');
      return res.json();
    }
  });

  const columns = [
    {
      title: 'Vacante',
      dataIndex: 'titulo',
      key: 'titulo'
    },
    {
      title: 'Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Fin',
      dataIndex: 'fechaFin',
      key: 'fechaFin',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Límite',
      dataIndex: 'limitePostulantes',
      key: 'limitePostulantes'
    },
    {
      title: 'Postulantes',
      key: 'postulantes',
      render: (_: any, record: Vacante) => record._count.postulaciones
    },
    {
      title: 'Estado',
      key: 'estado',
      render: (_: any, record: Vacante) => {
        const estado = calcularEstado(record);
        const color =
          estado === 'Abierta'
            ? 'green'
            : estado === 'Próxima'
            ? 'blue'
            : estado === 'Límite alcanzado'
            ? 'orange'
            : 'red';
        return <Tag color={color}>{estado}</Tag>;
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: any, record: Vacante) => (
        <Link href={`/admin/vacantes/${record.id}/postulaciones`}>Ver postulantes</Link>
      )
    }
  ];

  return (
    <main style={{ padding: 24 }}>
      <h1>Vacantes (Recursos Humanos)</h1>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data || []}
        columns={columns}
      />
    </main>
  );
}
```

### 16.2. Postulantes por vacante: `src/app/admin/vacantes/[id]/postulaciones/page.tsx`

```tsx
'use client';

import { Table, Button } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Postulacion {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  telefono: string;
  fecha: string;
  estadoInterno: string;
}

export default function PostulantesPorVacantePage() {
  const params = useParams<{ id: string }>();
  const vacanteId = params.id;

  const { data, isLoading } = useQuery<Postulacion[]>({
    queryKey: ['postulaciones', vacanteId],
    queryFn: async () => {
      const res = await fetch(`/api/vacantes/${vacanteId}/postulaciones`);
      if (!res.ok) throw new Error('Error cargando postulaciones');
      return res.json();
    }
  });

  const columns = [
    {
      title: 'Nombre completo',
      key: 'nombre',
      render: (_: any, r: Postulacion) => `${r.nombres} ${r.apellidos}`
    },
    {
      title: 'Cédula',
      dataIndex: 'cedula',
      key: 'cedula'
    },
    {
      title: 'Correo',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono'
    },
    {
      title: 'Fecha postulación',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Estado interno',
      dataIndex: 'estadoInterno',
      key: 'estadoInterno'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: any, r: Postulacion) => (
        <Link href={`/admin/postulaciones/${r.id}`}>Ver detalle</Link>
      )
    }
  ];

  const descargarZip = () => {
    window.location.href = `/api/vacantes/${vacanteId}/zip`;
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Postulantes</h1>
      <Button onClick={descargarZip} style={{ marginBottom: 16 }}>
        Descargar ZIP general
      </Button>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data || []}
        columns={columns}
      />
    </main>
  );
}
```

### 16.3. Detalle del postulante: `src/app/admin/postulaciones/[id]/page.tsx`

```tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Descriptions, Select, Button, List } from 'antd';

interface PostulacionArchivo {
  id: number;
  nombreLogico: string;
  nombreFinal: string;
}

interface Vacante {
  titulo: string;
  requisitos: string;
  beneficios: string;
}

interface PostulacionDetalle {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  telefono: string;
  fecha: string;
  esDominicano: boolean;
  noJubilado: boolean;
  aceptoTerminos: boolean;
  estadoInterno: string;
  vacante: Vacante;
  archivos: PostulacionArchivo[];
}

export default function PostulacionDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PostulacionDetalle>({
    queryKey: ['postulacion', id],
    queryFn: async () => {
      const res = await fetch(`/api/postulaciones/${id}`);
      if (!res.ok) throw new Error('Error cargando postulación');
      return res.json();
    }
  });

  const mutation = useMutation({
    mutationFn: async (estadoInterno: string) => {
      const res = await fetch(`/api/postulaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoInterno })
      });
      if (!res.ok) throw new Error('Error actualizando estado');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['postulacion', id] });
    }
  });

  const descargarPDF = () => {
    window.location.href = `/api/postulaciones/${id}/pdf`;
  };

  const descargarZIP = () => {
    window.location.href = `/api/postulaciones/${id}/zip`;
  };

  if (isLoading || !data) return <main style={{ padding: 24 }}>Cargando...</main>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Detalle del postulante</h1>
      <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Vacante">{data.vacante.titulo}</Descriptions.Item>
        <Descriptions.Item label="Nombre completo">
          {data.nombres} {data.apellidos}
        </Descriptions.Item>
        <Descriptions.Item label="Cédula">{data.cedula}</Descriptions.Item>
        <Descriptions.Item label="Correo">{data.email}</Descriptions.Item>
        <Descriptions.Item label="Teléfono">{data.telefono}</Descriptions.Item>
        <Descriptions.Item label="Fecha postulación">{new Date(data.fecha).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="Es dominicano">
          {data.esDominicano ? 'Sí' : 'No'}
        </Descriptions.Item>
        <Descriptions.Item label="No jubilado/pensionado">
          {data.noJubilado ? 'Sí' : 'No'}
        </Descriptions.Item>
        <Descriptions.Item label="Aceptó términos">
          {data.aceptoTerminos ? 'Sí' : 'No'}
        </Descriptions.Item>
        <Descriptions.Item label="Requisitos mínimos">
          <pre style={{ whiteSpace: 'pre-wrap' }}>{data.vacante.requisitos}</pre>
        </Descriptions.Item>
        <Descriptions.Item label="Beneficios">
          <pre style={{ whiteSpace: 'pre-wrap' }}>{data.vacante.beneficios}</pre>
        </Descriptions.Item>
        <Descriptions.Item label="Estado interno">
          <Select
            value={data.estadoInterno}
            onChange={(value) => mutation.mutate(value)}
            options={[
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'revisado', label: 'Revisado' },
              { value: 'completo', label: 'Completo' },
              { value: 'descartado', label: 'Descartado' }
            ]}
          />
        </Descriptions.Item>
      </Descriptions>

      <h2>Documentos</h2>
      <List
        dataSource={data.archivos}
        renderItem={(item) => (
          <List.Item
            actions={[
              <a key="descargar" href={`/api/files/${item.id}`}>
                Descargar
              </a>
            ]}
          >
            <List.Item.Meta
              title={item.nombreLogico}
              description={item.nombreFinal}
            />
          </List.Item>
        )}
      />

      <div style={{ marginTop: 24 }}>
        <Button onClick={descargarPDF} style={{ marginRight: 8 }}>
          Descargar PDF
        </Button>
        <Button onClick={descargarZIP}>Descargar ZIP</Button>
      </div>
    </main>
  );
}
```

---

## 17. Rutas de API para detalle/postulación, PDF, ZIP y archivos

### 17.1. `src/app/api/postulaciones/[id]/route.ts`

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const id = Number(params.id);
  const postulacion = await prisma.postulacion.findUnique({
    where: { id },
    include: { vacante: true, archivos: true }
  });
  if (!postulacion) {
    return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 });
  }
  return NextResponse.json(postulacion);
}

export async function PATCH(req: Request, { params }: Params) {
  const id = Number(params.id);
  const body = await req.json();
  const { estadoInterno } = body;
  const updated = await prisma.postulacion.update({
    where: { id },
    data: { estadoInterno }
  });
  return NextResponse.json(updated);
}
```

### 17.2. `src/app/api/postulaciones/[id]/pdf/route.ts`

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const id = Number(params.id);
  const postulacion = await prisma.postulacion.findUnique({
    where: { id },
    include: { vacante: true, archivos: true }
  });
  if (!postulacion) {
    return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 });
  }

  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk as Buffer));
  const endPromise = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(16).text('Expediente de Postulación', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Vacante: ${postulacion.vacante.titulo}`);
  doc.text(`Nombre: ${postulacion.nombres} ${postulacion.apellidos}`);
  doc.text(`Cédula: ${postulacion.cedula}`);
  doc.text(`Correo: ${postulacion.email}`);
  doc.text(`Teléfono: ${postulacion.telefono}`);
  doc.text(`Fecha: ${postulacion.fecha.toISOString()}`);
  doc.moveDown();
  doc.text(`Es dominicano: ${postulacion.esDominicano ? 'Sí' : 'No'}`);
  doc.text(`No jubilado/pensionado: ${postulacion.noJubilado ? 'Sí' : 'No'}`);
  doc.text(`Aceptó términos: ${postulacion.aceptoTerminos ? 'Sí' : 'No'}`);
  doc.moveDown();
  doc.text('Documentos:');
  postulacion.archivos.forEach((a) => {
    doc.text(`- ${a.nombreLogico}: ${a.nombreFinal}`);
  });

  doc.end();
  const pdfBuffer = await endPromise;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="postulacion-${id}.pdf"`
    }
  });
}
```

### 17.3. `src/app/api/postulaciones/[id]/zip/route.ts`

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const id = Number(params.id);
  const postulacion = await prisma.postulacion.findUnique({
    where: { id },
    include: { vacante: true, archivos: true }
  });
  if (!postulacion) {
    return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 });
  }

  const zip = new AdmZip();

  const pdfDoc = new PDFDocument();
  const chunks: Buffer[] = [];
  pdfDoc.on('data', (chunk) => chunks.push(chunk as Buffer));
  const endPromise = new Promise<Buffer>((resolve) => {
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  pdfDoc.fontSize(16).text('Expediente de Postulación', { underline: true });
  pdfDoc.moveDown();
  pdfDoc.fontSize(12).text(`Vacante: ${postulacion.vacante.titulo}`);
  pdfDoc.text(`Nombre: ${postulacion.nombres} ${postulacion.apellidos}`);
  pdfDoc.text(`Cédula: ${postulacion.cedula}`);
  pdfDoc.text(`Correo: ${postulacion.email}`);
  pdfDoc.text(`Teléfono: ${postulacion.telefono}`);
  pdfDoc.text(`Fecha: ${postulacion.fecha.toISOString()}`);
  pdfDoc.moveDown();
  pdfDoc.text(`Es dominicano: ${postulacion.esDominicano ? 'Sí' : 'No'}`);
  pdfDoc.text(`No jubilado/pensionado: ${postulacion.noJubilado ? 'Sí' : 'No'}`);
  pdfDoc.text(`Aceptó términos: ${postulacion.aceptoTerminos ? 'Sí' : 'No'}`);
  pdfDoc.moveDown();
  pdfDoc.text('Documentos:');
  postulacion.archivos.forEach((a) => {
    pdfDoc.text(`- ${a.nombreLogico}: ${a.nombreFinal}`);
  });

  pdfDoc.end();
  const pdfBuffer = await endPromise;
  zip.addFile(`postulante.pdf`, pdfBuffer);

  const docsFolder = 'documentos/';
  for (const archivo of postulacion.archivos) {
    if (fs.existsSync(archivo.ruta)) {
      const fileBuffer = fs.readFileSync(archivo.ruta);
      const name = path.join(docsFolder, archivo.nombreFinal);
      zip.addFile(name, fileBuffer);
    }
  }

  const zipBuffer = zip.toBuffer();

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="postulacion-${id}.zip"`
    }
  });
}
```

### 17.4. ZIP general por vacante: `src/app/api/vacantes/[id]/zip/route.ts`

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const id = Number(params.id);
  const vacante = await prisma.vacante.findUnique({
    where: { id },
    include: { postulaciones: { include: { archivos: true } } }
  });
  if (!vacante) {
    return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 });
  }

  const zip = new AdmZip();

  for (const post of vacante.postulaciones) {
    const folder = `postulacion-${post.id}/`;

    const pdfDoc = new PDFDocument();
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk as Buffer));
    const endPromise = new Promise<Buffer>((resolve) => {
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    pdfDoc.fontSize(16).text('Expediente de Postulación', { underline: true });
    pdfDoc.moveDown();
    pdfDoc.fontSize(12).text(`Vacante: ${vacante.titulo}`);
    pdfDoc.text(`Nombre: ${post.nombres} ${post.apellidos}`);
    pdfDoc.text(`Cédula: ${post.cedula}`);
    pdfDoc.text(`Correo: ${post.email}`);
    pdfDoc.text(`Teléfono: ${post.telefono}`);
    pdfDoc.text(`Fecha: ${post.fecha.toISOString()}`);
    pdfDoc.moveDown();
    pdfDoc.text(`Es dominicano: ${post.esDominicano ? 'Sí' : 'No'}`);
    pdfDoc.text(`No jubilado/pensionado: ${post.noJubilado ? 'Sí' : 'No'}`);
    pdfDoc.text(`Aceptó términos: ${post.aceptoTerminos ? 'Sí' : 'No'}`);
    pdfDoc.moveDown();
    pdfDoc.text('Documentos:');
    post.archivos.forEach((a) => {
      pdfDoc.text(`- ${a.nombreLogico}: ${a.nombreFinal}`);
    });

    pdfDoc.end();
    const pdfBuffer = await endPromise;
    zip.addFile(path.join(folder, `postulante.pdf`), pdfBuffer);

    for (const archivo of post.archivos) {
      if (fs.existsSync(archivo.ruta)) {
        const fileBuffer = fs.readFileSync(archivo.ruta);
        const name = path.join(folder, 'documentos', archivo.nombreFinal);
        zip.addFile(name, fileBuffer);
      }
    }
  }

  const zipBuffer = zip.toBuffer();

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="vacante-${id}-postulaciones.zip"`
    }
  });
}
```

### 17.5. Descarga de archivo individual: `src/app/api/files/[id]/route.ts`

```ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const id = Number(params.id);
  const archivo = await prisma.postulacionArchivo.findUnique({
    where: { id }
  });
  if (!archivo) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }
  if (!fs.existsSync(archivo.ruta)) {
    return NextResponse.json({ error: 'Archivo no disponible en el servidor' }, { status: 404 });
  }
  const buffer = fs.readFileSync(archivo.ruta);
  const ext = path.extname(archivo.nombreFinal).toLowerCase();
  const contentType =
    ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${archivo.nombreFinal}"`
    }
  });
}
```

---

## 18. Crear usuario ADMIN / RRHH

Usa Prisma Studio o SQL directo. Ejemplo SQL:

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

> La contraseña debe ser un hash bcrypt válido.

---

## 19. Ejecutar el proyecto

Finalmente:

```bash
npm run dev
```

- Portal público: http://localhost:3000/vacantes  
- Login RRHH: http://localhost:3000/login  
- Panel RRHH: http://localhost:3000/admin/vacantes  

Con esto tienes **todos los pasos y todo el código** para construir el proyecto pegando archivo por archivo.
