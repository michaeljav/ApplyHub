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
  const vacante = await prisma.vacante.findUnique({
    where: { id },
    include: { postulaciones: { include: { archivos: true } } }
  });
  if (!vacante) {
    return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 });
  }

  const zip = new AdmZip();

  for (const post of vacante.postulaciones) {
    const folder = `postulacion-${post.id}/`;

    const pdfBuffer = await generarPdfPostulacion(vacante.titulo, post);
    zip.addFile(path.join(folder, 'postulante.pdf'), pdfBuffer);

    for (const archivo of post.archivos) {
      if (fs.existsSync(archivo.ruta)) {
        const fileBuffer = fs.readFileSync(archivo.ruta);
        const name = path.join(folder, 'documentos', archivo.nombreFinal);
        zip.addFile(name, fileBuffer);
      }
    }
  }

  const zipBuffer = zip.toBuffer();

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="vacante-${id}-postulaciones.zip"`
    }
  });
}
