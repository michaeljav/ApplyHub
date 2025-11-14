import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';

export async function ensureRole(roles: Array<'ADMIN' | 'RRHH'>) {
  const session = await getServerSession(authConfig);
  const rol = (session?.user as { rol?: string } | undefined)?.rol;
  if (!session || !rol || !roles.includes(rol as 'ADMIN' | 'RRHH')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  return null;
}
