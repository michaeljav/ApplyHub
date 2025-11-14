'use client';

import {
  Form,
  Input,
  Checkbox,
  Button,
  Upload,
  message,
  Select,
  DatePicker
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
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

  const onFinish = async (values: any) => {
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

  if (loading || !vacante) {
    return <main style={{ padding: 24 }}>Cargando...</main>;
  }

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
                label="Estado"
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
      <section key={doc.id} style={{ marginBottom: 24 }}>
        {header}
        <div>{content}</div>
      </section>
    );
  };
  return (
    <main style={{ padding: 24, maxWidth: 700 }}>
      <h1>Aplicar a: {vacante.titulo}</h1>
      {vacante.pdfInformativoNombre && (
        <p style={{ marginBottom: 16 }}>
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
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Nombres" name="nombres" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          label="Apellidos"
          name="apellidos"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Cedula" name="cedula" rules={[{ required: true }]}>
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
                  : Promise.reject(new Error('Debes aceptar los terminos'))
            }
          ]}
        >
          <Checkbox>Acepto los terminos y condiciones del proceso</Checkbox>
        </Form.Item>

        <h3>Documentos</h3>
        {vacante.documentosRequeridos
          .sort((a, b) => a.orden - b.orden)
          .map((doc) => renderDocumentoCampos(doc))}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            disabled={submitting}
          >
            Enviar postulacion
          </Button>
        </Form.Item>
      </Form>
    </main>
  );
}
