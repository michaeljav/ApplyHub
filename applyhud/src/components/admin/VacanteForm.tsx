'use client';

import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Switch,
  Divider
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

type DocumentoFormValue = {
  nombre?: string;
  descripcion?: string;
  obligatorio?: boolean;
  extensiones?: string;
  tamanoMaxMB?: number;
  orden?: number;
};

type FormValues = {
  titulo: string;
  requisitos: string;
  beneficios: string;
  periodo: [Dayjs, Dayjs];
  limitePostulantes?: number;
  documentos?: DocumentoFormValue[];
};

type CreatePayload = {
  titulo: string;
  requisitos: string;
  beneficios: string;
  fechaInicio: string;
  fechaFin: string;
  limitePostulantes?: number | null;
  documentosRequeridos: Array<{
    nombre: string;
    descripcion?: string | null;
    obligatorio: boolean;
    extensiones: string[];
    tamanoMaxMB?: number | null;
    orden: number;
  }>;
};

export default function VacanteForm() {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();

  const createMutation = useMutation({
    mutationFn: async (payload: CreatePayload) => {
      const res = await fetch('/api/vacantes/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error ?? 'Error creando la vacante');
      }
      return res.json();
    },
    onSuccess: () => {
      messageApi.success('Vacante creada correctamente');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-vacantes'] });
    },
    onError: (error: Error) => {
      messageApi.error(error.message);
    }
  });

  const initialDocument = useMemo(
    () => [{ obligatorio: true, orden: 1 }] as DocumentoFormValue[],
    []
  );

  const handleSubmit = (values: FormValues) => {
    if (!values.periodo || values.periodo.length !== 2) {
      messageApi.error('Debes seleccionar la fecha de inicio y fin');
      return;
    }

    const [inicio, fin] = values.periodo;

    const documentos =
      values.documentos?.length
        ? values.documentos
            .filter((doc) => doc?.nombre?.trim())
            .map((doc, index) => ({
              nombre: doc.nombre!.trim(),
              descripcion: doc.descripcion?.trim() || null,
              obligatorio: Boolean(doc.obligatorio),
              extensiones: doc.extensiones
                ? doc.extensiones
                    .split(',')
                    .map((ext) => ext.trim().toLowerCase())
                    .filter(Boolean)
                : [],
              tamanoMaxMB:
                typeof doc.tamanoMaxMB === 'number' ? doc.tamanoMaxMB : null,
              orden:
                typeof doc.orden === 'number' ? doc.orden : index + 1
            }))
        : [];

    const payload: CreatePayload = {
      titulo: values.titulo.trim(),
      requisitos: values.requisitos.trim(),
      beneficios: values.beneficios.trim(),
      fechaInicio: inicio.toISOString(),
      fechaFin: fin.toISOString(),
      limitePostulantes:
        typeof values.limitePostulantes === 'number'
          ? values.limitePostulantes
          : null,
      documentosRequeridos: documentos
    };

    createMutation.mutate(payload);
  };

  return (
    <>
      {contextHolder}
      <Card
        title="Crear nueva vacante"
        style={{ marginTop: 24 }}
      >
        <Form<FormValues>
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{
            documentos: initialDocument
          }}
        >
          <Form.Item
            label="Título"
            name="titulo"
            rules={[{ required: true, message: 'Ingresa un título' }]}
          >
            <Input placeholder="Ej. Analista de datos" />
          </Form.Item>

          <Form.Item
            label="Requisitos"
            name="requisitos"
            rules={[{ required: true, message: 'Ingresa los requisitos' }]}
          >
            <Input.TextArea rows={3} placeholder="Describe los requisitos mínimos" />
          </Form.Item>

          <Form.Item
            label="Beneficios"
            name="beneficios"
            rules={[{ required: true, message: 'Ingresa los beneficios' }]}
          >
            <Input.TextArea rows={3} placeholder="Describe los beneficios ofrecidos" />
          </Form.Item>

          <Form.Item
            label="Periodo de publicación"
            name="periodo"
            rules={[{ required: true, message: 'Selecciona el periodo' }]}
          >
            <DatePicker.RangePicker
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Límite de postulantes (opcional)"
            name="limitePostulantes"
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="Ej. 100"
            />
          </Form.Item>

          <Divider>Documentos requeridos</Divider>

          <Form.List name="documentos">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`Documento ${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <MinusCircleOutlined
                          onClick={() => remove(field.name)}
                        />
                      ) : null
                    }
                  >
                    <Form.Item
                      label="Nombre"
                      name={[field.name, 'nombre']}
                      fieldKey={[field.fieldKey, 'nombre']}
                      rules={[{ required: true, message: 'Nombre del documento requerido' }]}
                    >
                      <Input placeholder="Ej. Hoja de vida" />
                    </Form.Item>

                    <Form.Item
                      label="Descripción"
                      name={[field.name, 'descripcion']}
                      fieldKey={[field.fieldKey, 'descripcion']}
                    >
                      <Input placeholder="Detalle opcional" />
                    </Form.Item>

                    <Form.Item
                      label="Extensiones permitidas (coma separadas)"
                      name={[field.name, 'extensiones']}
                      fieldKey={[field.fieldKey, 'extensiones']}
                    >
                      <Input placeholder="Ej. pdf,jpg" />
                    </Form.Item>

                    <Form.Item
                      label="Tamaño máximo (MB)"
                      name={[field.name, 'tamanoMaxMB']}
                      fieldKey={[field.fieldKey, 'tamanoMaxMB']}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label="Orden"
                      name={[field.name, 'orden']}
                      fieldKey={[field.fieldKey, 'orden']}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      label="Obligatorio"
                      name={[field.name, 'obligatorio']}
                      fieldKey={[field.fieldKey, 'obligatorio']}
                      valuePropName="checked"
                    >
                      <Switch defaultChecked={index === 0} />
                    </Form.Item>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() =>
                    add({ obligatorio: true, orden: fields.length + 1 })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  Añadir documento
                </Button>
              </Space>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
            >
              Crear vacante
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
