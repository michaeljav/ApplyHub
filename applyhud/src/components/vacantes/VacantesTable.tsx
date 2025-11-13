'use client';

import { Table, Tag } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import type { Vacante } from '@prisma/client';

export type VacanteWithCount = Vacante & {
  _count: { postulaciones: number };
};

function calcularEstado(v: VacanteWithCount): string {
  const hoy = dayjs();
  const inicio = dayjs(v.fechaInicio);
  const fin = dayjs(v.fechaFin);
  if (inicio.isAfter(hoy, 'day')) return 'Próxima';
  if (fin.isBefore(hoy, 'day')) return 'Cerrada';
  if (v.limitePostulantes && v._count.postulaciones >= v.limitePostulantes) {
    return 'Límite alcanzado';
  }
  return 'Abierta';
}

interface VacantesTableProps {
  data?: VacanteWithCount[];
}

export default function VacantesTable({ data = [] }: VacantesTableProps) {
  return (
    <Table
      rowKey="id"
      columns={[
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
      ]}
      dataSource={data}
      pagination={false}
      style={{ marginTop: 16 }}
    />
  );
}
