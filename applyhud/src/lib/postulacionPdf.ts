import { PDFDocument, StandardFonts } from 'pdf-lib';

export type ArchivoResumen = {
  nombreLogico: string;
  nombreFinal: string;
};

export type PostulacionResumen = {
  id: number;
  vacanteId: number;
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

  const dividirEnLineas = (texto = '') => {
    const maxAncho = pagina.getWidth() - margen * 2;
    if (!texto) return [''];

    const palabras = texto.split(' ');
    const lineas: string[] = [];
    let actual = '';

    const empujarLinea = (linea: string) => {
      if (linea) {
        lineas.push(linea);
      }
    };

    const truncarPalabraLarga = (palabra: string) => {
      let segmento = '';
      for (const char of palabra) {
        const prueba = segmento + char;
        if (fuente.widthOfTextAtSize(prueba, 12) <= maxAncho) {
          segmento = prueba;
        } else {
          if (segmento) empujarLinea(segmento);
          segmento = char;
        }
      }
      return segmento;
    };

    for (const palabra of palabras) {
      const candidato = actual ? `${actual} ${palabra}` : palabra;
      if (fuente.widthOfTextAtSize(candidato, 12) <= maxAncho) {
        actual = candidato;
      } else {
        if (actual) empujarLinea(actual);
        if (fuente.widthOfTextAtSize(palabra, 12) <= maxAncho) {
          actual = palabra;
        } else {
          actual = truncarPalabraLarga(palabra);
        }
      }
    }

    if (actual) {
      lineas.push(actual);
    }

    return lineas.length ? lineas : [''];
  };

  const escribir = (texto = '') => {
    const lineas = dividirEnLineas(texto);
    asegurarEspacio(lineas.length);
    lineas.forEach((linea) => {
      pagina.drawText(linea, {
        x: margen,
        y: cursorY,
        size: 12,
        font: fuente
      });
      cursorY -= altoLinea;
    });
  };

  pagina.setFont(fuente);
  pagina.setFontSize(16);
  pagina.drawText('Expediente de Postulación', { x: margen, y: cursorY });
  cursorY -= altoLinea * 1.5;

  pagina.setFontSize(12);
  escribir(`Codigo vacante: ${postulacion.vacanteId}`);
  escribir(`Vacante: ${tituloVacante}`);
  escribir(`Codigo postulacion: ${postulacion.id}`);
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
