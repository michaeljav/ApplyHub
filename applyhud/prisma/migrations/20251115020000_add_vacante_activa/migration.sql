-- Add activa flag to Vacante to allow activating/deactivating postings
ALTER TABLE "Vacante"
ADD COLUMN "activa" BOOLEAN NOT NULL DEFAULT true;
