'use client';

import { Form, Input, Checkbox, Button, Upload, message } from 'antd';
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
}

interface VacanteDetalle {
  id: number;
  titulo: string;
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

export default function AplicarPage({ params }: { params: { id: string } }) {
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
      formData.append('aceptoTerminos', values.aceptoTerminos ? 'true' : 'false');

      (vacante?.documentosRequeridos || []).forEach((doc) => {
        const field = values[`doc_${doc.id}`] as UploadFile[] | undefined;
        const file = field?.[0]?.originFileObj as File | Blob | undefined;
        if (file) {
          formData.append(`doc_${doc.id}`, file);
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
    const detalles: string[] = [];

    if (meta.caraCedula) {
      detalles.push(
        `Cara: ${meta.caraCedula === 'FRONTAL' ? 'Frontal' : 'Reverso'}`
      );
    }
    if (meta.tituloNivel) detalles.push(`Nivel: ${meta.tituloNivel}`);
    if (meta.certificadoLaboral) {
      const cert = meta.certificadoLaboral;
      if (cert?.institucion) detalles.push(`Institución: ${cert.institucion}`);
      if (cert?.cargo) detalles.push(`Cargo: ${cert.cargo}`);
      if (cert?.fechaInicio || cert?.fechaFin) {
        detalles.push(
          `Periodo: ${cert?.fechaInicio || 'N/D'} - ${
            cert?.fechaFin || 'Actual'
          }`
        );
      }
    }

    return (
      <Form.Item
        key={doc.id}
        label={
          <>
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
          </>
        }
        name={baseName}
        valuePropName="fileList"
        getValueFromEvent={normalizeUpload}
        rules={
          requerido
            ? [
                {
                  validator: (_rule, value: UploadFile[]) =>
                    value && value.length > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('Este documento es obligatorio'))
                }
              ]
            : []
        }
      >
        <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
          <Button icon={<UploadOutlined />}>Seleccionar PDF</Button>
        </Upload>
      </Form.Item>
    );
  };

  return (
    <main style={{ padding: 24, maxWidth: 700 }}>
      <h1>Aplicar a: {vacante.titulo}</h1>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Nombres" name="nombres" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Apellidos" name="apellidos" rules={[{ required: true }]}>
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
        <Form.Item label="Telefono" name="telefono" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="esDominicano"
          valuePropName="checked"
          rules={[
            {
              validator: (_rule, value) =>
                value ? Promise.resolve() : Promise.reject(new Error('Debes confirmar que eres dominicano'))
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
                value ? Promise.resolve() : Promise.reject(new Error('Debes confirmar que no eres jubilado/pensionado'))
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
                value ? Promise.resolve() : Promise.reject(new Error('Debes aceptar los terminos'))
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
          <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting}>
            Enviar postulacion
          </Button>
        </Form.Item>
      </Form>
    </main>
  );
}
