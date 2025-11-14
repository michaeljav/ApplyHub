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
  Tooltip
} from 'antd';
import {
  MinusCircleOutlined,
  PlusOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';

type DocumentoTipo =
  | 'CEDULA'
  | 'CURRICULUM'
  | 'TITULO'
  | 'CERTIFICADO_LABORAL'
  | 'OTRO';

type CaraCedula = 'FRONTAL' | 'REVERSO';

type DocumentoFormValue = {
  nombre?: string;
  descripcion?: string;
  obligatorio?: boolean;
  extensiones?: string;
  tamanoMaxMB?: number;
  orden?: number;
  tipoDocumento?: DocumentoTipo;
  caraCedula?: CaraCedula;
  tituloNivel?: string;
  institucion?: string;
  cargo?: string;
  fechaInicio?: string;
  fechaFin?: string;
  defaultTemplate?: boolean;
};

const DEFAULT_DOCS_KEY = 'vacante-docs-defaults';

const DEFAULT_TEMPLATE_DOCS: DocumentoFormValue[] = [
  {
    tipoDocumento: 'CEDULA',
    caraCedula: 'FRONTAL',
    extensiones: 'jpg,png,jpeg',
    obligatorio: true,
    defaultTemplate: true,
    orden: 1
  },
  {
    tipoDocumento: 'CEDULA',
    caraCedula: 'REVERSO',
    extensiones: 'jpg,png,jpeg',
    obligatorio: true,
    defaultTemplate: true,
    orden: 2
  },
  {
    tipoDocumento: 'CURRICULUM',
    extensiones: 'pdf',
    obligatorio: true,
    defaultTemplate: true,
    orden: 3
  },
  {
    tipoDocumento: 'TITULO',
    extensiones: 'pdf',
    obligatorio: true,
    defaultTemplate: true,
    nombre: 'Título',
    orden: 4
  },
  {
    tipoDocumento: 'CERTIFICADO_LABORAL',
    extensiones: 'pdf',
    obligatorio: false,
    defaultTemplate: true,
    orden: 5
  }
];

const DOCUMENTO_OPTIONS: { label: string; value: DocumentoTipo }[] = [
  { label: 'Cédula', value: 'CEDULA' },
  { label: 'Currículum', value: 'CURRICULUM' },
  { label: 'Título', value: 'TITULO' },
  { label: 'Certificado laboral', value: 'CERTIFICADO_LABORAL' },
  { label: 'Otro', value: 'OTRO' }
];

const CEDULA_CARAS: { label: string; value: CaraCedula }[] = [
  { label: 'Cédula frontal', value: 'FRONTAL' },
  { label: 'Cédula reverso', value: 'REVERSO' }
];

const TITULO_NIVELES = [
  'Secundario',
  'Técnico',
  'Certificación',
  'Universitario',
  'Post-grado',
  'Maestría',
  'Doctorado'
] as const;

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

const defaultDocKey = (doc: DocumentoFormValue) => {
  const tipo = doc.tipoDocumento ?? 'OTRO';
  if (tipo === 'CEDULA') {
    return `${tipo}:${doc.caraCedula ?? ''}`;
  }
  return tipo;
};

const mergeWithDefaultDocs = (docs: DocumentoFormValue[]) => {
  const merged = [...docs];
  const keys = new Set(
    merged
      .map(defaultDocKey)
      .filter((key) => key !== 'OTRO' && key !== undefined)
  );
  DEFAULT_TEMPLATE_DOCS.forEach((baseDoc) => {
    const key = defaultDocKey(baseDoc);
    if (!keys.has(key)) {
      merged.push(baseDoc);
      keys.add(key);
    }
  });
  return merged.map((doc, index) => normalizeDocForForm(doc, index));
};

function readDefaultDocs(): DocumentoFormValue[] {
  if (typeof window === 'undefined') return buildDefaultDocs();
  const raw = window.localStorage.getItem(DEFAULT_DOCS_KEY);
  if (!raw) return buildDefaultDocs();
  try {
    const parsed = JSON.parse(raw) as DocumentoFormValue[];
    const sanitized = mergeWithDefaultDocs(parsed);
    return sanitized;
  } catch {
    return buildDefaultDocs();
  }
}

function persistDefaultDocs(docs: DocumentoFormValue[]) {
  if (typeof window === 'undefined') return;
  const docsToPersist = docs.length > 0 ? docs : buildDefaultDocs();
  const sanitized = mergeWithDefaultDocs(docsToPersist);
  window.localStorage.setItem(DEFAULT_DOCS_KEY, JSON.stringify(sanitized));
}

const nombreAutomatico = (doc: DocumentoFormValue): string => {
  const tipo = doc.tipoDocumento ?? 'OTRO';
  switch (tipo) {
    case 'CEDULA':
      return `Cédula - ${doc.caraCedula === 'REVERSO' ? 'Reverso' : 'Frontal'}`;
    case 'CURRICULUM':
      return 'Currículum';
    case 'TITULO':
      return doc.tituloNivel ? `Título (${doc.tituloNivel})` : 'Título';
    case 'CERTIFICADO_LABORAL':
      return doc.institucion
        ? `Certificado laboral - ${doc.institucion}`
        : 'Certificado laboral';
    default:
      return doc.nombre?.trim() || 'Documento';
  }
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

interface VacanteFormProps {
  onCreated?: () => void;
}

export default function VacanteForm({ onCreated }: VacanteFormProps) {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const initialDocs = useMemo(() => readDefaultDocs(), []);
  const pendingDefaultsRef = useRef<DocumentoFormValue[]>(initialDocs);

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
      const defaults =
        pendingDefaultsRef.current.length > 0
          ? pendingDefaultsRef.current.map((doc, index) =>
              normalizeDocForForm(doc, index)
            )
          : buildDefaultDocs();
      persistDefaultDocs(defaults);
      form.resetFields();
      form.setFieldsValue({ documentos: defaults });
      queryClient.invalidateQueries({ queryKey: ['admin-vacantes'] });
      onCreated?.();
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

    pendingDefaultsRef.current = docsFromForm.filter(
      (doc) => doc.defaultTemplate
    );

    const documentos = docsFromForm.map((doc, index) => {
      const tipo = doc.tipoDocumento ?? 'OTRO';
      const descripcionPayload = {
        texto: doc.descripcion?.trim() || '',
        tipoDocumento: tipo,
        caraCedula: tipo === 'CEDULA' ? doc.caraCedula ?? 'FRONTAL' : null,
        tituloNivel: tipo === 'TITULO' ? doc.tituloNivel ?? null : null,
        certificadoLaboral:
          tipo === 'CERTIFICADO_LABORAL'
            ? {
                institucion: doc.institucion || '',
                cargo: doc.cargo || '',
                fechaInicio: doc.fechaInicio || null,
                fechaFin: doc.fechaFin || null
              }
            : null
      };

      return {
        nombre: nombreAutomatico(doc),
        descripcion: JSON.stringify(descripcionPayload),
        obligatorio: Boolean(doc.obligatorio),
        extensiones: doc.extensiones
          ? doc.extensiones
              .split(',')
              .map((ext) => ext.trim().toLowerCase())
              .filter(Boolean)
          : [],
        tamanoMaxMB:
          typeof doc.tamanoMaxMB === 'number' ? doc.tamanoMaxMB : null,
        orden: typeof doc.orden === 'number' ? doc.orden : index + 1
      };
    });

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

  const renderNombreField = (fieldIndex: number) => (
    <Form.Item noStyle shouldUpdate>
      {() => {
        const docValues = (form.getFieldValue(['documentos', fieldIndex]) ||
          {}) as DocumentoFormValue;
        const tipoActual = docValues.tipoDocumento ?? 'OTRO';
        if (tipoActual === 'OTRO' || tipoActual === 'TITULO') {
          return (
            <Form.Item
              label="Nombre del documento"
              name={['documentos', fieldIndex, 'nombre']}
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
      <Card title="Crear nueva vacante" style={{ marginTop: 24 }}>
        <Form<FormValues>
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{ documentos: initialDocs }}
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

          <Divider>Documentos requeridos</Divider>

          <Form.List
            name="documentos"
            initialValue={initialDocs?.slice(2) || []}
          >
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
                      fieldKey={[field.fieldKey, 'tipoDocumento']}
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

                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const docValues = (form.getFieldValue([
                          'documentos',
                          field.name
                        ]) || {}) as DocumentoFormValue;
                        const tipoActual = docValues.tipoDocumento ?? 'OTRO';
                        const extensionesActuales =
                          docValues.extensiones?.trim();

                        const ensureExtensiones = (valor: string) => {
                          if (!extensionesActuales) {
                            form.setFields([
                              {
                                name: ['documentos', field.name, 'extensiones'],
                                value: valor
                              }
                            ]);
                          }
                        };

                        if (tipoActual === 'CEDULA') {
                          ensureExtensiones('jpg,png,jpeg');
                        } else if (
                          tipoActual === 'CURRICULUM' ||
                          tipoActual === 'TITULO' ||
                          tipoActual === 'CERTIFICADO_LABORAL'
                        ) {
                          ensureExtensiones('pdf');
                        }

                        return (
                          <>
                            {tipoActual === 'CEDULA' && (
                              <>
                                {!docValues.caraCedula &&
                                  form.setFields([
                                    {
                                      name: [
                                        'documentos',
                                        field.name,
                                        'caraCedula'
                                      ],
                                      value: 'FRONTAL'
                                    }
                                  ])}
                                <Form.Item
                                  label="Cara del documento"
                                  name={[field.name, 'caraCedula']}
                                  fieldKey={[field.fieldKey, 'caraCedula']}
                                  rules={[
                                    {
                                      required: true,
                                      message: 'Selecciona la cara de la cédula'
                                    }
                                  ]}
                                >
                                  <Select
                                    placeholder="Frontal o reverso"
                                    options={CEDULA_CARAS}
                                  />
                                </Form.Item>
                              </>
                            )}

                            {tipoActual === 'TITULO' && (
                              <Form.Item
                                label="Grado alcanzado"
                                name={[field.name, 'tituloNivel']}
                                fieldKey={[field.fieldKey, 'tituloNivel']}
                                rules={[
                                  {
                                    required: true,
                                    message: 'Selecciona el grado del título'
                                  }
                                ]}
                              >
                                <Select
                                  placeholder="Selecciona el nivel"
                                  options={TITULO_NIVELES.map((nivel) => ({
                                    label: nivel,
                                    value: nivel
                                  }))}
                                />
                              </Form.Item>
                            )}

                            {tipoActual === 'CERTIFICADO_LABORAL' && (
                              <>
                                <Form.Item
                                  label="Institución o empresa"
                                  name={[field.name, 'institucion']}
                                  fieldKey={[field.fieldKey, 'institucion']}
                                  rules={[
                                    {
                                      required: true,
                                      message:
                                        'Ingresa la institución o empresa'
                                    }
                                  ]}
                                >
                                  <Input placeholder="Ej. Industrias IAD" />
                                </Form.Item>
                                <Form.Item
                                  label="Cargo desempeñado"
                                  name={[field.name, 'cargo']}
                                  fieldKey={[field.fieldKey, 'cargo']}
                                >
                                  <Input placeholder="Ej. Analista senior" />
                                </Form.Item>
                                <Form.Item
                                  label="Fecha de inicio"
                                  name={[field.name, 'fechaInicio']}
                                  fieldKey={[field.fieldKey, 'fechaInicio']}
                                >
                                  <Input type="date" />
                                </Form.Item>
                                <Form.Item
                                  label="Fecha de finalización"
                                  name={[field.name, 'fechaFin']}
                                  fieldKey={[field.fieldKey, 'fechaFin']}
                                >
                                  <Input type="date" />
                                </Form.Item>
                              </>
                            )}
                          </>
                        );
                      }}
                    </Form.Item>
                    <Form.Item
                      label="Descripción"
                      name={[field.name, 'descripcion']}
                      fieldKey={[field.fieldKey, 'descripcion']}
                    >
                      <Input placeholder="Texto mostrado al postulante (opcional)" />
                    </Form.Item>
                    <Form.Item
                      label="Extensiones permitidas (coma separadas)"
                      name={[field.name, 'extensiones']}
                      fieldKey={[field.fieldKey, 'extensiones']}
                    >
                      <Input placeholder="Ej. pdf" />
                    </Form.Item>

                    <Form.Item
                      label="Tamaño máximo (MB)"
                      name={[field.name, 'tamanoMaxMB']}
                      fieldKey={[field.fieldKey, 'tamanoMaxMB']}
                    >
                      <InputNumber
                        min={1}
                        defaultValue={10}
                        style={{ width: '100%' }}
                      />
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
                      fieldKey={[field.fieldKey, 'defaultTemplate']}
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
