'use client';

import { Form, Input, Checkbox, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function AplicarPage({ params }: { params: { id: string } }) {
  const [vacante, setVacante] = useState<VacanteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/vacantes/${params.id}`)
      .then((r) => r.json())
      .then((data) => setVacante(data))
      .finally(() => setLoading(false));
  }, [params.id]);

  const onFinish = async (values: any) => {
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
        const field = values[`doc_${doc.id}`];
        if (field && field.file) {
          formData.append(`doc_${doc.id}`, field.file.originFileObj);
          formData.append(`doc_${doc.id}_nombreLogico`, doc.nombre);
        }
      });

      const res = await fetch('/api/postulaciones', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Error al enviar la postulación');
      }

      message.success('Postulación enviada correctamente');
      router.push('/vacantes');
    } catch (e: any) {
      message.error(e.message);
    }
  };

  if (loading || !vacante) return <main style={{ padding: 24 }}>Cargando...</main>;

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
        <Form.Item label="Cédula" name="cedula" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Correo electrónico" name="email" rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Teléfono" name="telefono" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="esDominicano" valuePropName="checked" rules={[{ validator:(_, v)=> v ? Promise.resolve() : Promise.reject('Debe confirmar que es dominicano') }]}>
          <Checkbox>Soy dominicano</Checkbox>
        </Form.Item>
        <Form.Item name="noJubilado" valuePropName="checked" rules={[{ validator:(_, v)=> v ? Promise.resolve() : Promise.reject('Debe confirmar que no es jubilado/pensionado') }]}>
          <Checkbox>No soy jubilado ni pensionado del Estado</Checkbox>
        </Form.Item>
        <Form.Item name="aceptoTerminos" valuePropName="checked" rules={[{ validator:(_, v)=> v ? Promise.resolve() : Promise.reject('Debe aceptar los términos') }]}>
          <Checkbox>Acepto los términos y condiciones del proceso</Checkbox>
        </Form.Item>

        <h3>Documentos</h3>
        {vacante.documentosRequeridos
          .sort((a, b) => a.orden - b.orden)
          .map((doc) => (
            <Form.Item
              key={doc.id}
              label={`${doc.nombre} ${doc.obligatorio ? '(Obligatorio)' : '(Opcional)'}`}
              name={`doc_${doc.id}`}
              rules={doc.obligatorio ? [{ required: true, message: 'Este documento es obligatorio' }] : []}
            >
              <Upload beforeUpload={() => false} maxCount={1}>
                <Button icon={<UploadOutlined />}>Seleccionar archivo</Button>
              </Upload>
            </Form.Item>
          ))}

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Enviar postulación
          </Button>
        </Form.Item>
      </Form>
    </main>
  );
}
