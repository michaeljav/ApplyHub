import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureRole } from '@/lib/ensureRole';
import { mapDocumentosPayload } from '@/lib/documentos';

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
    documentosRequeridos = [],
    activa
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

  const docs = mapDocumentosPayload(documentosRequeridos);

  const vacante = await prisma.vacante.create({
    data: {
      titulo: String(titulo),
      requisitos: String(requisitos),
      beneficios: String(beneficios),
      fechaInicio: inicioDate,
      fechaFin: finDate,
      limitePostulantes:
        typeof limitePostulantes === 'number' ? limitePostulantes : null,
      activa: typeof activa === 'boolean' ? activa : true,
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
