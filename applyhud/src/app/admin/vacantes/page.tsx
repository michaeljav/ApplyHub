'use client';

import {
  Table,
  Tag,
  Button,
  Space,
  Popconfirm,
  message,
  Spin
} from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Link from 'next/link';
import VacanteForm from '@/components/admin/VacanteForm';
import { useState } from 'react';
import RequireAuth from '@/components/auth/RequireAuth';

interface Vacante {
  id: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  limitePostulantes: number | null;
  activa: boolean;
  pdfInformativoNombre: string | null;
  pdfInformativoArchivo: string | null;
  _count: { postulaciones: number };
}

type DocumentoTipo =
  | 'CEDULA'
  | 'CURRICULUM'
  | 'TITULO'
  | 'CERTIFICADO_LABORAL'
  | 'OTRO';

interface VacanteDetalleAdmin extends Vacante {
  requisitos: string;
  beneficios: string;
  pdfInformativoRuta?: string | null;
  documentosRequeridos: Array<{
    id: number;
    nombre: string;
    descripcion: string | null;
    obligatorio: boolean;
    orden: number;
    tipoDocumento: DocumentoTipo;
  }>;
}

function calcularEstado(v: Vacante): string {
  const hoy = dayjs();
  const inicio = dayjs(v.fechaInicio);
  const fin = dayjs(v.fechaFin);
  if (!v.activa) return 'Inactiva';
  if (inicio.isAfter(hoy, 'day')) return 'Próxima';
  if (fin.isBefore(hoy, 'day')) return 'Cerrada';
  if (v.limitePostulantes && v._count.postulaciones >= v.limitePostulantes) return 'Límite alcanzado';
  return 'Abierta';
}

export default function AdminVacantesPage() {
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingVacante, setEditingVacante] = useState<VacanteDetalleAdmin | null>(null);
  const [loadingVacante, setLoadingVacante] = useState(false);
  const [prefillVacante, setPrefillVacante] = useState<VacanteDetalleAdmin | null>(null);
  const [prefillPending, setPrefillPending] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { data, isLoading } = useQuery<Vacante[]>({
    queryKey: ['admin-vacantes'],
    queryFn: async () => {
      const res = await fetch('/api/vacantes/admin');
      if (!res.ok) throw new Error('Error cargando vacantes');
      return res.json();
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, activa }: { id: number; activa: boolean }) => {
      const res = await fetch(`/api/vacantes/admin/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa })
      });
      if (!res.ok) throw new Error('Error actualizando vacante');
      return res.json();
    },
    onSuccess: (_data, variables) => {
      messageApi.success(
        variables.activa ? 'Vacante activada' : 'Vacante inactivada'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-vacantes'] });
    },
    onError: () => {
      messageApi.error('No se pudo actualizar la vacante');
    },
    onSettled: () => setTogglingId(null)
  });

  const closeForm = () => {
    setFormMode(null);
    setEditingVacante(null);
    setPrefillVacante(null);
    setPrefillPending(false);
    setLoadingVacante(false);
  };

  const handleCreateClick = () => {
    if (formMode === 'create') {
      closeForm();
      return;
    }
    setEditingVacante(null);
    setPrefillVacante(null);
    setPrefillPending(false);
    setFormMode('create');
  };

  const fetchVacanteDetalle = async (
    vacanteId: number
  ): Promise<VacanteDetalleAdmin> => {
    const res = await fetch(`/api/vacantes/admin/${vacanteId}`);
    if (!res.ok) throw new Error('Error cargando vacante');
    return res.json();
  };

  const handleEditClick = async (vacanteId: number) => {
    setFormMode('edit');
    setLoadingVacante(true);
    setEditingVacante(null);
    setPrefillVacante(null);
    setPrefillPending(false);
    try {
      const detalle = await fetchVacanteDetalle(vacanteId);
      setEditingVacante(detalle);
    } catch {
      messageApi.error('No se pudo cargar la vacante seleccionada');
      closeForm();
    } finally {
      setLoadingVacante(false);
    }
  };

  const handleDuplicateClick = async (vacanteId: number) => {
    setFormMode('create');
    setPrefillVacante(null);
    setEditingVacante(null);
    setLoadingVacante(true);
    setPrefillPending(true);
    try {
      const detalle = await fetchVacanteDetalle(vacanteId);
      setPrefillVacante(detalle);
    } catch {
      messageApi.error('No se pudo cargar la vacante a duplicar');
      closeForm();
    } finally {
      setLoadingVacante(false);
      setPrefillPending(false);
    }
  };

  const handleToggle = (vacante: Vacante) => {
    setTogglingId(vacante.id);
    toggleMutation.mutate({ id: vacante.id, activa: !vacante.activa });
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'id',
      key: 'codigo',
      width: 90
    },
    {
      title: 'Vacante',
      dataIndex: 'titulo',
      key: 'titulo'
    },
    {
      title: 'Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Fin',
      dataIndex: 'fechaFin',
      key: 'fechaFin',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      title: 'Límite',
      dataIndex: 'limitePostulantes',
      key: 'limitePostulantes'
    },
    {
      title: 'Postulantes',
      key: 'postulantes',
      render: (_: any, record: Vacante) => record._count.postulaciones
    },
    {
      title: 'Estado',
      key: 'estado',
      render: (_: any, record: Vacante) => {
        const estado = calcularEstado(record);
        const color =
          estado === 'Abierta'
            ? 'green'
            : estado === 'Próxima'
            ? 'blue'
            : estado === 'Límite alcanzado'
            ? 'orange'
            : estado === 'Inactiva'
            ? 'default'
            : 'red';
        return <Tag color={color}>{estado}</Tag>;
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: any, record: Vacante) => (
        <Space size="small">
          <Link href={`/admin/vacantes/${record.id}/postulaciones`}>
            Ver postulantes
          </Link>
          <Button type="link" onClick={() => handleEditClick(record.id)}>
            Editar
          </Button>
          <Button type="link" onClick={() => handleDuplicateClick(record.id)}>
            Duplicar
          </Button>
          <Popconfirm
            title={record.activa ? 'Inactivar vacante' : 'Activar vacante'}
            description={`Seguro que deseas ${
              record.activa ? 'inactivar' : 'activar'
            } esta vacante?`}
            onConfirm={() => handleToggle(record)}
          >
            <Button
              type="link"
              danger={record.activa}
              loading={togglingId === record.id && toggleMutation.isPending}
            >
              {record.activa ? 'Inactivar' : 'Activar'}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const isCreateOpen = formMode === 'create';

  return (
    <RequireAuth roles={['ADMIN', 'RRHH']}>
      {contextHolder}
      <main style={{ padding: 24 }}>
        <div
          style={{
            display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap'
        }}
        >
        <h1 style={{ margin: 0 }}>Vacantes (Recursos Humanos)</h1>
        <Button
          type="primary"
          icon={isCreateOpen ? <CloseOutlined /> : <PlusOutlined />}
          onClick={handleCreateClick}
        >
          {isCreateOpen ? 'Cerrar formulario' : 'Crear vacante'}
        </Button>
      </div>
      {formMode && (
        <div style={{ marginTop: 24 }}>
          {((formMode === 'edit' &&
            (loadingVacante || !editingVacante)) ||
            (formMode === 'create' &&
              prefillPending &&
              !prefillVacante)) ? (
            <Spin tip="Cargando vacante..." />
          ) : (
            <VacanteForm
              vacante={formMode === 'edit' ? editingVacante : undefined}
              prefill={formMode === 'create' ? prefillVacante : undefined}
              onCreated={closeForm}
              onUpdated={closeForm}
              onCancel={closeForm}
            />
          )}
        </div>
      )}
      <div style={{ width: '100%', overflowX: 'auto', marginTop: 32 }}>
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={data || []}
          columns={columns}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </main>
    </RequireAuth>
  );
}
