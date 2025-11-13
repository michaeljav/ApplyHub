import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import AdmZip from 'adm-zip';
import fs from 'fs';

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

// PDF
export async function POST(req: Request, context: Params) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 405 });
}
