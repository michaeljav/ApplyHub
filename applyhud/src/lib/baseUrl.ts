// src/lib/baseUrl.ts
export function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BASE_URL no está definido en el .env');
  }

  return baseUrl.replace(/\/+$/, ''); // quita / al final si lo hay
}
