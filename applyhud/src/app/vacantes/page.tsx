'use client';

import { Vacante } from '@prisma/client';
import { Table, Tag } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { getBaseUrl } from '@/lib/baseUrl';

async function getVacantes(): Promise<VacanteWithCount[]> {
  const baseUrl = getBaseUrl();

  const res = await fetch(new URL('/api/vacantes', baseUrl), {
    cache: 'no-store'
  });

  if (!res.ok) throw new Error('Error cargando vacantes');
  return res.json();
}

interface VacanteWithCount extends Vacante {
  _count: { postulaciones: number };
}

function calcularEstado(v: VacanteWithCount): string {
  const hoy = dayjs();
  const inicio = dayjs(v.fechaInicio);
  const fin = dayjs(v.fechaFin);
  if (inicio.isAfter(hoy, 'day')) return 'Próxima';
  if (fin.isBefore(hoy, 'day')) return 'Cerrada';
  if (v.limitePostulantes && v._count.postulaciones >= v.limitePostulantes)
    return 'Límite alcanzado';
  return 'Abierta';
}

export default async function VacantesPage() {
  const vacantes = await getVacantes();

  const columns = [
    {
      title: 'Vacante',
      dataIndex: 'titulo',
      key: 'titulo',
      render: (text: string, record: VacanteWithCount) => (
        <Link href={`/vacantes/${record.id}`}>{text}</Link>
      )
    },
    {
      title: 'Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      render: (value: string) => dayjs(value).format('DD/MM/YYYY')
    },
    {
      title: 'Fin',
      dataIndex: 'fechaFin',
      key: 'fechaFin',
      render: (value: string) => dayjs(value).format('DD/MM/YYYY')
    },
    {
      title: 'Postulantes',
      key: 'postulantes',
      render: (_: any, record: VacanteWithCount) => record._count.postulaciones
    },
    {
      title: 'Estado',
      key: 'estado',
      render: (_: any, record: VacanteWithCount) => {
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
    }
  ];

  return (
    <main style={{ padding: 24 }}>
      <h1>Vacantes disponibles</h1>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={vacantes}
        pagination={false}
        style={{ marginTop: 16 }}
      />
    </main>
  );
}
