'use client';

import {
  Form,
  Input,
  Checkbox,
  Button,
  Upload,
  message,
  Select,
  DatePicker,
  Modal
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';

type DocumentoTipo =
  | 'CEDULA'
  | 'CURRICULUM'
  | 'TITULO'
  | 'CERTIFICADO_LABORAL'
  | 'OTRO';

type CaraCedula = 'FRONTAL' | 'REVERSO';

interface DocumentoMeta {
  texto?: string;
  tipoDocumento?: DocumentoTipo;
  caraCedula?: CaraCedula | null;
  tituloNivel?: string | null;
  certificadoLaboral?: {
    institucion?: string;
    cargo?: string;
    fechaInicio?: string | null;
    fechaFin?: string | null;
  } | null;
}

interface VacanteDocumento {
  id: number;
  nombre: string;
  descripcion: string | null;
  obligatorio: boolean;
  orden: number;
  tipoDocumento: DocumentoTipo;
}

interface VacanteDetalle {
  id: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  pdfInformativoNombre: string | null;
  pdfInformativoArchivo: string | null;
  documentosRequeridos: VacanteDocumento[];
}

const normalizeUpload = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList ?? [];
};

const parseDocumentoMeta = (descripcion: string | null): DocumentoMeta => {
  if (!descripcion) return {};
  try {
    const parsed = JSON.parse(descripcion);
    if (parsed && typeof parsed === 'object') {
      return parsed as DocumentoMeta;
    }
    return {};
  } catch {
    return {};
  }
};

const ACCEPT_PDF = '.pdf';
const ACCEPT_PDF_AND_IMAGES = '.pdf,.png,.jpg,.jpeg,.webp';
const TITULO_GRADOS = [
  'Secundario',
  'Tecnico',
  'Certificacion',
  'Universitario',
  'Post-grado',
  'Maestria',
  'Doctorado'
];
const TITULO_ESTADOS = [
  { label: 'Si', value: 'SI' },
  { label: 'No', value: 'NO' },
  { label: 'En curso', value: 'EN_CURSO' }
];
const GRID_STYLES = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
} as const;

const SINGLE_APPLICATION_WARNING =
  'Solo puedes aplicar a una vacante a la vez. Completa tu proceso actual antes de iniciar uno nuevo.';
const HUMAN_CONFIRMATION_TEXT = 'SOY HUMANO';
const CARD_STYLE = {
  backgroundColor: '#fff',
  borderRadius: 16,
  border: '1px solid #eff0f4',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)'
} as const;

export default function AplicarPage({ params }: { params: { id: string } }) {
  const [form] = Form.useForm();
  const [vacante, setVacante] = useState<VacanteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/vacantes/${params.id}`)
      .then((r) => r.json())
      .then((data) => setVacante(data))
      .finally(() => setLoading(false));
  }, [params.id]);

  const submitApplication = async (values: any) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vacanteId', params.id);
      formData.append('nombres', values.nombres);
      formData.append('apellidos', values.apellidos);
      formData.append('cedula', values.cedula);
      formData.append('email', values.email);
      formData.append('telefono', values.telefono);
      formData.append('esDominicano', values.esDominicano ? 'true' : 'false');
      formData.append('noJubilado', values.noJubilado ? 'true' : 'false');
      formData.append(
        'aceptoTerminos',
        values.aceptoTerminos ? 'true' : 'false'
      );
      formData.append(
        'humanCheck',
        values.humanCheck ? String(values.humanCheck).trim() : ''
      );
      formData.append(
        'website',
        values.website ? String(values.website).trim() : ''
      );

      const extractFile = (lista?: UploadFile[]) =>
        lista?.[0]?.originFileObj as File | Blob | undefined;

      const appendFile = (key: string, lista?: UploadFile[]) => {
        const file = extractFile(lista);
        if (file) {
          formData.append(key, file);
          return true;
        }
        return false;
      };

      const formatDateValue = (value: unknown) => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (
          typeof value === 'object' &&
          value !== null &&
          'format' in value &&
          typeof (value as any).format === 'function'
        ) {
          try {
            return (value as { format: (pattern: string) => string }).format(
              'YYYY-MM-DD'
            );
          } catch {
            return '';
          }
        }
        return '';
      };

      (vacante?.documentosRequeridos || []).forEach((doc) => {
        const baseName = `doc_${doc.id}`;
        const grupo = values[baseName] || {};
        switch (doc.tipoDocumento) {
          case 'CEDULA': {
            appendFile(`${baseName}_frontal`, grupo.frontal);
            appendFile(`${baseName}_reverso`, grupo.reverso);
            break;
          }
          case 'CURRICULUM': {
            appendFile(`${baseName}_archivo`, grupo.archivo);
            break;
          }
          case 'TITULO': {
            if (grupo.grado) {
              formData.append(`${baseName}_grado`, String(grupo.grado));
            }
            if (grupo.graduado) {
              formData.append(`${baseName}_graduado`, String(grupo.graduado));
            }
            if (grupo.nombre) {
              formData.append(
                `${baseName}_nombre`,
                String(grupo.nombre).trim()
              );
            }
            appendFile(`${baseName}_archivo`, grupo.archivo);
            break;
          }
          case 'CERTIFICADO_LABORAL': {
            if (grupo.institucion) {
              formData.append(
                `${baseName}_institucion`,
                String(grupo.institucion).trim()
              );
            }
            if (grupo.cargo) {
              formData.append(`${baseName}_cargo`, String(grupo.cargo).trim());
            }
            const fechaInicio = formatDateValue(grupo.fechaInicio);
            if (fechaInicio) {
              formData.append(`${baseName}_fechaInicio`, fechaInicio);
            }
            const fechaFin = formatDateValue(grupo.fechaFin);
            if (fechaFin) {
              formData.append(`${baseName}_fechaFin`, fechaFin);
            }
            appendFile(`${baseName}_archivo`, grupo.archivo);
            break;
          }
          default: {
            appendFile(`${baseName}_archivo`, grupo.archivo);
            break;
          }
        }
      });

      const res = await fetch('/api/postulaciones', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Error al enviar la postulacion');
      }

      message.success('Postulacion enviada correctamente');
      router.push('/vacantes');
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = (values: any) => {
    Modal.confirm({
      title: 'Aviso importante',
      content: SINGLE_APPLICATION_WARNING,
      okText: 'Enviar postulacion',
      cancelText: 'Cancelar',
      centered: true,
      onOk: () => submitApplication(values)
    });
  };

  if (loading || !vacante) {
    return <main style={{ padding: 24 }}>Cargando...</main>;
  }

  const inicio = dayjs(vacante.fechaInicio);
  const fin = dayjs(vacante.fechaFin);

  const renderDocumentoCampos = (doc: VacanteDocumento) => {
    const meta = parseDocumentoMeta(doc.descripcion);
    const baseName = `doc_${doc.id}`;
    const requerido = doc.obligatorio;
    const tipo = doc.tipoDocumento || 'OTRO';
    const detalles: string[] = [];

    if (meta.caraCedula) {
      detalles.push(
        `Cara: ${meta.caraCedula === 'FRONTAL' ? 'Frontal' : 'Reverso'}`
      );
    }
    if (meta.tituloNivel) detalles.push(`Nivel: ${meta.tituloNivel}`);
    if (meta.certificadoLaboral) {
      const cert = meta.certificadoLaboral;
      if (cert?.institucion) detalles.push(`Institucion: ${cert.institucion}`);
      if (cert?.cargo) detalles.push(`Cargo: ${cert.cargo}`);
      if (cert?.fechaInicio || cert?.fechaFin) {
        detalles.push(
          `Periodo: ${cert?.fechaInicio || 'N/D'} - ${
            cert?.fechaFin || 'Actual'
          }`
        );
      }
    }

    const hasFiles = (value?: UploadFile[]) =>
      Array.isArray(value) && value.length > 0;

    const getGrupoValor = () =>
      (form.getFieldValue([baseName]) as Record<string, any>) || {};

    const uploadRules = (
      message: string,
      forceRequired = requerido,
      shouldCheckGroup?: () => boolean
    ) => [
      {
        validator: (_rule: any, value: UploadFile[]) => {
          const shouldRequire =
            forceRequired || (shouldCheckGroup ? shouldCheckGroup() : false);
          if (!shouldRequire) return Promise.resolve();
          return hasFiles(value)
            ? Promise.resolve()
            : Promise.reject(new Error(message));
        }
      }
    ];

    const stringRules = (
      message: string,
      forceRequired = requerido,
      shouldCheckGroup?: () => boolean
    ) => [
      {
        validator: (_rule: any, value?: any) => {
          const shouldRequire =
            forceRequired || (shouldCheckGroup ? shouldCheckGroup() : false);
          if (!shouldRequire) return Promise.resolve();
          const hasContent =
            typeof value === 'string'
              ? value.trim().length > 0
              : Boolean(value);
          return hasContent
            ? Promise.resolve()
            : Promise.reject(new Error(message));
        }
      }
    ];

    const renderSingleUpload = (
      label: string,
      accept = ACCEPT_PDF,
      rulesOverride = uploadRules('Este documento es obligatorio')
    ) => (
      <Form.Item
        label={label}
        name={[baseName, 'archivo']}
        valuePropName="fileList"
        getValueFromEvent={normalizeUpload}
        rules={rulesOverride}
      >
        <Upload beforeUpload={() => false} maxCount={1} accept={accept}>
          <Button icon={<UploadOutlined />}>Seleccionar archivo</Button>
        </Upload>
      </Form.Item>
    );

    const header = (
      <div style={{ marginBottom: 8 }}>
        <strong>
          {doc.nombre} {requerido ? '(Obligatorio)' : '(Opcional)'}
        </strong>
        {(meta.texto || detalles.length > 0) && (
          <p style={{ margin: '4px 0 0' }}>
            {meta.texto}
            {detalles.length > 0 && (
              <>
                {meta.texto ? ' - ' : ''}
                {detalles.join(' | ')}
              </>
            )}
          </p>
        )}
      </div>
    );

    const cedulaRules = (lado: 'frontal' | 'reverso') => [
      {
        validator: (_rule: any, value: UploadFile[]) => {
          const otroLado =
            form.getFieldValue([
              baseName,
              lado === 'frontal' ? 'reverso' : 'frontal'
            ]) || [];
          const tieneActual = hasFiles(value);
          const tieneOtro = hasFiles(otroLado);

          if (!tieneActual && !tieneOtro) {
            return requerido
              ? Promise.reject(
                  new Error('Debes adjuntar ambas caras de la cedula')
                )
              : Promise.resolve();
          }

          if (tieneActual && tieneOtro) return Promise.resolve();

          return Promise.reject(
            new Error('Debes adjuntar ambas caras de la cedula')
          );
        }
      }
    ];

    const hasTituloInput = () => {
      const grupo = getGrupoValor();
      return (
        hasFiles(grupo?.archivo) ||
        Boolean(grupo?.grado) ||
        Boolean(grupo?.graduado) ||
        Boolean(grupo?.nombre)
      );
    };

    const hasCertInput = () => {
      const grupo = getGrupoValor();
      return (
        hasFiles(grupo?.archivo) ||
        Boolean(grupo?.institucion) ||
        Boolean(grupo?.cargo) ||
        Boolean(grupo?.fechaInicio) ||
        Boolean(grupo?.fechaFin)
      );
    };

    let content: JSX.Element | JSX.Element[] = renderSingleUpload('Archivo');

    switch (tipo) {
      case 'CEDULA':
        content = (
          <div style={GRID_STYLES}>
            <Form.Item
              label="Cedula frontal"
              name={[baseName, 'frontal']}
              valuePropName="fileList"
              getValueFromEvent={normalizeUpload}
              dependencies={[[baseName, 'reverso']]}
              rules={cedulaRules('frontal')}
            >
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept={ACCEPT_PDF_AND_IMAGES}
              >
                <Button icon={<UploadOutlined />}>Subir frontal</Button>
              </Upload>
            </Form.Item>
            <Form.Item
              label="Cedula reverso"
              name={[baseName, 'reverso']}
              valuePropName="fileList"
              getValueFromEvent={normalizeUpload}
              dependencies={[[baseName, 'frontal']]}
              rules={cedulaRules('reverso')}
            >
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept={ACCEPT_PDF_AND_IMAGES}
              >
                <Button icon={<UploadOutlined />}>Subir reverso</Button>
              </Upload>
            </Form.Item>
          </div>
        );
        break;
      case 'CURRICULUM':
        content = renderSingleUpload(
          'Curriculum (PDF)',
          ACCEPT_PDF,
          uploadRules('Adjunta tu curriculum')
        );
        break;
      case 'TITULO':
        content = (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={GRID_STYLES}>
              <Form.Item
                label="Grado alcanzado"
                name={[baseName, 'grado']}
                rules={stringRules(
                  'Selecciona el grado alcanzado',
                  requerido,
                  hasTituloInput
                )}
              >
                <Select
                  options={TITULO_GRADOS.map((grado) => ({
                    label: grado,
                    value: grado
                  }))}
                  placeholder="Selecciona el grado"
                />
              </Form.Item>
              <Form.Item
                label="Graduado"
                name={[baseName, 'graduado']}
                rules={stringRules(
                  'Indica si estas graduado',
                  requerido,
                  hasTituloInput
                )}
              >
                <Select
                  options={TITULO_ESTADOS}
                  placeholder="Selecciona el estado"
                />
              </Form.Item>
            </div>
            <Form.Item
              label="Nombre del titulo"
              name={[baseName, 'nombre']}
              rules={stringRules(
                'Escribe el nombre del titulo',
                requerido,
                hasTituloInput
              )}
            >
              <Input placeholder="Ej. Ingenieria en Sistemas" />
            </Form.Item>
            {renderSingleUpload(
              'Archivo del titulo',
              ACCEPT_PDF_AND_IMAGES,
              uploadRules(
                'Adjunta el archivo del titulo',
                requerido,
                hasTituloInput
              )
            )}
          </div>
        );
        break;
      case 'CERTIFICADO_LABORAL':
        content = (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={GRID_STYLES}>
              <Form.Item
                label="Institucion o empresa"
                name={[baseName, 'institucion']}
                rules={stringRules(
                  'Indica la institucion o empresa',
                  requerido,
                  hasCertInput
                )}
              >
                <Input placeholder="Nombre de la empresa o institucion" />
              </Form.Item>
              <Form.Item
                label="Cargo desempenado"
                name={[baseName, 'cargo']}
                rules={stringRules(
                  'Describe el cargo',
                  requerido,
                  hasCertInput
                )}
              >
                <Input placeholder="Ej. Analista contable" />
              </Form.Item>
            </div>
            <div style={GRID_STYLES}>
              <Form.Item
                label="Fecha de inicio"
                name={[baseName, 'fechaInicio']}
                rules={stringRules(
                  'Selecciona la fecha de inicio',
                  requerido,
                  hasCertInput
                )}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item
                label="Fecha de finalizacion"
                name={[baseName, 'fechaFin']}
                rules={stringRules(
                  'Selecciona la fecha de finalizacion',
                  requerido,
                  hasCertInput
                )}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </div>
            {renderSingleUpload(
              'Certificado laboral',
              ACCEPT_PDF_AND_IMAGES,
              uploadRules(
                'Adjunta el certificado laboral',
                requerido,
                hasCertInput
              )
            )}
          </div>
        );
        break;
      default:
        content = renderSingleUpload(
          'Archivo',
          ACCEPT_PDF,
          uploadRules('Este documento es obligatorio')
        );
        break;
    }

    return (
      <section
        key={doc.id}
        style={{
          ...CARD_STYLE,
          padding: 20,
          marginBottom: 24
        }}
      >
        {header}
        <div style={{ marginTop: 12 }}>{content}</div>
      </section>
    );
  };
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
          {SINGLE_APPLICATION_WARNING}
        </div>

        <section
          style={{
            ...CARD_STYLE,
            padding: 32,
            marginBottom: 32
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6c757d'
            }}
          >
            Proceso de aplicacion
          </span>
          <h1 style={{ margin: '8px 0 12px', fontSize: 30 }}>
            Aplica a: {vacante.titulo}
          </h1>
          <p style={{ color: '#4a4a4a', marginBottom: 24 }}>
            Completa el formulario con tus datos personales y adjunta la
            documentacion solicitada para participar en este proceso de
            seleccion.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16
            }}
          >
            <div
              style={{
                backgroundColor: '#f8f9fb',
                borderRadius: 12,
                padding: 16,
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
                Codigo de vacante
              </p>
              <p style={{ margin: '6px 0 0', fontWeight: 600 }}>
                #{vacante.id}
              </p>
            </div>
            <div
              style={{
                backgroundColor: '#f8f9fb',
                borderRadius: 12,
                padding: 16,
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
                Periodo
              </p>
              <p style={{ margin: '6px 0 0', fontWeight: 600 }}>
                {inicio.format('DD/MM/YYYY')} - {fin.format('DD/MM/YYYY')}
              </p>
            </div>
          </div>
          {vacante.pdfInformativoNombre && (
            <div
              style={{
                marginTop: 24,
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #d6e4ff',
                backgroundColor: '#f0f5ff'
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
        </section>

        <section
          style={{
            ...CARD_STYLE,
            padding: 32
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Formulario</h2>
          <p style={{ marginTop: 0, color: '#4a4a4a' }}>
            Los campos marcados son obligatorios para validar tu postulacion.
          </p>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            style={{ marginTop: 16 }}
          >
            <Form.Item name="website" style={{ display: 'none' }}>
              <Input tabIndex={-1} autoComplete="off" />
            </Form.Item>

            <div style={GRID_STYLES}>
              <Form.Item
                label="Nombres"
                name="nombres"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Apellidos"
                name="apellidos"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </div>

            <div style={GRID_STYLES}>
              <Form.Item
                label="Cedula"
                name="cedula"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Correo electronico"
                name="email"
                rules={[{ required: true, type: 'email' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Telefono"
                name="telefono"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                marginTop: 8
              }}
            >
              <Form.Item
                name="esDominicano"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_rule, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error('Debes confirmar que eres dominicano')
                          )
                  }
                ]}
              >
                <Checkbox>Soy dominicano</Checkbox>
              </Form.Item>
              <Form.Item
                name="noJubilado"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_rule, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              'Debes confirmar que no eres jubilado/pensionado'
                            )
                          )
                  }
                ]}
              >
                <Checkbox>No soy jubilado ni pensionado del Estado</Checkbox>
              </Form.Item>
              <Form.Item
                name="aceptoTerminos"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_rule, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error('Debes aceptar los terminos')
                          )
                  }
                ]}
              >
                <Checkbox>
                  Acepto los terminos y condiciones del proceso
                </Checkbox>
              </Form.Item>
            </div>

            <Form.Item
              label="Verificacion anti-robot"
              name="humanCheck"
              rules={[
                {
                  validator: (_rule, value) => {
                    if (
                      typeof value === 'string' &&
                      value.trim().toUpperCase() === HUMAN_CONFIRMATION_TEXT
                    ) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        `Escribe exactamente "${HUMAN_CONFIRMATION_TEXT}" para continuar`
                      )
                    );
                  }
                }
              ]}
              extra={`Escribe la frase "${HUMAN_CONFIRMATION_TEXT}" para confirmar que eres una persona.`}
              style={{ marginTop: 16 }}
            >
              <Input
                placeholder={`Escribe: ${HUMAN_CONFIRMATION_TEXT}`}
                autoComplete="off"
              />
            </Form.Item>

            <div style={{ marginTop: 32 }}>
              <h3 style={{ marginBottom: 16 }}>Documentos requeridos</h3>
              {vacante.documentosRequeridos
                .sort((a, b) => a.orden - b.orden)
                .map((doc) => renderDocumentoCampos(doc))}
            </div>

            <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                disabled={submitting}
                style={{
                  minWidth: 220,
                  height: 44,
                  fontSize: 16,
                  fontWeight: 600
                }}
              >
                Enviar postulacion
              </Button>
            </Form.Item>
          </Form>
        </section>
      </div>
    </main>
  );
}
