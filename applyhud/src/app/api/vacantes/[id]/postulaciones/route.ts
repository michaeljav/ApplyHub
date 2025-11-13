import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const id = Number(params.id);
  const postulaciones = await prisma.postulacion.findMany({
    where: { vacanteId: id },
    orderBy: { fecha: 'asc' }
  });
  return NextResponse.json(postulaciones);
}
