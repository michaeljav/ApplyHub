import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const vacantes = await prisma.vacante.findMany({
    include: {
      _count: { select: { postulaciones: true } }
    },
    where: { activa: true },
    orderBy: { fechaInicio: 'asc' }
  });
  return NextResponse.json(vacantes);
}
