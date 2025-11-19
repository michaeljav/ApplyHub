const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const INSERT_ADMIN_SQL = `
INSERT INTO "Usuario" ("nombre", "email", "password", "rol", "activo", "createdAt", "updatedAt")
VALUES (
  'Admin IAD',
  'admiadhr@iad.gob.do',
  '$2a$10$LOR7HvRgQ4O.x.Al91wKM.7DBFfDCCHleBCFagu/NgjY29JBg2fm.',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("email")
DO UPDATE SET
  "nombre" = EXCLUDED."nombre",
  "password" = EXCLUDED."password",
  "rol" = EXCLUDED."rol",
  "activo" = EXCLUDED."activo",
  "updatedAt" = NOW();
`;

async function ensureAdminUser() {
  await prisma.$executeRawUnsafe(INSERT_ADMIN_SQL);
  console.log('Usuario administrador asegurado.');
}

ensureAdminUser()
  .catch((error) => {
    console.error('Error creando usuario administrador:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
