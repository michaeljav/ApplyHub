import fs from 'fs';
import path from 'path';

type FileLike = Blob & { name?: string };

async function toBuffer(file: FileLike): Promise<Buffer> {
  if (typeof (file as any).arrayBuffer === 'function') {
    const bytes = await (file as any).arrayBuffer();
    return Buffer.from(bytes);
  }

  // Fallback for implementations that only expose stream()
  const response = new Response(file);
  const bytes = await response.arrayBuffer();
  return Buffer.from(bytes);
}

export async function guardarArchivoLocal(
  file: FileLike,
  nombreLogico: string,
  vacanteId: number,
  postulacionId: number
) {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const buffer = await toBuffer(file);

  const timestamp = Date.now();
  const originalName = file.name ?? 'archivo';
  const safeOriginal = originalName.replace(/\s+/g, '-');
  const nombreFinal = `vac-${vacanteId}_post-${postulacionId}_${timestamp}_${nombreLogico}_${safeOriginal}`;
  const filePath = path.join(uploadDir, nombreFinal);

  await fs.promises.writeFile(filePath, buffer);

  return { nombreFinal, ruta: filePath };
}
