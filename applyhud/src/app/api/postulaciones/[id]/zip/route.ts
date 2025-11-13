import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
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

  const zip = new AdmZip();

  const pdfBuffer = await generarPdfPostulacion(
    postulacion.vacante.titulo,
    postulacion
  );
  zip.addFile('postulante.pdf', pdfBuffer);

  for (const archivo of postulacion.archivos) {
    if (fs.existsSync(archivo.ruta)) {
      const fileBuffer = fs.readFileSync(archivo.ruta);
      const name = path.join('documentos', archivo.nombreFinal);
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
