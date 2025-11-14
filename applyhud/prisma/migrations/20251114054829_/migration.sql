/*
  Warnings:

  - You are about to drop the column `extensiones` on the `VacanteDocumento` table. All the data in the column will be lost.
  - You are about to drop the column `tamanoMaxMB` on the `VacanteDocumento` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentoTipo" AS ENUM ('CEDULA', 'CURRICULUM', 'TITULO', 'CERTIFICADO_LABORAL', 'OTRO');

-- CreateEnum
CREATE TYPE "CaraCedula" AS ENUM ('FRONTAL', 'REVERSO');

-- AlterTable
ALTER TABLE "PostulacionArchivo" ADD COLUMN     "caraCedula" "CaraCedula",
ADD COLUMN     "cargo" TEXT,
ADD COLUMN     "fechaFin" TIMESTAMP(3),
ADD COLUMN     "fechaInicio" TIMESTAMP(3),
ADD COLUMN     "institucion" TEXT,
ADD COLUMN     "tipoDocumento" "DocumentoTipo" NOT NULL DEFAULT 'OTRO',
ADD COLUMN     "tituloNivel" TEXT;

-- AlterTable
ALTER TABLE "VacanteDocumento" DROP COLUMN "extensiones",
DROP COLUMN "tamanoMaxMB",
ADD COLUMN     "tipoDocumento" "DocumentoTipo" NOT NULL DEFAULT 'OTRO';
