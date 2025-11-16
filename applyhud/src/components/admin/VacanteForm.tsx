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
  Divider,
  Select,
  Upload,
  Checkbox
} from 'antd';
import {
  MinusCircleOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';

type DocumentoTipo =
  | 'CEDULA'
  | 'CURRICULUM'
  | 'TITULO'
  | 'CERTIFICADO_LABORAL'
  | 'OTRO';

type DocumentoFormValue = {
  nombre?: string;
  descripcion?: string;
  obligatorio?: boolean;
  orden?: number;
  tipoDocumento?: DocumentoTipo;
};

type VacanteDocumentoData = {
  id: number;
  nombre: string;
  descripcion: string | null;
  obligatorio: boolean;
  orden: number;
  tipoDocumento: DocumentoTipo;
};

type VacanteDetalle = {
  id: number;
  titulo: string;
  requisitos: string;
  beneficios: string;
  fechaInicio: string;
  fechaFin: string;
  limitePostulantes: number | null;
  pdfInformativoNombre: string | null;
  pdfInformativoArchivo: string | null;
  documentosRequeridos: VacanteDocumentoData[];
};

const DEFAULT_TEMPLATE_DOCS: DocumentoFormValue[] = [
  {
    tipoDocumento: 'CEDULA',
    obligatorio: true,
    orden: 1
  },
  {
    tipoDocumento: 'CURRICULUM',
    obligatorio: true,
    orden: 2
  },
  {
    tipoDocumento: 'TITULO',
    obligatorio: true,
    orden: 3
  },
  {
    tipoDocumento: 'CERTIFICADO_LABORAL',
    obligatorio: false,
    orden: 4
  }
];

const DOCUMENTO_OPTIONS: { label: string; value: DocumentoTipo }[] = [
  { label: 'Cédula', value: 'CEDULA' },
  { label: 'Currículum', value: 'CURRICULUM' },
  { label: 'Título', value: 'TITULO' },
  { label: 'Certificado laboral', value: 'CERTIFICADO_LABORAL' },
  { label: 'Otro', value: 'OTRO' }
];

const createEmptyDoc = (orden = 1): DocumentoFormValue => ({
  obligatorio: orden === 1,
  orden,
  tipoDocumento: 'OTRO'
});

const normalizeDocForForm = (
  doc: DocumentoFormValue,
  index: number
): DocumentoFormValue => ({
  ...createEmptyDoc(index + 1),
  ...doc,
  orden: doc.orden ?? index + 1,
  tipoDocumento: doc.tipoDocumento ?? 'OTRO'
});

const buildDefaultDocs = () =>
  DEFAULT_TEMPLATE_DOCS.map((doc, index) => normalizeDocForForm(doc, index));

function readDefaultDocs(): DocumentoFormValue[] {
  return buildDefaultDocs();
}

const nombreAutomatico = (doc: DocumentoFormValue): string => {
  const tipo = doc.tipoDocumento ?? 'OTRO';
  switch (tipo) {
    case 'CEDULA':
      return 'Cédula';
    case 'CURRICULUM':
      return 'Currículum';
    case 'TITULO':
      return 'Título';
    case 'CERTIFICADO_LABORAL':
      return 'Certificado laboral';
    default:
      return doc.nombre?.trim() || 'Documento';
  }
};

const normalizeUpload = (e: any) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList ?? [];
};

type FormValues = {
  codigo?: number;
  titulo: string;
  requisitos: string;
  beneficios: string;
  periodo: [Dayjs, Dayjs];
  limitePostulantes?: number;
  documentos?: DocumentoFormValue[];
  pdfInformativo?: UploadFile[];
  eliminarPdfInformativo?: boolean;
};

type SavePayload = {
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
    orden: number;
    tipoDocumento: DocumentoTipo;
  }>;
};

interface VacanteFormProps {
  onCreated?: () => void;
  onUpdated?: () => void;
  onCancel?: () => void;
  vacante?: VacanteDetalle | null;
  prefill?: VacanteDetalle | null;
}

export default function VacanteForm({
  onCreated,
  onUpdated,
  onCancel,
  vacante,
  prefill
}: VacanteFormProps) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const initialDocs = useMemo(() => readDefaultDocs(), []);
  const [duplicateMode, setDuplicateMode] = useState(false);
  const isPrefillMode = !vacante && Boolean(prefill);
  const isDuplicating = Boolean(vacante) && duplicateMode;
  const isEditMode = Boolean(vacante) && !duplicateMode;
  const cardTitle = isDuplicating
    ? 'Duplicar vacante'
    : isEditMode
    ? 'Editar vacante'
    : isPrefillMode
    ? 'Crear nueva vacante (copia)'
    : 'Crear nueva vacante';
  const submitLabel = isDuplicating
    ? 'Crear copia'
    : isEditMode
    ? 'Guardar cambios'
    : 'Crear vacante';
  const pdfUploads = Form.useWatch('pdfInformativo', form);

  useEffect(() => {
    if (pdfUploads && Array.isArray(pdfUploads) && pdfUploads.length > 0) {
      form.setFieldsValue({ eliminarPdfInformativo: false });
    }
  }, [pdfUploads, form]);

  const fillFormWithVacante = useCallback(
    (source: VacanteDetalle) => {
      const docs = (
        source.documentosRequeridos
          ? [...source.documentosRequeridos].sort((a, b) => a.orden - b.orden)
          : []
      ).map((doc, index) =>
        normalizeDocForForm(
          {
            nombre: doc.nombre,
            descripcion: doc.descripcion ?? undefined,
            obligatorio: doc.obligatorio,
            orden: doc.orden,
            tipoDocumento: doc.tipoDocumento
          },
          index
        )
      );

      form.setFieldsValue({
        codigo: source.id,
        titulo: source.titulo,
        requisitos: source.requisitos,
        beneficios: source.beneficios,
        periodo: [dayjs(source.fechaInicio), dayjs(source.fechaFin)],
        limitePostulantes: source.limitePostulantes ?? undefined,
        documentos: docs.length ? docs : buildDefaultDocs(),
        pdfInformativo: [],
        eliminarPdfInformativo: false
      });
    },
    [form]
  );

  useEffect(() => {
    if (vacante) {
      fillFormWithVacante(vacante);
      setDuplicateMode(false);
    } else if (prefill) {
      const prefillData: VacanteDetalle = {
        ...prefill,
        titulo: prefill.titulo.includes('(copia)')
          ? prefill.titulo
          : `${prefill.titulo} (copia)`
      };
      fillFormWithVacante(prefillData);
      setDuplicateMode(false);
    } else {
      form.resetFields();
      form.setFieldsValue({
        codigo: undefined,
        documentos: buildDefaultDocs()
      });
      setDuplicateMode(false);
    }
  }, [vacante, prefill, fillFormWithVacante, form]);

  const handleStartDuplicate = () => {
    if (!vacante) return;
    const tituloActual = form.getFieldValue('titulo');
    if (tituloActual && !tituloActual.toLowerCase().includes('copia')) {
      form.setFieldsValue({ titulo: `${tituloActual} (copia)` });
    }
    setDuplicateMode(true);
    messageApi.info(
      'Estas creando una copia. Ajusta los campos y guarda para crear una nueva vacante.'
    );
  };

  const handleCancelDuplicate = () => {
    if (!vacante) return;
    setDuplicateMode(false);
    fillFormWithVacante(vacante);
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: SavePayload | FormData) => {
      const url = isEditMode
        ? `/api/vacantes/admin/${vacante?.id}`
        : '/api/vacantes/admin';
      const method = isEditMode ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers:
          payload instanceof FormData
            ? undefined
            : {
                'Content-Type': 'application/json'
              },
        body:
          payload instanceof FormData ? payload : JSON.stringify(payload)
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error ?? 'Error creando la vacante');
      }
      return res.json();
    },
    onSuccess: () => {
      messageApi.success(
        isEditMode
          ? 'Vacante actualizada correctamente'
          : 'Vacante creada correctamente'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-vacantes'] });
      if (isEditMode) {
        form.resetFields();
        onUpdated?.();
      } else {
        const defaults = buildDefaultDocs();
        form.resetFields();
        form.setFieldsValue({ documentos: defaults });
        onCreated?.();
      }
    },
    onError: (error: Error) => {
      messageApi.error(error.message);
    }
  });

  const handleSubmit = (values: FormValues) => {
    if (!values.periodo || values.periodo.length !== 2) {
      messageApi.error('Debes seleccionar la fecha de inicio y fin');
      return;
    }

    const [inicio, fin] = values.periodo;

    const docsFromForm =
      values.documentos
        ?.filter((doc) => doc?.tipoDocumento)
        .map((doc, index) => ({
          ...doc,
          orden: doc.orden ?? index + 1,
          tipoDocumento: doc.tipoDocumento ?? 'OTRO'
        })) ?? [];

    const documentos = docsFromForm.map((doc, index) => ({
      nombre: nombreAutomatico(doc),
      descripcion: doc.descripcion?.trim() || null,
      obligatorio: Boolean(doc.obligatorio),
      orden: typeof doc.orden === 'number' ? doc.orden : index + 1,
      tipoDocumento: doc.tipoDocumento ?? 'OTRO'
    }));

    const payload: SavePayload = {
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

    const pdfFile = values.pdfInformativo?.[0]?.originFileObj as
      | File
      | undefined;
    const removePdf =
      Boolean(values.eliminarPdfInformativo) && Boolean(isEditMode);

    if (pdfFile) {
      form.setFieldsValue({ eliminarPdfInformativo: false });
    }

    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    if (pdfFile) {
      formData.append('pdfInformativo', pdfFile);
    }
    if (removePdf) {
      formData.append('removePdfInformativo', 'true');
    }

    saveMutation.mutate(formData);
  };

  const renderNombreField = (fieldIndex: number) => (
    <Form.Item
      noStyle
      shouldUpdate={(prevValues, currentValues) => {
        const prevTipo =
          prevValues?.documentos?.[fieldIndex]?.tipoDocumento ?? 'OTRO';
        const nextTipo =
          currentValues?.documentos?.[fieldIndex]?.tipoDocumento ?? 'OTRO';
        return prevTipo !== nextTipo;
      }}
    >
      {() => {
        const docValues = (form.getFieldValue(['documentos', fieldIndex]) ||
          {}) as DocumentoFormValue;
        const tipoActual = docValues.tipoDocumento ?? 'OTRO';
        if (tipoActual === 'OTRO') {
          return (
            <Form.Item
              label="Nombre del documento"
              name={[fieldIndex, 'nombre']}
              rules={[
                { required: true, message: 'Ingresa el nombre del documento' }
              ]}
            >
              <Input placeholder="Ej. Certificado médico" />
            </Form.Item>
          );
        }

        return (
          <div style={{ marginBottom: 12, fontSize: 12, color: '#555' }}>
            Nombre automático: {nombreAutomatico(docValues)}
          </div>
        );
      }}
    </Form.Item>
  );

  return (
    <>
      {contextHolder}
      <Card title={cardTitle} style={{ marginTop: 24 }}>
          <Form<FormValues>
            layout="vertical"
            form={form}
            onFinish={handleSubmit}
            initialValues={{ documentos: initialDocs, pdfInformativo: [], eliminarPdfInformativo: false }}
          >
          {(isEditMode || isPrefillMode) && (
            <Form.Item label="Código interno" name="codigo">
              <Input disabled />
            </Form.Item>
          )}

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
            <Input.TextArea
              rows={3}
              placeholder="Describe los requisitos mínimos"
            />
          </Form.Item>

          <Form.Item
            label="Beneficios"
            name="beneficios"
            rules={[{ required: true, message: 'Ingresa los beneficios' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe los beneficios ofrecidos"
            />
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

          <Divider>Material adicional</Divider>
          {isEditMode && vacante?.pdfInformativoNombre && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 8 }}>
                PDF actual:{' '}
                <a
                  href={`/api/vacantes/${vacante.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {vacante.pdfInformativoNombre}
                </a>
              </p>
              <Form.Item
                name="eliminarPdfInformativo"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Eliminar PDF informativo actual</Checkbox>
              </Form.Item>
            </div>
          )}
          <Form.Item
            label="Adjuntar PDF (opcional)"
            name="pdfInformativo"
            valuePropName="fileList"
            getValueFromEvent={normalizeUpload}
            extra="Este archivo estará disponible para que los postulantes lo descarguen."
          >
            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
              <Button icon={<UploadOutlined />}>Seleccionar PDF</Button>
            </Upload>
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
                      label="Tipo de documento"
                      name={[field.name, 'tipoDocumento']}
                      fieldKey={[field.fieldKey ?? field.key, 'tipoDocumento']}
                      rules={[
                        {
                          required: true,
                          message: 'Selecciona el tipo de documento'
                        }
                      ]}
                    >
                      <Select
                        options={DOCUMENTO_OPTIONS}
                        placeholder="Selecciona el tipo"
                      />
                    </Form.Item>

                    {renderNombreField(field.name)}

                    <Form.Item
                      label="Obligatorio"
                      name={[field.name, 'obligatorio']}
                      fieldKey={[field.fieldKey ?? field.key, 'obligatorio']}
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>

                    {/* <Form.Item
                      label={
                        <Space size={4}>
                          <span>Usar como plantilla</span>
                          <Tooltip title="Si está activo, este documento se agregará automáticamente en futuras vacantes">
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      name={[field.name, 'defaultTemplate']}
                      fieldKey={[field.fieldKey ?? field.key, 'defaultTemplate']}
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item> */}
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add(createEmptyDoc(fields.length + 1))}
                  block
                  icon={<PlusOutlined />}
                >
                  Añadir documento
                </Button>
              </Space>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 24 }}>
            <Space wrap>
              <Button
                type="primary"
                htmlType="submit"
                loading={saveMutation.isPending}
              >
                {submitLabel}
              </Button>
              {onCancel && (
                <Button
                  htmlType="button"
                  onClick={onCancel}
                  disabled={saveMutation.isPending}
                >
                  Cancelar
                </Button>
              )}
              {Boolean(vacante) && !duplicateMode && (
                <Button
                  htmlType="button"
                  onClick={handleStartDuplicate}
                  disabled={saveMutation.isPending}
                >
                  Duplicar como nueva
                </Button>
              )}
              {Boolean(vacante) && duplicateMode && (
                <Button
                  htmlType="button"
                  onClick={handleCancelDuplicate}
                  disabled={saveMutation.isPending}
                >
                  Cancelar duplicado
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}


