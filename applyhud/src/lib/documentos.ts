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

const MULTIPLE_DOCUMENTO_TIPOS = new Set<DocumentoTipo>([
  'TITULO',
  'CERTIFICADO_LABORAL'
]);

export const normalizeDocumentoTipo = (tipo: unknown): DocumentoTipo =>
  typeof tipo === 'string' && DOCUMENTO_TIPOS.has(tipo as DocumentoTipo)
    ? (tipo as DocumentoTipo)
    : 'OTRO';

export const isMultipleDocumentoAllowed = (tipo: DocumentoTipo) =>
  MULTIPLE_DOCUMENTO_TIPOS.has(tipo);

export const mapDocumentosPayload = (
  documentosRequeridos: unknown[]
) =>
  Array.isArray(documentosRequeridos)
    ? documentosRequeridos
        .filter((doc) => doc && typeof doc === 'object' && 'nombre' in doc)
        .map((doc: any, index: number) => {
          const tipoDocumento = normalizeDocumentoTipo(doc.tipoDocumento);
          const multipleDocumento =
            Boolean(doc.multipleDocumento) &&
            isMultipleDocumentoAllowed(tipoDocumento);

          return {
            nombre: String(doc.nombre),
            descripcion: doc.descripcion ? String(doc.descripcion) : null,
            obligatorio: Boolean(doc.obligatorio),
            orden: typeof doc.orden === 'number' ? doc.orden : index + 1,
            tipoDocumento,
            multipleDocumento
          };
        })
    : [];
