import { useEffect, useState } from "react";
import DocumentList from "../components/DocumentList.jsx";
import { customerDocumentsApi } from "../api/client.js";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDocuments() {
      setLoading(true);
      setError("");

      try {
        setDocuments(await customerDocumentsApi.list());
      } catch (apiError) {
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, []);

  return (
    <>
      <header className="topbar page-header">
        <div>
          <p className="eyebrow">Documentos</p>
          <h1>Arquivos dos clientes.</h1>
        </div>
      </header>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p>Consulta geral</p>
            <h2>{documents.length} documentos</h2>
          </div>
        </div>

        {error && <p className="form-message error-message">{error}</p>}

        {loading ? (
          <div className="empty-state">Carregando documentos...</div>
        ) : (
          <DocumentList documents={documents} emptyText="Nenhum documento de cliente foi enviado." />
        )}
      </article>
    </>
  );
}