import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

interface Params {
  params: { id: string };
}

function resolvePath(ruta: string | null) {
  if (!ruta) return null;
  return path.isAbsolute(ruta)
    ? path.normalize(ruta)
    : path.normalize(path.join(process.cwd(), ruta));
}

export async function GET(_: Request, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
  }

  const vacante = await prisma.vacante.findUnique({
    where: { id }
  });

  if (!vacante || !vacante.pdfInformativoArchivo) {
    return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 });
  }

  const absolute = resolvePath(vacante.pdfInformativoRuta ?? null);
  if (!absolute) {
    return NextResponse.json({ error: 'Ruta invalida' }, { status: 404 });
  }

  try {
    await fs.promises.access(absolute, fs.constants.R_OK);
  } catch {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  const buffer = await fs.promises.readFile(absolute);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${vacante.pdfInformativoArchivo}"`
    }
  });
}
