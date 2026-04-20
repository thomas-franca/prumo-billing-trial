import { customerDocumentsApi } from "../api/client.js";

function formatBytes(bytes) {
  if (!bytes) return "0 KB";

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(value) {
  return new Date(value).toLocaleString("pt-BR");
}

export default function DocumentList({
  documents = [],
  emptyText = "Nenhum documento cadastrado.",
  canDelete = false,
  deleteDisabled = false,
  onDelete,
}) {
  async function downloadDocument(document) {
    const blob = await customerDocumentsApi.download(document.id);
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.original_filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <strong>{emptyText}</strong>
        <span>Somente arquivos PDF são aceitos.</span>
      </div>
    );
  }

  return (
    <div className="document-list">
      {documents.map((document) => (
        <article className="document-item" key={document.id}>
          <div>
            <span className="status active">PDF</span>
            <h3>{document.title}</h3>
            <p>{document.customer_identifier ? `${document.customer_identifier} - ${document.customer_name}` : document.original_filename}</p>
            <small>
              {document.original_filename} | {formatBytes(document.byte_size)} | {formatDate(document.created_at)}
            </small>
            <small>SHA-256: {document.checksum_sha256}</small>
          </div>
          <div className="product-actions">
            <button className="secondary-button" type="button" onClick={() => downloadDocument(document)}>
              Baixar
            </button>
            {canDelete && (
              <button
                className="danger-button"
                disabled={deleteDisabled}
                type="button"
                onClick={() => onDelete?.(document)}
                title={deleteDisabled ? "Cliente inativo não permite excluir documentos." : "Excluir documento"}
              >
                Excluir
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}