import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dayjs from 'dayjs';
import { permitirMultiplesVacantes } from '@/lib/config';
import { guardarArchivoLocal } from '@/lib/upload';
import type { DocumentoTipo } from '@prisma/client';

type DocumentoMeta = {
  texto?: string;
  tipoDocumento?: string;
  caraCedula?: 'FRONTAL' | 'REVERSO' | null;
  tituloNivel?: string | null;
  certificadoLaboral?: {
    institucion?: string;
    cargo?: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
  } | null;
};

const parseDocumentoMeta = (valor: string | null): DocumentoMeta => {
  if (!valor) return {};
  try {
    const parsed = JSON.parse(valor);
    if (parsed && typeof parsed === 'object') {
      return parsed as DocumentoMeta;
    }
    return {};
  } catch {
    return {};
  }
};

const getFileFromForm = (form: FormData, key: string) => {
  const entry = form.get(key);
  return entry && typeof Blob !== 'undefined' && entry instanceof Blob
    ? (entry as Blob)
    : null;
};

const getStringFromForm = (form: FormData, key: string) => {
  const value = form.get(key);
  return value == null ? '' : String(value);
};

type ArchivoPendiente = {
  archivo: Blob;
  nombreLogico: string;
  tipoDocumento: DocumentoTipo;
  caraCedula?: 'FRONTAL' | 'REVERSO' | null;
  tituloNivel?: string | null;
  graduado?: string | null;
  institucion?: string | null;
  cargo?: string | null;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
};

const HUMAN_CONFIRMATION_TEXT = 'SOY HUMANO';

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
    const humanCheck = String(form.get('humanCheck') || '');
    const honeypot = String(form.get('website') || '');

    if (!vacanteId || !nombres || !apellidos || !cedula || !email || !telefono) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (honeypot.trim().length > 0) {
      return NextResponse.json({ error: 'Solicitud invalida' }, { status: 400 });
    }

    if (humanCheck.trim().toUpperCase() !== HUMAN_CONFIRMATION_TEXT) {
      return NextResponse.json(
        { error: 'Confirma que eres una persona escribiendo la frase indicada.' },
        { status: 400 }
      );
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

    const docs = vacante.documentosRequeridos;
    const archivosPendientes: ArchivoPendiente[] = [];
    for (const doc of docs) {
      const baseName = `doc_${doc.id}`;

      switch (doc.tipoDocumento) {
        case 'CEDULA': {
          const frontal = getFileFromForm(form, `${baseName}_frontal`);
          const reverso = getFileFromForm(form, `${baseName}_reverso`);
          const alguno = Boolean(frontal || reverso);
          const ambos = Boolean(frontal && reverso);

          if (doc.obligatorio && !ambos) {
            return NextResponse.json(
              { error: `Debes subir ambas caras de la cedula: ${doc.nombre}` },
              { status: 400 }
            );
          }

          if (!doc.obligatorio && alguno && !ambos) {
            return NextResponse.json(
              { error: `Debes subir ambas caras de la cedula: ${doc.nombre}` },
              { status: 400 }
            );
          }

          if (frontal) {
            archivosPendientes.push({
              archivo: frontal,
              nombreLogico: `${doc.nombre} - frontal`,
              tipoDocumento: doc.tipoDocumento,
              caraCedula: 'FRONTAL'
            });
          }

          if (reverso) {
            archivosPendientes.push({
              archivo: reverso,
              nombreLogico: `${doc.nombre} - reverso`,
              tipoDocumento: doc.tipoDocumento,
              caraCedula: 'REVERSO'
            });
          }
          continue;
        }
        case 'TITULO': {
          const grado = getStringFromForm(form, `${baseName}_grado`).trim();
          const estadoGraduado = getStringFromForm(form, `${baseName}_graduado`).trim();
          const tituloNombre = getStringFromForm(form, `${baseName}_nombre`).trim();
          const archivoTitulo = getFileFromForm(form, `${baseName}_archivo`);

          const tieneDatos =
            Boolean(grado) ||
            Boolean(estadoGraduado) ||
            Boolean(tituloNombre) ||
            Boolean(archivoTitulo);
          const completos =
            Boolean(grado) &&
            Boolean(estadoGraduado) &&
            Boolean(tituloNombre) &&
            Boolean(archivoTitulo);

          if (doc.obligatorio && !completos) {
            return NextResponse.json(
              { error: `Faltan datos del titulo para: ${doc.nombre}` },
              { status: 400 }
            );
          }

          if (!doc.obligatorio && tieneDatos && !completos) {
            return NextResponse.json(
              { error: `Completa todos los campos del titulo: ${doc.nombre}` },
              { status: 400 }
            );
          }

          if (archivoTitulo) {
            archivosPendientes.push({
              archivo: archivoTitulo,
              nombreLogico: tituloNombre || doc.nombre,
              tipoDocumento: doc.tipoDocumento,
              tituloNivel: grado || null,
              graduado: estadoGraduado || null
            });
          }
          continue;
        }
        case 'CERTIFICADO_LABORAL': {
          const institucion = getStringFromForm(
            form,
            `${baseName}_institucion`
          ).trim();
          const cargo = getStringFromForm(form, `${baseName}_cargo`).trim();
          const fechaInicioStr = getStringFromForm(
            form,
            `${baseName}_fechaInicio`
          ).trim();
          const fechaFinStr = getStringFromForm(
            form,
            `${baseName}_fechaFin`
          ).trim();
          const archivoCert = getFileFromForm(form, `${baseName}_archivo`);

          const tieneDatos =
            Boolean(institucion) ||
            Boolean(cargo) ||
            Boolean(fechaInicioStr) ||
            Boolean(fechaFinStr) ||
            Boolean(archivoCert);
          const completos =
            Boolean(institucion) &&
            Boolean(cargo) &&
            Boolean(fechaInicioStr) &&
            Boolean(fechaFinStr) &&
            Boolean(archivoCert);
          const fechaInicioDate = fechaInicioStr ? new Date(fechaInicioStr) : null;
          const fechaFinDate = fechaFinStr ? new Date(fechaFinStr) : null;
          const fechasValidas =
            (!fechaInicioStr || (fechaInicioDate && !Number.isNaN(fechaInicioDate.getTime()))) &&
            (!fechaFinStr || (fechaFinDate && !Number.isNaN(fechaFinDate.getTime())));

          if (!fechasValidas) {
            return NextResponse.json(
              { error: `Fechas invalidas en la certificacion: ${doc.nombre}` },
              { status: 400 }
            );
          }

          if (doc.obligatorio && !completos) {
            return NextResponse.json(
              { error: `Faltan datos de la certificacion laboral: ${doc.nombre}` },
              { status: 400 }
            );
          }

          if (!doc.obligatorio && tieneDatos && !completos) {
            return NextResponse.json(
              { error: `Completa todos los campos del certificado: ${doc.nombre}` },
              { status: 400 }
            );
          }

          if (archivoCert) {
            archivosPendientes.push({
              archivo: archivoCert,
              nombreLogico: doc.nombre,
              tipoDocumento: doc.tipoDocumento,
              institucion: institucion || null,
              cargo: cargo || null,
              fechaInicio: fechaInicioDate,
              fechaFin: fechaFinDate
            });
          }
          continue;
        }
        default: {
          const archivo =
            getFileFromForm(form, `${baseName}_archivo`) ||
            getFileFromForm(form, baseName);

          if (doc.obligatorio && !archivo) {
            return NextResponse.json(
              { error: `Falta documento obligatorio: ${doc.nombre}` },
              { status: 400 }
            );
          }

          if (!archivo) continue;

          archivosPendientes.push({
            archivo,
            nombreLogico: doc.nombre,
            tipoDocumento: doc.tipoDocumento
          });
        }
      }
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

    for (const pendiente of archivosPendientes) {
      const slug = pendiente.nombreLogico.replace(/\s+/g, '-').toLowerCase();
      const { nombreFinal, ruta } = await guardarArchivoLocal(
        pendiente.archivo,
        slug,
        vacanteId,
        postulacion.id
      );

      await prisma.postulacionArchivo.create({
        data: {
          postulacionId: postulacion.id,
          nombreLogico: pendiente.nombreLogico,
          nombreFinal,
          ruta,
          tipoDocumento: pendiente.tipoDocumento,
          caraCedula: pendiente.caraCedula ?? null,
          tituloNivel: pendiente.tituloNivel ?? null,
          graduado: pendiente.graduado ?? null,
          institucion: pendiente.institucion ?? null,
          cargo: pendiente.cargo ?? null,
          fechaInicio: pendiente.fechaInicio ?? null,
          fechaFin: pendiente.fechaFin ?? null
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Error procesando la postulación' }, { status: 500 });
  }
}



