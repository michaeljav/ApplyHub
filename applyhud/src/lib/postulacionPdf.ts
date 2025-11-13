import { PDFDocument, StandardFonts } from 'pdf-lib';

export type ArchivoResumen = {
  nombreLogico: string;
  nombreFinal: string;
};

export type PostulacionResumen = {
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  telefono: string;
  fecha: Date;
  esDominicano: boolean;
  noJubilado: boolean;
  aceptoTerminos: boolean;
  archivos: ArchivoResumen[];
};

export async function generarPdfPostulacion(
  tituloVacante: string,
  postulacion: PostulacionResumen
) {
  const pdfDoc = await PDFDocument.create();
  const fuente = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let pagina = pdfDoc.addPage();
  const margen = 50;
  const altoLinea = 18;
  let cursorY = pagina.getHeight() - margen;

  const asegurarEspacio = (lineas = 1) => {
    if (cursorY - altoLinea * lineas <= margen) {
      pagina = pdfDoc.addPage();
      cursorY = pagina.getHeight() - margen;
      pagina.setFont(fuente);
      pagina.setFontSize(12);
    }
  };

  const escribir = (texto = '') => {
    asegurarEspacio();
    pagina.drawText(texto, {
      x: margen,
      y: cursorY,
      size: 12,
      font: fuente
    });
    cursorY -= altoLinea;
  };

  pagina.setFont(fuente);
  pagina.setFontSize(16);
  pagina.drawText('Expediente de Postulación', { x: margen, y: cursorY });
  cursorY -= altoLinea * 1.5;

  pagina.setFontSize(12);
  escribir(`Vacante: ${tituloVacante}`);
  escribir(`Nombre: ${postulacion.nombres} ${postulacion.apellidos}`);
  escribir(`Cédula: ${postulacion.cedula}`);
  escribir(`Correo: ${postulacion.email}`);
  escribir(`Teléfono: ${postulacion.telefono}`);
  escribir(`Fecha: ${postulacion.fecha.toISOString()}`);
  cursorY -= altoLinea * 0.5;
  escribir(`Es dominicano: ${postulacion.esDominicano ? 'Sí' : 'No'}`);
  escribir(`No jubilado/pensionado: ${postulacion.noJubilado ? 'Sí' : 'No'}`);
  escribir(`Aceptó términos: ${postulacion.aceptoTerminos ? 'Sí' : 'No'}`);
  cursorY -= altoLinea * 0.5;
  escribir('Documentos:');
  postulacion.archivos.forEach((archivo) => {
    escribir(`- ${archivo.nombreLogico}: ${archivo.nombreFinal}`);
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
