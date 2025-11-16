'use client';

import { Modal, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { MouseEvent } from 'react';
import type { Vacante } from '@prisma/client';
import type { ColumnsType } from 'antd/es/table';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';

export type VacanteWithCount = Vacante & {
  _count: { postulaciones: number };
};

type CountdownInfo = { text: string; color: string };

function tiempoRestante(fechaFin: string | Date): CountdownInfo {
  const fin = dayjs(fechaFin);
  const ahora = dayjs();
  const diffMin = fin.diff(ahora, 'minute');
  if (diffMin < 0) return { text: 'Cerrada', color: 'red' };
  if (diffMin < 60) return { text: `Cierra en ${diffMin} min`, color: 'red' };
  const diffHoras = fin.diff(ahora, 'hour');
  if (diffHoras < 24)
    return { text: `Cierra en ${diffHoras} h`, color: 'orange' };
  const diffDias = fin.diff(ahora, 'day');
  return {
    text: `Cierra en ${diffDias} días`,
    color: diffDias <= 3 ? 'orange' : 'green'
  };
}

function calcularEstado(v: VacanteWithCount): string {
  const hoy = dayjs();
  const inicio = dayjs(v.fechaInicio);
  const fin = dayjs(v.fechaFin);
  if (!v.activa) return 'Inactiva';
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
  const router = useRouter();

  const handleVacanteClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, vacanteId: string | number) => {
      event.preventDefault();
      const targetUrl = `/vacantes/${vacanteId}`;
      Modal.confirm({
        title: 'Aviso importante',
        content: 'Solo puedes aplicar a una vacante.',
        okText: 'Continuar',
        cancelText: 'Cancelar',
        centered: true,
        onOk: () => router.push(targetUrl)
      });
    },
    [router]
  );

  const columns: ColumnsType<VacanteWithCount> = [
    {
      title: 'Código',
      dataIndex: 'id',
      key: 'codigo',
      width: 90,
      responsive: ['sm'] as Breakpoint[]
    },
    {
      title: 'Vacante',
      dataIndex: 'titulo',
      key: 'titulo',
      render: (text: string, record: VacanteWithCount) => (
        <Link
          href={`/vacantes/${record.id}`}
          onClick={(event) => handleVacanteClick(event, record.id)}
        >
          {text}
        </Link>
      )
    },
    {
      title: 'Inicio',
      dataIndex: 'fechaInicio',
      key: 'fechaInicio',
      render: (value: string | Date) => dayjs(value).format('DD/MM/YYYY'),
      responsive: ['sm'] as Breakpoint[]
    },
    {
      title: 'Fin',
      dataIndex: 'fechaFin',
      key: 'fechaFin',
      render: (value: string | Date) => dayjs(value).format('DD/MM/YYYY'),
      responsive: ['sm'] as Breakpoint[]
    },
    {
      title: 'Cierre',
      key: 'cierre',
      render: (_: any, record: VacanteWithCount) => {
        const countdown = tiempoRestante(record.fechaFin);
        return <Tag color={countdown.color}>{countdown.text}</Tag>;
      },
      responsive: ['sm'] as Breakpoint[]
    },
    {
      title: 'Postulantes',
      key: 'postulantes',
      render: (_: any, record: VacanteWithCount) => record._count.postulaciones,
      responsive: ['md'] as Breakpoint[]
    },
    {
      title: 'Estado',
      key: 'estado',
      render: (_: any, record: VacanteWithCount) => {
        const estado = calcularEstado(record);
        const color =
          estado === 'Abierta'
            ? 'green'
            : estado === 'Proxima'
            ? 'blue'
            : estado === 'Limite alcanzado'
            ? 'orange'
            : estado === 'Inactiva'
            ? 'default'
            : 'red';
        return <Tag color={color}>{estado}</Tag>;
      }
    }
  ];

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <Table
        rowKey="id"
        columns={columns}
        scroll={{ x: 'max-content' }}
        dataSource={data}
        pagination={false}
        style={{ marginTop: 16 }}
      />
    </div>
  );
}
