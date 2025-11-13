import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generarPdfPostulacion } from '@/lib/postulacionPdf';

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  const id = Number(params.id);
  const postulacion = await prisma.postulacion.findUnique({
    where: { id },
    include: { vacante: true, archivos: true }
  });
  if (!postulacion) {
    return NextResponse.json(
      { error: 'Postulación no encontrada' },
      { status: 404 }
    );
  }

  const pdfBuffer = await generarPdfPostulacion(
    postulacion.vacante.titulo,
    postulacion
  );

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="postulacion-${id}.pdf"`
    }
  });
}
