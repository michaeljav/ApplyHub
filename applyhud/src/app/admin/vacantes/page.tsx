'use client';

import { Table, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Link from 'next/link';
import VacanteForm from '@/components/admin/VacanteForm';

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

  return (
    <main style={{ padding: 24 }}>
      <h1>Vacantes (Recursos Humanos)</h1>
      <VacanteForm />
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
