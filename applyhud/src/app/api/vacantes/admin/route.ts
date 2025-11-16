import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ensureRole } from '@/lib/ensureRole';
import { mapDocumentosPayload } from '@/lib/documentos';
import { guardarArchivoInformativoVacante } from '@/lib/upload';

const vacanteInclude = {
  _count: { select: { postulaciones: true } },
  documentosRequeridos: true
};

type UploadedFile = Blob & { name?: string };

type ParsedRequest = {
  payload: any;
  pdfFile: UploadedFile | null;
};

async function parseVacanteRequest(request: Request): Promise<ParsedRequest> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const rawPayload = form.get('payload');
    if (!rawPayload || typeof rawPayload !== 'string') {
      throw new Error('Datos de vacante invalidos');
    }
    let payload: any;
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      throw new Error('JSON invalido');
    }
    const pdfEntry = form.get('pdfInformativo');
    const pdfFile =
      pdfEntry && typeof Blob !== 'undefined' && pdfEntry instanceof Blob && pdfEntry.size > 0
        ? (pdfEntry as UploadedFile)
        : null;
    return { payload, pdfFile };
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    throw new Error('JSON invalido');
  }
  return { payload, pdfFile: null };
}

export async function GET() {
  const authError = await ensureRole(['ADMIN', 'RRHH']);
  if (authError) return authError;

  const vacantes = await prisma.vacante.findMany({
    include: vacanteInclude,
    orderBy: { fechaInicio: 'asc' }
  });
  return NextResponse.json(vacantes);
}

export async function POST(request: Request) {
  const authError = await ensureRole(['ADMIN']);
  if (authError) return authError;

  try {
    const { payload, pdfFile } = await parseVacanteRequest(request);
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

    if (!titulo || !requisitos || !beneficios || !fechaInicio || !fechaFin) {
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

    const docs = mapDocumentosPayload(documentosRequeridos);

    let vacante = await prisma.vacante.create({
      data: {
        titulo: String(titulo),
        requisitos: String(requisitos),
        beneficios: String(beneficios),
        fechaInicio: inicioDate,
        fechaFin: finDate,
        limitePostulantes:
          typeof limitePostulantes === 'number' ? limitePostulantes : null,
        activa: typeof activa === 'boolean' ? activa : true,
        documentosRequeridos: docs.length ? { create: docs } : undefined
      },
      include: vacanteInclude
    });

    if (pdfFile) {
      const { nombreFinal, ruta } = await guardarArchivoInformativoVacante(
        pdfFile as any,
        vacante.id
      );
      vacante = await prisma.vacante.update({
        where: { id: vacante.id },
        data: {
          pdfInformativoNombre: pdfFile?.name ?? 'material.pdf',
          pdfInformativoArchivo: nombreFinal,
          pdfInformativoRuta: ruta
        },
        include: vacanteInclude
      });
    }

    return NextResponse.json(vacante, { status: 201 });
  } catch (error: any) {
    const message =
      typeof error?.message === 'string' ? error.message : 'Datos invalidos';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
