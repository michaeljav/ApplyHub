import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';

async function ensureRole(roles: Array<'ADMIN' | 'RRHH'>) {
  const session = await getServerSession(authConfig);
  const rol = (session?.user as { rol?: string } | undefined)?.rol;
  if (!session || !rol || !roles.includes(rol as 'ADMIN' | 'RRHH')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const authError = await ensureRole(['ADMIN', 'RRHH']);
  if (authError) return authError;

  const vacantes = await prisma.vacante.findMany({
    include: {
      _count: { select: { postulaciones: true } }
    },
    orderBy: { fechaInicio: 'asc' }
  });
  return NextResponse.json(vacantes);
}

export async function POST(request: Request) {
  const authError = await ensureRole(['ADMIN']);
  if (authError) return authError;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const {
    titulo,
    requisitos,
    beneficios,
    fechaInicio,
    fechaFin,
    limitePostulantes,
    documentosRequeridos = []
  } = payload || {};

  if (
    !titulo ||
    !requisitos ||
    !beneficios ||
    !fechaInicio ||
    !fechaFin
  ) {
    return NextResponse.json(
      { error: 'Faltan campos obligatorios' },
      { status: 400 }
    );
  }

  const inicioDate = new Date(fechaInicio);
  const finDate = new Date(fechaFin);
  if (Number.isNaN(inicioDate.getTime()) || Number.isNaN(finDate.getTime())) {
    return NextResponse.json(
      { error: 'Fechas inválidas' },
      { status: 400 }
    );
  }

  if (finDate < inicioDate) {
    return NextResponse.json(
      { error: 'La fecha fin debe ser posterior al inicio' },
      { status: 400 }
    );
  }

  const docs = Array.isArray(documentosRequeridos)
    ? documentosRequeridos
        .filter((doc) => doc?.nombre)
        .map((doc: any, index: number) => ({
          nombre: String(doc.nombre),
          descripcion: doc.descripcion ? String(doc.descripcion) : null,
          obligatorio: Boolean(doc.obligatorio),
          extensiones: Array.isArray(doc.extensiones)
            ? doc.extensiones.map((ext: string) => ext.toLowerCase())
            : [],
          tamanoMaxMB:
            typeof doc.tamanoMaxMB === 'number' ? doc.tamanoMaxMB : null,
          orden:
            typeof doc.orden === 'number' ? doc.orden : index + 1
        }))
    : [];

  const vacante = await prisma.vacante.create({
    data: {
      titulo: String(titulo),
      requisitos: String(requisitos),
      beneficios: String(beneficios),
      fechaInicio: inicioDate,
      fechaFin: finDate,
      limitePostulantes:
        typeof limitePostulantes === 'number' ? limitePostulantes : null,
      documentosRequeridos: docs.length
        ? { create: docs }
        : undefined
    },
    include: {
      _count: { select: { postulaciones: true } },
      documentosRequeridos: true
    }
  });

  return NextResponse.json(vacante, { status: 201 });
}
