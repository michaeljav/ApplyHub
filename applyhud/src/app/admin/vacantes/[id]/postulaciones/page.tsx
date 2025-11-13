'use client';

import { Table, Button } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Postulacion {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  telefono: string;
  fecha: string;
  estadoInterno: string;
}

export default function PostulantesPorVacantePage() {
  const params = useParams<{ id: string }>();
  const vacanteId = params.id;

  const { data, isLoading } = useQuery<Postulacion[]>({
    queryKey: ['postulaciones', vacanteId],
    queryFn: async () => {
      const res = await fetch(`/api/vacantes/${vacanteId}/postulaciones`);
      if (!res.ok) throw new Error('Error cargando postulaciones');
      return res.json();
    }
  });

  const columns = [
    {
      title: 'Nombre completo',
      key: 'nombre',
      render: (_: any, r: Postulacion) => `${r.nombres} ${r.apellidos}`
    },
    {
      title: 'Cédula',
      dataIndex: 'cedula',
      key: 'cedula'
    },
    {
      title: 'Correo',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono'
    },
    {
      title: 'Fecha postulación',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Estado interno',
      dataIndex: 'estadoInterno',
      key: 'estadoInterno'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_: any, r: Postulacion) => (
        <Link href={`/admin/postulaciones/${r.id}`}>Ver detalle</Link>
      )
    }
  ];

  const descargarZip = () => {
    window.location.href = `/api/vacantes/${vacanteId}/zip`;
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Postulantes</h1>
      <Button onClick={descargarZip} style={{ marginBottom: 16 }}>
        Descargar ZIP general
      </Button>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data || []}
        columns={columns}
      />
    </main>
  );
}
