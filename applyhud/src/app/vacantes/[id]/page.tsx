import { Vacante, VacanteDocumento } from '@prisma/client';
import dayjs from 'dayjs';
import { getBaseUrl } from '@/lib/baseUrl';
import ApplyWarningLink from '@/components/vacantes/ApplyWarningLink';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  certificadoLaboral?: {
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

  const estadoActual = !vacante.activa
    ? 'Inactiva'
    : limiteAlcanzado
    ? 'Cupo completo'
    : dentroDeFechas
    ? 'Abierta'
    : 'Fuera de fechas';

  const estadoColor =
    estadoActual === 'Abierta'
      ? '#237804'
      : estadoActual === 'Cupo completo'
      ? '#ad4e00'
      : '#b02a37';

  const infoItems = [
    {
      label: 'Publicacion',
      value: `${inicio.format('DD/MM/YYYY')} - ${fin.format('DD/MM/YYYY')}`
    },
    {
      label: 'Estado',
      value: estadoActual,
      highlight: estadoColor
    },
    {
      label: 'Limite de postulantes',
      value: vacante.limitePostulantes
        ? `${vacante._count.postulaciones}/${vacante.limitePostulantes}`
        : `${vacante._count.postulaciones} postulantes`
    }
  ];

  return (
    <main
      style={{
        padding: '32px 16px 48px',
        backgroundColor: '#f5f7fb',
        minHeight: '100vh'
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
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
            marginBottom: 24
          }}
        >
          Importante: solo puedes aplicar a una vacante a la vez. Revisa los
          detalles antes de continuar.
        </div>

        <section
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
            border: '1px solid #eff0f4',
            marginBottom: 32
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginBottom: 24
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#6c757d',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              Vacante #{vacante.id}
            </span>
            <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.25 }}>
              {vacante.titulo}
            </h1>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: `${estadoColor}1a`,
                color: estadoColor,
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 999
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: estadoColor,
                  display: 'inline-block'
                }}
              />
              {estadoActual}
            </div>
          </div>

          {vacante.pdfInformativoNombre && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                backgroundColor: '#f0f5ff',
                border: '1px solid #d6e4ff',
                marginBottom: 24
              }}
            >
              <strong>Material adicional:</strong>{' '}
              <a
                href={`/api/vacantes/${vacante.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Descargar {vacante.pdfInformativoNombre}
              </a>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16
            }}
          >
            {infoItems.map((item) => (
              <div
                key={item.label}
                style={{
                  backgroundColor: '#f8f9fb',
                  borderRadius: 12,
                  padding: '16px 18px',
                  border: '1px solid #eef0f4'
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    color: '#8c8c8c',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 16,
                    fontWeight: 600,
                    color: item.highlight || '#1f1f1f'
                  }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            marginBottom: 32
          }}
        >
          {[
            { title: 'Requisitos minimos', content: vacante.requisitos },
            { title: 'Beneficios', content: vacante.beneficios }
          ].map((block) => (
            <article
              key={block.title}
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 24,
                border: '1px solid #eff0f4',
                boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)'
              }}
            >
              <h2 style={{ marginTop: 0 }}>{block.title}</h2>
              <p style={{ whiteSpace: 'pre-line', color: '#4a4a4a' }}>
                {block.content}
              </p>
            </article>
          ))}
        </section>

        <section
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 28,
            border: '1px solid #eff0f4',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
            marginBottom: 32
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>
            Documentos requeridos
          </h2>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
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
                    detalles.push(`Institucion: ${cert.institucion}`);
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
                  <li
                    key={doc.id}
                    style={{
                      border: '1px solid #eef1f6',
                      borderRadius: 12,
                      padding: '16px 18px',
                      backgroundColor: '#fafbff'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        alignItems: 'center'
                      }}
                    >
                      <strong style={{ fontSize: 16 }}>{doc.nombre}</strong>
                      <span
                        style={{
                          fontSize: 12,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 600,
                          color: doc.obligatorio ? '#c41d7f' : '#7cb305'
                        }}
                      >
                        {doc.obligatorio ? 'Obligatorio' : 'Opcional'}
                      </span>
                    </div>
                    {descripcion.texto && (
                      <p style={{ margin: '8px 0 0', color: '#4a4a4a' }}>
                        {descripcion.texto}
                      </p>
                    )}
                    {extras.length > 0 && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#6c757d',
                          marginTop: 8
                        }}
                      >
                        {extras.join(' | ')}
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>

        {puedeAplicar ? (
          <div style={{ textAlign: 'center' }}>
            <ApplyWarningLink vacanteId={vacante.id} />
          </div>
        ) : (
          <p style={{ color: '#b02a37', marginTop: 16, textAlign: 'center' }}>
            Esta vacante no esta disponible para nuevas postulaciones.
          </p>
        )}
      </div>
    </main>
  );
}
