-- CreateEnum
CREATE TYPE "DocumentoTipo" AS ENUM ('CEDULA', 'CURRICULUM', 'TITULO', 'CERTIFICADO_LABORAL', 'OTRO');

-- CreateEnum
CREATE TYPE "CaraCedula" AS ENUM ('FRONTAL', 'REVERSO');

-- AlterTable
ALTER TABLE "VacanteDocumento"
ADD COLUMN     "tipoDocumento" "DocumentoTipo" NOT NULL DEFAULT 'OTRO',
ADD COLUMN     "caraCedula" "CaraCedula",
ADD COLUMN     "tituloNivel" TEXT,
ADD COLUMN     "institucion" TEXT,
ADD COLUMN     "cargo" TEXT,
ADD COLUMN     "fechaInicio" TIMESTAMP(3),
ADD COLUMN     "fechaFin" TIMESTAMP(3);
