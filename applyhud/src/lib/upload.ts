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

const uploadDir = process.env.UPLOAD_DIR || './uploads';

async function ensureUploadDir() {
  await fs.promises.mkdir(uploadDir, { recursive: true });
}

async function writeFileWithName(buffer: Buffer, nombreFinal: string) {
  const filePath = path.join(uploadDir, nombreFinal);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

export async function guardarArchivoLocal(
  file: FileLike,
  nombreLogico: string,
  vacanteId: number,
  postulacionId: number
) {
  await ensureUploadDir();

  const buffer = await toBuffer(file);

  const timestamp = Date.now();
  const originalName = file.name ?? 'archivo';
  const safeOriginal = originalName.replace(/\s+/g, '-');
  const nombreFinal = `vac-${vacanteId}_post-${postulacionId}_${timestamp}_${nombreLogico}_${safeOriginal}`;
  const filePath = await writeFileWithName(buffer, nombreFinal);

  return { nombreFinal, ruta: filePath };
}

export async function guardarArchivoInformativoVacante(
  file: FileLike,
  vacanteId: number
) {
  await ensureUploadDir();
  const buffer = await toBuffer(file);
  const timestamp = Date.now();
  const originalName = file.name ?? 'material.pdf';
  const safeOriginal = originalName.replace(/\s+/g, '-');
  const nombreFinal = `vac-${vacanteId}_info_${timestamp}_${safeOriginal}`;
  const ruta = await writeFileWithName(buffer, nombreFinal);
  return { nombreFinal, ruta };
}

export async function eliminarArchivoLocal(ruta?: string | null) {
  if (!ruta) return;
  try {
    await fs.promises.unlink(ruta);
  } catch (error: any) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }
}
