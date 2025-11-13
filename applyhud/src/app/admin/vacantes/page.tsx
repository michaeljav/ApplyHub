'use client';

import { Table, Tag, Button } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Link from 'next/link';
import VacanteForm from '@/components/admin/VacanteForm';
import { useState } from 'react';

interface Vacante {
  id: number;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  limitePostulantes: number | null;
  _count: { postulaciones: number };
}

function calcularEstado(v: Vacante): string {
  const hoy = dayjs();
  const inicio = dayjs(v.fechaInicio);
  const fin = dayjs(v.fechaFin);
  if (inicio.isAfter(hoy, 'day')) return 'Próxima';
  if (fin.isBefore(hoy, 'day')) return 'Cerrada';
  if (v.limitePostulantes && v._count.postulaciones >= v.limitePostulantes) return 'Límite alcanzado';
  return 'Abierta';
}

export default function AdminVacantesPage() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useQuery<Vacante[]>({
    queryKey: ['admin-vacantes'],
    queryFn: async () => {
      const res = await fetch('/api/vacantes/admin');
      if (!res.ok) throw new Error('Error cargando vacantes');
      return res.json();
    }
  });

  const columns = [
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
            : 'red';
        return <Tag color={color}>{estado}</Tag>;
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: any, record: Vacante) => (
        <Link href={`/admin/vacantes/${record.id}/postulaciones`}>Ver postulantes</Link>
      )
    }
  ];

  const toggleForm = () => setShowForm((prev) => !prev);

  return (
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
          icon={showForm ? <CloseOutlined /> : <PlusOutlined />}
          onClick={toggleForm}
        >
          {showForm ? 'Cerrar formulario' : 'Crear vacante'}
        </Button>
      </div>
      {showForm && (
        <VacanteForm
          onCreated={() => {
            setShowForm(false);
          }}
        />
      )}
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data || []}
        columns={columns}
        style={{ marginTop: 32 }}
      />
    </main>
  );
}
