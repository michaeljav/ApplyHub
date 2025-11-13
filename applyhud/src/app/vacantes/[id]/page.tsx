import { Vacante, VacanteDocumento } from '@prisma/client';
import dayjs from 'dayjs';
import Link from 'next/link';

interface VacanteDetalle extends Vacante {
  documentosRequeridos: VacanteDocumento[];
  _count: { postulaciones: number };
}

async function getVacante(id: string): Promise<VacanteDetalle> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/vacantes/${id}`, {
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Error cargando vacante');
  return res.json();
}

export default async function VacantePage({ params }: { params: { id: string } }) {
  const vacante = await getVacante(params.id);
  const hoy = dayjs();
  const inicio = dayjs(vacante.fechaInicio);
  const fin = dayjs(vacante.fechaFin);
  const dentroDeFechas = !inicio.isAfter(hoy, 'day') && !fin.isBefore(hoy, 'day');
  const limiteAlcanzado =
    vacante.limitePostulantes != null &&
    vacante._count.postulaciones >= vacante.limitePostulantes;

  const puedeAplicar = dentroDeFechas && !limiteAlcanzado;

  return (
    <main style={{ padding: 24 }}>
      <h1>{vacante.titulo}</h1>
      <p>
        Publicación: {inicio.format('DD/MM/YYYY')} - {fin.format('DD/MM/YYYY')}
      </p>
      {vacante.limitePostulantes && (
        <p>
          Límite de postulantes: {vacante._count.postulaciones}/
          {vacante.limitePostulantes}
        </p>
      )}
      <h2>Requisitos mínimos</h2>
      <p style={{ whiteSpace: 'pre-line' }}>{vacante.requisitos}</p>
      <h2>Beneficios</h2>
      <p style={{ whiteSpace: 'pre-line' }}>{vacante.beneficios}</p>
      <h2>Documentos requeridos</h2>
      <ul>
        {vacante.documentosRequeridos
          .sort((a, b) => a.orden - b.orden)
          .map((doc) => (
            <li key={doc.id}>
              <strong>{doc.nombre}</strong>
              {doc.obligatorio ? ' (Obligatorio)' : ' (Opcional)'}
              {doc.descripcion && <> – {doc.descripcion}</>}
            </li>
          ))}
      </ul>

      {puedeAplicar ? (
        <Link href={`/vacantes/${vacante.id}/aplicar`}>
          Aplicar a esta vacante
        </Link>
      ) : (
        <p style={{ color: 'red', marginTop: 16 }}>
          Esta vacante no está disponible para nuevas postulaciones.
        </p>
      )}
    </main>
  );
}
