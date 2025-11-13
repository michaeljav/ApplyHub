'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Descriptions, Select, Button, List, message } from 'antd';
import { useState } from 'react';
import RequireAuth from '@/components/auth/RequireAuth';

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
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const { data, isLoading } = useQuery<PostulacionDetalle>({
    queryKey: ['postulacion', id],
    queryFn: async () => {
      const res = await fetch(`/api/postulaciones/${id}`);
      if (!res.ok) throw new Error('Error cargando postulaciA3n');
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

  const descargarArchivo = async (
    url: string,
    filename: string,
    setLoading: (state: boolean) => void
  ) => {
    if (setLoading === setDownloadingPdf && downloadingPdf) return;
    if (setLoading === setDownloadingZip && downloadingZip) return;
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      message.error('No se pudo descargar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = () =>
    descargarArchivo(
      `/api/postulaciones/${id}/pdf`,
      `postulacion-${id}.pdf`,
      setDownloadingPdf
    );

  const descargarZIP = () =>
    descargarArchivo(
      `/api/postulaciones/${id}/zip`,
      `postulacion-${id}.zip`,
      setDownloadingZip
    );

  return (
    <RequireAuth roles={['ADMIN', 'RRHH']}>
      {isLoading || !data ? (
        <main style={{ padding: 24 }}>Cargando...</main>
      ) : (
        <main style={{ padding: 24 }}>
          <h1>Detalle del postulante</h1>
          <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Vacante">{data.vacante.titulo}</Descriptions.Item>
            <Descriptions.Item label="Nombre completo">
              {data.nombres} {data.apellidos}
            </Descriptions.Item>
            <Descriptions.Item label="CAcdula">{data.cedula}</Descriptions.Item>
            <Descriptions.Item label="Correo">{data.email}</Descriptions.Item>
            <Descriptions.Item label="TelAcfono">{data.telefono}</Descriptions.Item>
            <Descriptions.Item label="Fecha postulaciA3n">{new Date(data.fecha).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Es dominicano">
              {data.esDominicano ? 'SA-' : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label="No jubilado/pensionado">
              {data.noJubilado ? 'SA-' : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label="AceptA3 tAcrminos">
              {data.aceptoTerminos ? 'SA-' : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label="Requisitos mA-nimos">
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
            <Button
              onClick={descargarPDF}
              style={{ marginRight: 8 }}
              loading={downloadingPdf}
              disabled={downloadingPdf}
            >
              Descargar PDF
            </Button>
            <Button
              onClick={descargarZIP}
              loading={downloadingZip}
              disabled={downloadingZip}
            >
              Descargar ZIP
            </Button>
          </div>
        </main>
      )}
    </RequireAuth>
  );
}
