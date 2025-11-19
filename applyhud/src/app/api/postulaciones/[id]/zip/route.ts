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
const APP_PREFIX_REGEX = /^[\\/]*app[\\/]/i;

function toAbsolute(ruta: string | null) {
  if (!ruta) return null;
  const normalized = path.normalize(ruta);
  const candidates: string[] = [];

  if (path.isAbsolute(normalized)) {
    candidates.push(normalized);
  } else {
    candidates.push(path.join(rootDir, normalized));
  }

  const trimmed = normalized.replace(/^[\\/]+/, '');
  if (trimmed && trimmed !== normalized) {
    candidates.push(path.join(rootDir, trimmed));
  }

  if (APP_PREFIX_REGEX.test(normalized) || APP_PREFIX_REGEX.test(trimmed)) {
    const withoutApp = trimmed.replace(/^app[\\/]/i, '');
    if (withoutApp) {
      candidates.push(path.join(rootDir, withoutApp));
    }
  }

  const ensureAbsolute = (value: string) =>
    path.isAbsolute(value) ? value : path.join(rootDir, value);

  for (const candidate of candidates) {
    const resolved = ensureAbsolute(candidate);
    if (fs.existsSync(resolved)) {
      return path.normalize(resolved);
    }
  }

  return null;
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
    if (!absolute) {
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
    const warning = [
      `No se pudieron empaquetar ${missing.length} archivos de la postulacion ${id}.`,
      'Listado de rutas:',
      ...missing
    ].join('\n');
    console.warn(warning);
    zip.file(
      'AVISO-ARCHIVOS-FALTANTES.txt',
      `${warning}\n\nEl resto de documentos disponibles fue incluido correctamente.`
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
