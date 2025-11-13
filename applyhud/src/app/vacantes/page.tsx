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
    orderBy: { fechaInicio: 'asc' }
  });
}

export default async function VacantesPage() {
  const vacantes = await getVacantes();

  return (
    <main style={{ padding: 24 }}>
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
