import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { generarPdfPostulacion } from '@/lib/postulacionPdf';

interface Params {
  params: { id: string };
}

const rootDir = process.cwd();

function toAbsolute(ruta: string | null) {
  if (!ruta) return null;
  return path.isAbsolute(ruta)
    ? path.normalize(ruta)
    : path.normalize(path.join(rootDir, ruta));
}

export async function GET(_: Request, { params }: Params) {
  const id = Number(params.id);
  const postulacion = await prisma.postulacion.findUnique({
    where: { id },
    include: { vacante: true, archivos: true }
  });

  if (!postulacion) {
    return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 });
  }

  const missing: string[] = [];
  const zip = new JSZip();

  const pdfBuffer = await generarPdfPostulacion(postulacion.vacante.titulo, postulacion);
  zip.file('postulante.pdf', pdfBuffer);

  for (const archivo of postulacion.archivos) {
    const absolute = toAbsolute(archivo.ruta ?? null);
    if (!absolute || !fs.existsSync(absolute)) {
      missing.push(archivo.ruta ?? `archivo ${archivo.id}`);
      continue;
    }
    try {
      const buffer = fs.readFileSync(absolute);
      const entryName = `documentos/${archivo.nombreFinal}`.replace(/\\/g, '/');
      zip.file(entryName, buffer);
    } catch (error) {
      console.error(`Error leyendo ${absolute}`, error);
      missing.push(`${absolute} (lectura fallida)`);
    }
  }

  if (missing.length) {
    console.error(
      `No se pudieron empaquetar ${missing.length} archivos de la postulacion ${id}`,
      missing
    );
    return NextResponse.json(
      { error: 'Faltan archivos para generar el ZIP. Revisa la consola.' },
      { status: 500 }
    );
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'STORE'
  });

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="postulacion-${id}.zip"`,
      'Content-Encoding': 'identity'
    }
  });
}
