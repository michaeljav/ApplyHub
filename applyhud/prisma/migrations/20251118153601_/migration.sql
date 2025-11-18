/*
  Warnings:

  - You are about to drop the column `duplicarDocumento` on the `VacanteDocumento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VacanteDocumento" DROP COLUMN "duplicarDocumento",
ADD COLUMN     "multipleDocumento" BOOLEAN NOT NULL DEFAULT false;
