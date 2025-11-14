import { Vacante, VacanteDocumento } from '@prisma/client';
import dayjs from 'dayjs';
import { getBaseUrl } from '@/lib/baseUrl';
import ApplyWarningLink from '@/components/vacantes/ApplyWarningLink';

type DocumentoMeta = {
  texto?: string;
  tipoDocumento?: string;
  caraCedula?: string | null;
  tituloNivel?: string | null;
  certificacion?: {
    institucion?: string;
    cargo?: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
  } | null;
};

interface VacanteDetalle extends Vacante {
  documentosRequeridos: VacanteDocumento[];
  _count: { postulaciones: number };
}

function parseDocumentoDescripcion(value: string | null) {
  if (!value) return { texto: '', meta: {} as DocumentoMeta };
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && 'texto' in parsed) {
      return {
        texto: typeof parsed.texto === 'string' ? parsed.texto : '',
        meta: parsed as DocumentoMeta
      };
    }
    return { texto: value, meta: {} as DocumentoMeta };
  } catch {
    return { texto: value, meta: {} as DocumentoMeta };
  }
}

async function getVacante(id: string): Promise<VacanteDetalle> {
  const baseUrl = getBaseUrl();

  const res = await fetch(new URL(`/api/vacantes/${id}`, baseUrl), {
    cache: 'no-store'
  });

  if (!res.ok) throw new Error('Error cargando vacante');
  return res.json();
}

export default async function VacantePage({
  params
}: {
  params: { id: string };
}) {
  const vacante = await getVacante(params.id);
  const hoy = dayjs();
  const inicio = dayjs(vacante.fechaInicio);
  const fin = dayjs(vacante.fechaFin);
  const dentroDeFechas =
    !inicio.isAfter(hoy, 'day') && !fin.isBefore(hoy, 'day');
  const limiteAlcanzado =
    vacante.limitePostulantes != null &&
    vacante._count.postulaciones >= vacante.limitePostulantes;

  const puedeAplicar = vacante.activa && dentroDeFechas && !limiteAlcanzado;

  return (
    <main style={{ padding: 24 }}>
      <div
        role="alert"
        style={{
          backgroundColor: '#fff8e1',
          border: '1px solid #ffe58f',
          color: '#7a5300',
          textAlign: 'center',
          padding: '12px 16px',
          borderRadius: 8,
          fontWeight: 600,
          marginBottom: 24,
          maxWidth: 720,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        Importante: solo puedes aplicar a una vacante.
      </div>
      <h1>{vacante.titulo}</h1>
      <p style={{ color: '#666', marginTop: -8 }}>Código: {vacante.id}</p>
      <p>
        Publicacion: {inicio.format('DD/MM/YYYY')} - {fin.format('DD/MM/YYYY')}
      </p>
      {vacante.pdfInformativoNombre && (
        <p>
          Material adicional:{' '}
          <a
            href={`/api/vacantes/${vacante.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Descargar {vacante.pdfInformativoNombre}
          </a>
        </p>
      )}
      {!vacante.activa && (
        <p style={{ color: 'red' }}>
          Esta vacante se encuentra inactiva y no recibe nuevas postulaciones.
        </p>
      )}
      {vacante.limitePostulantes && (
        <p>
          Limite de postulantes: {vacante._count.postulaciones}/
          {vacante.limitePostulantes}
        </p>
      )}
      <h2>Requisitos minimos</h2>
      <p style={{ whiteSpace: 'pre-line' }}>{vacante.requisitos}</p>
      <h2>Beneficios</h2>
      <p style={{ whiteSpace: 'pre-line' }}>{vacante.beneficios}</p>
      <h2>Documentos requeridos</h2>
      <ul>
        {vacante.documentosRequeridos
          .sort((a, b) => a.orden - b.orden)
          .map((doc) => {
            const descripcion = parseDocumentoDescripcion(doc.descripcion);
            const extras: string[] = [];
            if (descripcion.meta?.caraCedula) {
              extras.push(
                `Cara: ${
                  descripcion.meta.caraCedula === 'FRONTAL'
                    ? 'Frontal'
                    : 'Reverso'
                }`
              );
            }
            if (
              descripcion.meta?.tipoDocumento === 'TITULO' &&
              descripcion.meta?.tituloNivel
            ) {
              extras.push(`Nivel: ${descripcion.meta.tituloNivel}`);
            }
            if (descripcion.meta?.certificadoLaboral) {
              const cert = descripcion.meta.certificadoLaboral;
              const detalles: string[] = [];
              if (cert?.institucion)
                detalles.push(`Institución: ${cert.institucion}`);
              if (cert?.cargo) detalles.push(`Cargo: ${cert.cargo}`);
              if (cert?.fechaInicio || cert?.fechaFin) {
                detalles.push(
                  `Periodo: ${cert?.fechaInicio || 'N/D'} - ${
                    cert?.fechaFin || 'Actual'
                  }`
                );
              }
              if (detalles.length) extras.push(detalles.join(' | '));
            }
            return (
              <li key={doc.id}>
                <strong>{doc.nombre}</strong>
                {doc.obligatorio ? ' (Obligatorio)' : ' (Opcional)'}
                {descripcion.texto && <> - {descripcion.texto}</>}
                {extras.length > 0 && (
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {extras.join(' | ')}
                  </div>
                )}
              </li>
            );
          })}
      </ul>

      {puedeAplicar ? (
        <ApplyWarningLink vacanteId={vacante.id} />
      ) : (
        <p style={{ color: 'red', marginTop: 16 }}>
          Esta vacante no esta disponible para nuevas postulaciones.
        </p>
      )}
    </main>
  );
}
