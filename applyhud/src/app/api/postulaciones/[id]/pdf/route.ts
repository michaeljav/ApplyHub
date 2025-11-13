import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk as Buffer));
  const endPromise = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(16).text('Expediente de Postulación', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Vacante: ${postulacion.vacante.titulo}`);
  doc.text(`Nombre: ${postulacion.nombres} ${postulacion.apellidos}`);
  doc.text(`Cédula: ${postulacion.cedula}`);
  doc.text(`Correo: ${postulacion.email}`);
  doc.text(`Teléfono: ${postulacion.telefono}`);
  doc.text(`Fecha: ${postulacion.fecha.toISOString()}`);
  doc.moveDown();
  doc.text(`Es dominicano: ${postulacion.esDominicano ? 'Sí' : 'No'}`);
  doc.text(`No jubilado/pensionado: ${postulacion.noJubilado ? 'Sí' : 'No'}`);
  doc.text(`Aceptó términos: ${postulacion.aceptoTerminos ? 'Sí' : 'No'}`);
  doc.moveDown();
  doc.text('Documentos:');
  postulacion.archivos.forEach((a) => {
    doc.text(`- ${a.nombreLogico}: ${a.nombreFinal}`);
  });

  doc.end();
  const pdfBuffer = await endPromise;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="postulacion-${id}.pdf"`
    }
  });
}
