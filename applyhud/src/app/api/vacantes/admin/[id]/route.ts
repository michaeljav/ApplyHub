import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureRole } from '@/lib/ensureRole';
import { mapDocumentosPayload } from '@/lib/documentos';

interface Params {
  params: { id: string };
}

const vacanteInclude = {
  documentosRequeridos: true,
  _count: { select: { postulaciones: true } }
};

const parseId = (value: string) => {
  const id = Number(value);
  return Number.isNaN(id) ? null : id;
};

export async function GET(_: Request, { params }: Params) {
  const authError = await ensureRole(['ADMIN', 'RRHH']);
  if (authError) return authError;

  const id = parseId(params.id);
  if (id == null) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
  }

  const vacante = await prisma.vacante.findUnique({
    where: { id },
    include: vacanteInclude
  });

  if (!vacante) {
    return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 });
  }

  return NextResponse.json(vacante);
}

export async function PATCH(request: Request, { params }: Params) {
  const authError = await ensureRole(['ADMIN']);
  if (authError) return authError;

  const id = parseId(params.id);
  if (id == null) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 });
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
  }

  const payloadKeys = Object.keys(payload);
  if (!payloadKeys.length) {
    return NextResponse.json({ error: 'No hay cambios que aplicar' }, { status: 400 });
  }

  if (
    payloadKeys.length === 1 &&
    Object.prototype.hasOwnProperty.call(payload, 'activa') &&
    typeof payload.activa === 'boolean'
  ) {
    const vacante = await prisma.vacante.update({
      where: { id },
      data: { activa: payload.activa },
      include: vacanteInclude
    });
    return NextResponse.json(vacante);
  }

  const {
    titulo,
    requisitos,
    beneficios,
    fechaInicio,
    fechaFin,
    limitePostulantes,
    documentosRequeridos,
    activa
  } = payload;

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
      { error: 'Fechas invalidas' },
      { status: 400 }
    );
  }

  if (finDate < inicioDate) {
    return NextResponse.json(
      { error: 'La fecha fin debe ser posterior al inicio' },
      { status: 400 }
    );
  }

  const shouldUpdateDocs = Array.isArray(documentosRequeridos);
  const docs = shouldUpdateDocs ? mapDocumentosPayload(documentosRequeridos) : [];

  const vacante = await prisma.vacante.update({
    where: { id },
    data: {
      titulo: String(titulo),
      requisitos: String(requisitos),
      beneficios: String(beneficios),
      fechaInicio: inicioDate,
      fechaFin: finDate,
      limitePostulantes:
        typeof limitePostulantes === 'number' ? limitePostulantes : null,
      activa: typeof activa === 'boolean' ? activa : undefined,
      documentosRequeridos: shouldUpdateDocs
        ? {
            deleteMany: {},
            create: docs
          }
        : undefined
    },
    include: vacanteInclude
  });

  return NextResponse.json(vacante);
}
