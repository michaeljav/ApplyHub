export type DocumentoTipo =
  | 'CEDULA'
  | 'CURRICULUM'
  | 'TITULO'
  | 'CERTIFICADO_LABORAL'
  | 'OTRO';

const DOCUMENTO_TIPOS = new Set<DocumentoTipo>([
  'CEDULA',
  'CURRICULUM',
  'TITULO',
  'CERTIFICADO_LABORAL',
  'OTRO'
]);

export const normalizeDocumentoTipo = (tipo: unknown): DocumentoTipo =>
  typeof tipo === 'string' && DOCUMENTO_TIPOS.has(tipo as DocumentoTipo)
    ? (tipo as DocumentoTipo)
    : 'OTRO';

export const mapDocumentosPayload = (
  documentosRequeridos: unknown[]
) =>
  Array.isArray(documentosRequeridos)
    ? documentosRequeridos
        .filter((doc) => doc && typeof doc === 'object' && 'nombre' in doc)
        .map((doc: any, index: number) => ({
          nombre: String(doc.nombre),
          descripcion: doc.descripcion ? String(doc.descripcion) : null,
          obligatorio: Boolean(doc.obligatorio),
          orden:
            typeof doc.orden === 'number' ? doc.orden : index + 1,
          tipoDocumento: normalizeDocumentoTipo(doc.tipoDocumento)
        }))
    : [];
