import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const id = Number(params.id);
  const vacante = await prisma.vacante.findUnique({
    where: { id },
    include: {
      documentosRequeridos: true,
      _count: { select: { postulaciones: true } }
    }
  });
  if (!vacante) {
    return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 });
  }
  return NextResponse.json(vacante);
}
