import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { generarPdfPostulacion } from '@/lib/postulacionPdf';

interface Params {
  params: { id: string };
}

const cwd = process.cwd();

const APP_PREFIX_REGEX = /^[\\/]*app[\\/]/i;

function resolveAbsolutePath(ruta: string | null) {
  if (!ruta) return null;
  const normalized = path.normalize(ruta);
  const candidates: string[] = [];

  if (path.isAbsolute(normalized)) {
    candidates.push(normalized);
  } else {
    candidates.push(path.join(cwd, normalized));
  }

  const trimmed = normalized.replace(/^[\\/]+/, '');
  if (trimmed && trimmed !== normalized) {
    candidates.push(path.join(cwd, trimmed));
  }

  if (APP_PREFIX_REGEX.test(normalized) || APP_PREFIX_REGEX.test(trimmed)) {
    const withoutApp = trimmed.replace(/^app[\\/]/i, '');
    if (withoutApp) {
      candidates.push(path.join(cwd, withoutApp));
    }
  }

  const ensureAbsolute = (value: string) =>
    path.isAbsolute(value) ? value : path.join(cwd, value);

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
  const vacante = await prisma.vacante.findUnique({
    where: { id },
    include: { postulaciones: { include: { archivos: true } } }
  });

  if (!vacante) {
    return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 });
  }

  const missingFiles: string[] = [];
  const zip = new JSZip();

  for (const post of vacante.postulaciones) {
    const folder = `postulacion-${post.id}/`;
    const pdfBuffer = await generarPdfPostulacion(vacante.titulo, post);
    zip.file(`${folder}postulante.pdf`, pdfBuffer);

    for (const archivo of post.archivos) {
      const absolutePath = resolveAbsolutePath(archivo.ruta ?? null);
      if (!absolutePath) {
        missingFiles.push(archivo.ruta ?? `Ruta inválida (archivo ${archivo.id})`);
        continue;
      }

      try {
        const buffer = fs.readFileSync(absolutePath);
        const zipName = `${folder}documentos/${archivo.nombreFinal}`.replace(/\\/g, '/');
        zip.file(zipName, buffer);
      } catch (error) {
        console.error(`Error leyendo ${absolutePath}`, error);
        missingFiles.push(`${absolutePath} (error de lectura)`);
      }
    }
  }

  if (missingFiles.length > 0) {
    const warning = [
      `No se pudieron incluir ${missingFiles.length} archivos en el ZIP de la vacante ${id}.`,
      'Listado de rutas:',
      ...missingFiles
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
      'Content-Disposition': `attachment; filename="vacante-${id}-postulaciones.zip"`,
      'Content-Encoding': 'identity'
    }
  });
}
