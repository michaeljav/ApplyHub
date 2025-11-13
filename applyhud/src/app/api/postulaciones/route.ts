import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';
import { permitirMultiplesVacantes } from '@/lib/config';
import { guardarArchivoLocal } from '@/lib/upload';

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const vacanteId = Number(form.get('vacanteId'));
    const nombres = String(form.get('nombres') || '');
    const apellidos = String(form.get('apellidos') || '');
    const cedula = String(form.get('cedula') || '');
    const email = String(form.get('email') || '');
    const telefono = String(form.get('telefono') || '');
    const esDominicano = form.get('esDominicano') === 'true';
    const noJubilado = form.get('noJubilado') === 'true';
    const aceptoTerminos = form.get('aceptoTerminos') === 'true';

    if (!vacanteId || !nombres || !apellidos || !cedula || !email || !telefono) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const vacante = await prisma.vacante.findUnique({
      where: { id: vacanteId },
      include: { documentosRequeridos: true, _count: { select: { postulaciones: true } } }
    });
    if (!vacante) {
      return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 });
    }

    const hoy = dayjs();
    const inicio = dayjs(vacante.fechaInicio);
    const fin = dayjs(vacante.fechaFin);
    if (inicio.isAfter(hoy, 'day') || fin.isBefore(hoy, 'day')) {
      return NextResponse.json({ error: 'La vacante no está disponible' }, { status: 400 });
    }

    if (
      vacante.limitePostulantes != null &&
      vacante._count.postulaciones >= vacante.limitePostulantes
    ) {
      return NextResponse.json({ error: 'Se alcanzó el límite de postulantes' }, { status: 400 });
    }

    if (!permitirMultiplesVacantes()) {
      const yaPostulo = await prisma.postulacion.findFirst({
        where: { cedula }
      });
      if (yaPostulo) {
        return NextResponse.json(
          { error: 'Ya existe una postulación con esta cédula. Solo se permite una vacante.' },
          { status: 400 }
        );
      }
    }

    const existenteMismaVacante = await prisma.postulacion.findUnique({
      where: { vacanteId_cedula: { vacanteId, cedula } }
    });
    if (existenteMismaVacante) {
      return NextResponse.json(
        { error: 'Ya existe una postulación para esta vacante con esta cédula.' },
        { status: 400 }
      );
    }

    const postulacion = await prisma.postulacion.create({
      data: {
        vacanteId,
        nombres,
        apellidos,
        cedula,
        email,
        telefono,
        esDominicano,
        noJubilado,
        aceptoTerminos
      }
    });

    const docs = vacante.documentosRequeridos;
    for (const doc of docs) {
      const fieldName = `doc_${doc.id}`;
      const entry = form.get(fieldName);
      const archivo =
        entry && typeof Blob !== 'undefined' && entry instanceof Blob
          ? entry
          : null;

      if (doc.obligatorio && !archivo) {
        return NextResponse.json(
          { error: `Falta documento obligatorio: ${doc.nombre}` },
          { status: 400 }
        );
      }
      if (archivo) {
        const { nombreFinal, ruta } = await guardarArchivoLocal(
          archivo,
          doc.nombre.replace(/\s+/g, '-').toLowerCase(),
          vacanteId,
          postulacion.id
        );
        await prisma.postulacionArchivo.create({
          data: {
            postulacionId: postulacion.id,
            nombreLogico: doc.nombre,
            nombreFinal,
            ruta
          }
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Error procesando la postulación' }, { status: 500 });
  }
}
