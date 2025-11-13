import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const id = Number(params.id);
  const archivo = await prisma.postulacionArchivo.findUnique({
    where: { id }
  });
  if (!archivo) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }
  if (!fs.existsSync(archivo.ruta)) {
    return NextResponse.json({ error: 'Archivo no disponible en el servidor' }, { status: 404 });
  }
  const buffer = fs.readFileSync(archivo.ruta);
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
