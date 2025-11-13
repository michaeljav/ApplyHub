'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Descriptions, Select, Button, List } from 'antd';

interface PostulacionArchivo {
  id: number;
  nombreLogico: string;
  nombreFinal: string;
}

interface Vacante {
  titulo: string;
  requisitos: string;
  beneficios: string;
}

interface PostulacionDetalle {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  telefono: string;
  fecha: string;
  esDominicano: boolean;
  noJubilado: boolean;
  aceptoTerminos: boolean;
  estadoInterno: string;
  vacante: Vacante;
  archivos: PostulacionArchivo[];
}

export default function PostulacionDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PostulacionDetalle>({
    queryKey: ['postulacion', id],
    queryFn: async () => {
      const res = await fetch(`/api/postulaciones/${id}`);
      if (!res.ok) throw new Error('Error cargando postulación');
      return res.json();
    }
  });

  const mutation = useMutation({
    mutationFn: async (estadoInterno: string) => {
      const res = await fetch(`/api/postulaciones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estadoInterno })
      });
      if (!res.ok) throw new Error('Error actualizando estado');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['postulacion', id] });
    }
  });

  const descargarPDF = () => {
    window.location.href = `/api/postulaciones/${id}/pdf`;
  };

  const descargarZIP = () => {
    window.location.href = `/api/postulaciones/${id}/zip`;
  };

  if (isLoading || !data) return <main style={{ padding: 24 }}>Cargando...</main>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Detalle del postulante</h1>
      <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Vacante">{data.vacante.titulo}</Descriptions.Item>
        <Descriptions.Item label="Nombre completo">
          {data.nombres} {data.apellidos}
        </Descriptions.Item>
        <Descriptions.Item label="Cédula">{data.cedula}</Descriptions.Item>
        <Descriptions.Item label="Correo">{data.email}</Descriptions.Item>
        <Descriptions.Item label="Teléfono">{data.telefono}</Descriptions.Item>
        <Descriptions.Item label="Fecha postulación">{new Date(data.fecha).toLocaleString()}</Descriptions.Item>
        <Descriptions.Item label="Es dominicano">
          {data.esDominicano ? 'Sí' : 'No'}
        </Descriptions.Item>
        <Descriptions.Item label="No jubilado/pensionado">
          {data.noJubilado ? 'Sí' : 'No'}
        </Descriptions.Item>
        <Descriptions.Item label="Aceptó términos">
          {data.aceptoTerminos ? 'Sí' : 'No'}
        </Descriptions.Item>
        <Descriptions.Item label="Requisitos mínimos">
          <pre style={{ whiteSpace: 'pre-wrap' }}>{data.vacante.requisitos}</pre>
        </Descriptions.Item>
        <Descriptions.Item label="Beneficios">
          <pre style={{ whiteSpace: 'pre-wrap' }}>{data.vacante.beneficios}</pre>
        </Descriptions.Item>
        <Descriptions.Item label="Estado interno">
          <Select
            value={data.estadoInterno}
            onChange={(value) => mutation.mutate(value)}
            options={[
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'revisado', label: 'Revisado' },
              { value: 'completo', label: 'Completo' },
              { value: 'descartado', label: 'Descartado' }
            ]}
          />
        </Descriptions.Item>
      </Descriptions>

      <h2>Documentos</h2>
      <List
        dataSource={data.archivos}
        renderItem={(item) => (
          <List.Item
            actions={[
              <a key="descargar" href={`/api/files/${item.id}`}>
                Descargar
              </a>
            ]}
          >
            <List.Item.Meta
              title={item.nombreLogico}
              description={item.nombreFinal}
            />
          </List.Item>
        )}
      />

      <div style={{ marginTop: 24 }}>
        <Button onClick={descargarPDF} style={{ marginRight: 8 }}>
          Descargar PDF
        </Button>
        <Button onClick={descargarZIP}>Descargar ZIP</Button>
      </div>
    </main>
  );
}
