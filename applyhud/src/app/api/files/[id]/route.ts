import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

interface Params {
  params: { id: string };
}

function resolvePath(ruta: string | null) {
  if (!ruta) return null;
  return path.isAbsolute(ruta)
    ? path.normalize(ruta)
    : path.normalize(path.join(process.cwd(), ruta));
}

export async function GET(_: Request, { params }: Params) {
  const id = Number(params.id);
  const archivo = await prisma.postulacionArchivo.findUnique({
    where: { id }
  });
  if (!archivo) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  const absolutePath = resolvePath(archivo.ruta ?? null);
  if (!absolutePath) {
    return NextResponse.json(
      { error: 'Ruta inválida para el archivo solicitado' },
      { status: 404 }
    );
  }

  try {
    await fs.promises.access(absolutePath, fs.constants.R_OK);
  } catch {
    return NextResponse.json(
      { error: 'Archivo no disponible en el servidor' },
      { status: 404 }
    );
  }

  const buffer = await fs.promises.readFile(absolutePath);
  const ext = path.extname(archivo.nombreFinal).toLowerCase();
  const contentType =
    ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${archivo.nombreFinal}"`
    }
  });
}
