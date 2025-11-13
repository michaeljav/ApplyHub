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

    // PDF
    const pdfDoc = new PDFDocument();
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk as Buffer));
    const endPromise = new Promise<Buffer>((resolve) => {
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    pdfDoc.fontSize(16).text('Expediente de Postulación', { underline: true });
    pdfDoc.moveDown();
    pdfDoc.fontSize(12).text(`Vacante: ${vacante.titulo}`);
    pdfDoc.text(`Nombre: ${post.nombres} ${post.apellidos}`);
    pdfDoc.text(`Cédula: ${post.cedula}`);
    pdfDoc.text(`Correo: ${post.email}`);
    pdfDoc.text(`Teléfono: ${post.telefono}`);
    pdfDoc.text(`Fecha: ${post.fecha.toISOString()}`);
    pdfDoc.moveDown();
    pdfDoc.text(`Es dominicano: ${post.esDominicano ? 'Sí' : 'No'}`);
    pdfDoc.text(`No jubilado/pensionado: ${post.noJubilado ? 'Sí' : 'No'}`);
    pdfDoc.text(`Aceptó términos: ${post.aceptoTerminos ? 'Sí' : 'No'}`);
    pdfDoc.moveDown();
    pdfDoc.text('Documentos:');
    post.archivos.forEach((a) => {
      pdfDoc.text(`- ${a.nombreLogico}: ${a.nombreFinal}`);
    });

    pdfDoc.end();
    const pdfBuffer = await endPromise;
    zip.addFile(path.join(folder, `postulante.pdf`), pdfBuffer);

    // documentos
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
