import fs from 'fs';
import path from 'path';

export async function guardarArchivoLocal(
  file: File,
  nombreLogico: string,
  vacanteId: number,
  postulacionId: number
) {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const timestamp = Date.now();
  const safeOriginal = file.name.replace(/\s+/g, '-');
  const nombreFinal = `vac-${vacanteId}_post-${postulacionId}_${timestamp}_${nombreLogico}_${safeOriginal}`;
  const filePath = path.join(uploadDir, nombreFinal);

  await fs.promises.writeFile(filePath, buffer);

  return { nombreFinal, ruta: filePath };
}
