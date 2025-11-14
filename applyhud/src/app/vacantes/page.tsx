import VacantesTable, {
  type VacanteWithCount
} from '@/components/vacantes/VacantesTable';
import AdminAccessIcon from '@/components/vacantes/AdminAccessIcon';
import { prisma } from '@/lib/prisma';

async function getVacantes(): Promise<VacanteWithCount[]> {
  return prisma.vacante.findMany({
    include: {
      _count: { select: { postulaciones: true } }
    },
    where: { activa: true },
    orderBy: { fechaInicio: 'asc' }
  });
}

export default async function VacantesPage() {
  const vacantes = await getVacantes();

  return (
    <main style={{ padding: 24 }}>
      <div
        role="alert"
        style={{
          backgroundColor: '#fff8e1',
          border: '1px solid #ffe58f',
          color: '#7a5300',
          textAlign: 'center',
          padding: '12px 16px',
          borderRadius: 8,
          fontWeight: 600,
          marginBottom: 24,
          maxWidth: 720,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        Importante: solo puedes aplicar a una vacante.
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8
        }}
      >
        <h1 style={{ margin: 0 }}>Vacantes disponibles</h1>
        <AdminAccessIcon />
      </div>
      <VacantesTable data={vacantes} />
    </main>
  );
}
