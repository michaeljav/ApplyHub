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

function resolveAbsolutePath(ruta: string | null) {
  if (!ruta) return null;
  if (path.isAbsolute(ruta)) {
    return path.normalize(ruta);
  }
  return path.normalize(path.join(cwd, ruta));
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
        missingFiles.push(`Ruta inválida (archivo ${archivo.id})`);
        continue;
      }

      if (!fs.existsSync(absolutePath)) {
        missingFiles.push(absolutePath);
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
    console.error(
      `No se pudieron incluir ${missingFiles.length} archivos en el ZIP de la vacante ${id}`,
      missingFiles
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
      'Content-Disposition': `attachment; filename="vacante-${id}-postulaciones.zip"`,
      'Content-Encoding': 'identity'
    }
  });
}
