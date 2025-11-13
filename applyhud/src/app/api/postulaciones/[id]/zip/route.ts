import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

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

  const zip = new AdmZip();

  // PDF dentro del zip
  const pdfDoc = new PDFDocument();
  const chunks: Buffer[] = [];
  pdfDoc.on('data', (chunk) => chunks.push(chunk as Buffer));
  const endPromise = new Promise<Buffer>((resolve) => {
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  pdfDoc.fontSize(16).text('Expediente de Postulación', { underline: true });
  pdfDoc.moveDown();
  pdfDoc.fontSize(12).text(`Vacante: ${postulacion.vacante.titulo}`);
  pdfDoc.text(`Nombre: ${postulacion.nombres} ${postulacion.apellidos}`);
  pdfDoc.text(`Cédula: ${postulacion.cedula}`);
  pdfDoc.text(`Correo: ${postulacion.email}`);
  pdfDoc.text(`Teléfono: ${postulacion.telefono}`);
  pdfDoc.text(`Fecha: ${postulacion.fecha.toISOString()}`);
  pdfDoc.moveDown();
  pdfDoc.text(`Es dominicano: ${postulacion.esDominicano ? 'Sí' : 'No'}`);
  pdfDoc.text(`No jubilado/pensionado: ${postulacion.noJubilado ? 'Sí' : 'No'}`);
  pdfDoc.text(`Aceptó términos: ${postulacion.aceptoTerminos ? 'Sí' : 'No'}`);
  pdfDoc.moveDown();
  pdfDoc.text('Documentos:');
  postulacion.archivos.forEach((a) => {
    pdfDoc.text(`- ${a.nombreLogico}: ${a.nombreFinal}`);
  });

  pdfDoc.end();
  const pdfBuffer = await endPromise;
  zip.addFile(`postulante.pdf`, pdfBuffer);

  const docsFolder = 'documentos/';
  for (const archivo of postulacion.archivos) {
    if (fs.existsSync(archivo.ruta)) {
      const fileBuffer = fs.readFileSync(archivo.ruta);
      const name = path.join(docsFolder, archivo.nombreFinal);
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
