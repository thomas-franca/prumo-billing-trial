import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "./ConfirmDialog.jsx";
import DocumentList from "./DocumentList.jsx";
import { customerDocumentsApi, customersApi, productsApi } from "../api/client.js";
import { useLanguage } from "../i18n/language.js";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  document: "",
  legal_name: "",
  product_id: "",
  billing_due_day: "10",
  status: "active",
  notes: "",
};

const eventLabels = {
  invoice_generated: "Fatura gerada",
  invoice_updated: "Fatura editada",
  invoice_paid: "Fatura paga",
  invoice_canceled: "Fatura cancelada",
  invoice_reactivated: "Fatura reativada",
  invoice_deleted: "Fatura excluída",
  service_cancellation_scheduled: "Cancelamento agendado",
  service_cancellation_removed: "Agendamento removido",
  service_canceled: "Serviço cancelado",
  service_reactivated: "Cadastro reativado",
};

const statusLabels = {
  draft: "Rascunho",
  open: "Aberta",
  paid: "Paga",
  failed: "Falhou",
  canceled: "Cancelada",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function documentDigits(value) {
  return value.replace(/\D/g, "");
}

function isCompanyDocument(value) {
  return documentDigits(value).length > 11;
}

function formatDocument(value) {
  const digits = documentDigits(value);

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  if (digits.length >= 14) {
    const cnpj = digits.slice(0, 14);
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
  }

  return digits;
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("pt-BR");
}

function customerToForm(customer) {
  return {
    name: customer.name ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    document: customer.document ?? "",
    legal_name: customer.legal_name ?? "",
    product_id: String(customer.product_id ?? ""),
    billing_due_day: String(customer.billing_due_day ?? 10),
    status: customer.status ?? "active",
    notes: customer.notes ?? "",
  };
}

function normalizeCustomer(form) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    document: documentDigits(form.document),
    legal_name: isCompanyDocument(form.document) ? form.legal_name.trim() : "",
    product_id: Number(form.product_id),
    billing_due_day: Number(form.billing_due_day),
    status: form.status,
    notes: form.notes.trim(),
  };
}

function mergeHistory(customer) {
  const invoiceEvents = (customer?.billing_history ?? []).map((event) => ({
    ...event,
    record_type: "invoice",
  }));
  const serviceEvents = (customer?.service_history ?? []).map((event) => ({
    ...event,
    record_type: "service",
  }));

  return [...invoiceEvents, ...serviceEvents].sort(
    (first, second) => new Date(second.occurred_at) - new Date(first.occurred_at),
  );
}

export default function CustomerManager({ canEdit = true }) {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState("registration");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentForm, setDocumentForm] = useState({ title: "", file: null });
  const [cancellationForms, setCancellationForms] = useState({});
  const [customCancellationCustomerId, setCustomCancellationCustomerId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);

  const selectedCustomer = editingCustomer
    ? customers.find((customer) => customer.id === editingCustomer.id) ?? editingCustomer
    : null;
  const selectedHistory = useMemo(() => mergeHistory(selectedCustomer), [selectedCustomer]);
  const isCompany = isCompanyDocument(form.document);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    try {
      const [customerData, productData] = await Promise.all([customersApi.list(), productsApi.list()]);
      setCustomers(customerData);
      setProducts(productData);
    } catch (apiError) {
      setError(t(apiError.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingCustomer(null);
    setActiveTab("registration");
    setForm(emptyForm);
  }

  function startEdit(customer) {
    setEditingCustomer(customer);
    setActiveTab("registration");
    setForm(customerToForm(customer));
    setError("");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canEdit) return;

    setError("");
    setNotice("");

    if (!form.name.trim()) {
      setError(t("Informe o nome do cliente."));
      return;
    }

    const dueDay = Number(form.billing_due_day);
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      setError(t("Informe um vencimento entre 1 e 31."));
      return;
    }

    if (isCompanyDocument(form.document) && !form.legal_name.trim()) {
      setError(t("Informe a razão social para cliente PJ."));
      return;
    }

    if (!form.product_id) {
      setError(t("Selecione o plano contratado do cliente."));
      return;
    }

    setSaving(true);

    try {
      const payload = normalizeCustomer(form);

      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, payload);
        setNotice(t("Cliente atualizado."));
      } else {
        await customersApi.create(payload);
        setNotice(t("Cliente criado."));
      }

      resetForm();
      await loadCustomers();
    } catch (apiError) {
      setError(t(apiError.message));
    } finally {
      setSaving(false);
    }
  }

  function updateCancellationForm(customerId, field, value) {
    setCancellationForms((current) => ({
      ...current,
      [customerId]: {
        ...(current[customerId] ?? {}),
        [field]: value,
      },
    }));
  }

  async function applyCancellation(customer, mode) {
    if (!canEdit) return;

    const cancelAt = cancellationForms[customer.id]?.cancel_at;
    if (mode === "scheduled" && !cancelAt) {
      setError(t("Informe a data personalizada para agendar o cancelamento."));
      return;
    }

    setError("");
    setNotice("");

    try {
      await customersApi.cancelService(customer.id, { mode, cancel_at: cancelAt });
      const messages = {
        immediate: "Serviço cancelado imediatamente.",
        period_end: "Cancelamento agendado para o final do período.",
        scheduled: "Cancelamento agendado para a data personalizada.",
        reactivate: "Cadastro reativado.",
      };
      setNotice(t(messages[mode]));
      setCustomCancellationCustomerId(null);
      if (mode === "reactivate" && editingCustomer?.id === customer.id) resetForm();
      await loadCustomers();
    } catch (apiError) {
      setError(t(apiError.message));
    }
  }

  async function clearCancellation(customer) {
    if (!canEdit || customer.service_status !== "scheduled_cancellation") return;

    setError("");
    setNotice("");

    try {
      await customersApi.clearCancellation(customer.id);
      setNotice(t("Agendamento de cancelamento removido."));
      await loadCustomers();
    } catch (apiError) {
      setError(t(apiError.message));
    }
  }

  async function uploadDocument(event) {
    event.preventDefault();
    if (!canEdit || !editingCustomer) return;

    const uploadForm = event.currentTarget;
    setError("");
    setNotice("");

    if (!documentForm.file) {
      setError(t("Selecione um PDF para enviar."));
      return;
    }

    if (documentForm.file.type !== "application/pdf" || !documentForm.file.name.toLowerCase().endsWith(".pdf")) {
      setError(t("Envie apenas arquivos PDF."));
      return;
    }

    const formData = new FormData();
    formData.append("title", documentForm.title.trim() || documentForm.file.name.replace(/\.pdf$/i, ""));
    formData.append("file", documentForm.file);

    setUploading(true);

    try {
      await customerDocumentsApi.create(editingCustomer.id, formData);
      setDocumentForm({ title: "", file: null });
      uploadForm.reset();
      setNotice(t("Documento enviado."));
      await loadCustomers();
    } catch (apiError) {
      setError(t(apiError.message));
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(document) {
    if (!canEdit || !selectedCustomer || selectedCustomer.status !== "active") return;

    setError("");
    setNotice("");

    setConfirmDialog({
      title: `Excluir o documento ${document.title}?`,
      message: "O arquivo será removido do cadastro do cliente. Essa ação fica registrada no controle do sistema.",
      confirmLabel: "Excluir documento",
      onConfirm: async () => {
        setConfirmDialog(null);

        try {
          await customerDocumentsApi.remove(document.id);
          setNotice(t("Documento excluído."));
          await loadCustomers();
        } catch (apiError) {
          setError(t(apiError.message));
        }
      },
    });
  }

  function renderHistoryEvent(event) {
    if (event.record_type === "service") {
      return (
        <article className="history-item" key={`service-${event.id}`}>
          <div>
            <span className={`status ${event.service_status === "canceled" ? "canceled" : "active"}`}>
              {event.service_status === "canceled" ? t("Cancelado") : t("Ativo")}
            </span>
            <h3>{t(eventLabels[event.event_type])}</h3>
            <p>{t(event.details)}</p>
            {event.effective_date_label && <small>{t("Data efetiva")} {event.effective_date_label}</small>}
          </div>
          <div className="product-meta">
            <strong>{t("Serviço")}</strong>
            <small>{formatDateTime(event.occurred_at)}</small>
            <small>{t("Usuário:")} {event.user_username || t("Sistema")}</small>
          </div>
        </article>
      );
    }

    return (
      <article className="history-item" key={`invoice-${event.id}`}>
        <div>
          <span className={`status ${event.invoice_status}`}>{t(statusLabels[event.invoice_status])}</span>
          <h3>{t(eventLabels[event.event_type])} {event.invoice_number}</h3>
          <p>{t("Período")} {event.period_label}</p>
          <small>{t("Vencimento")} {new Date(`${event.due_date}T00:00:00`).toLocaleDateString("pt-BR")}</small>
        </div>
        <div className="product-meta">
          <strong>{currency.format((event.amount_cents ?? 0) / 100)}</strong>
          <small>{formatDateTime(event.occurred_at)}</small>
          <small>{t("Usuário:")} {event.user_username || t("Sistema")}</small>
        </div>
      </article>
    );
  }

  return (
    <section className="module-grid">
      <article className="panel">
        <div className="panel-kicker">Cadastro</div>
        <h2>{editingCustomer ? "Editar cliente" : "Novo cliente"}</h2>

        {editingCustomer && (
          <div className="period-tabs customer-tabs" aria-label="Abas do cadastro do cliente">
            <button
              className={activeTab === "registration" ? "tab active" : "tab"}
              type="button"
              onClick={() => setActiveTab("registration")}
            >
              Cadastro
            </button>
            <button
              className={activeTab === "documents" ? "tab active" : "tab"}
              type="button"
              onClick={() => setActiveTab("documents")}
            >
              Documentos
            </button>
            <button
              className={activeTab === "history" ? "tab active" : "tab"}
              type="button"
              onClick={() => setActiveTab("history")}
            >
              Histórico
            </button>
          </div>
        )}

        {activeTab === "documents" && selectedCustomer ? (
          <div className="history-panel">
            <div className="history-heading">
              <span className="status active">{selectedCustomer.identifier_label}</span>
              <strong>{selectedCustomer.name}</strong>
              <small>Envie contratos, comprovantes e documentos de apoio em PDF.</small>
            </div>

            {canEdit ? (
              <form className="product-form" onSubmit={uploadDocument}>
                <label>
                  Nome do documento
                  <input
                    value={documentForm.title}
                    onChange={(event) => setDocumentForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ex.: Contrato assinado"
                  />
                </label>

                <label>
                  Arquivo PDF
                  <input
                    accept="application/pdf,.pdf"
                    type="file"
                    onChange={(event) =>
                      setDocumentForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))
                    }
                  />
                </label>

                <p className="password-rules">
                  O arquivo fica no banco de dados, sem URL pública, com hash SHA-256 para rastreabilidade.
                </p>

                {error && <p className="form-message error-message">{error}</p>}
                {notice && <p className="form-message success-message">{notice}</p>}

                <div className="form-actions">
                  <button disabled={uploading} type="submit">
                    {uploading ? "Enviando..." : "Enviar documento"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="form-message read-only-message">
                Seu papel permite visualizar documentos, sem enviar novos arquivos.
              </p>
            )}

            <DocumentList
              canDelete={canEdit}
              deleteDisabled={selectedCustomer.status !== "active"}
              documents={selectedCustomer.documents ?? []}
              emptyText="Nenhum documento enviado para este cliente."
              onDelete={deleteDocument}
            />
          </div>
        ) : activeTab === "history" && selectedCustomer ? (
          <div className="history-panel">
            <div className="history-heading">
              <span className="status active">{selectedCustomer.identifier_label}</span>
              <strong>{selectedCustomer.name}</strong>
              <small>Vencimento todo dia {selectedCustomer.billing_due_day}</small>
            </div>

            {selectedHistory.length === 0 ? (
              <div className="empty-state">
                <strong>Nenhuma movimentação registrada.</strong>
                <span>Faturas, cancelamentos e reativações aparecem aqui.</span>
              </div>
            ) : (
              <div className="history-list">
                {selectedHistory.map(renderHistoryEvent)}
              </div>
            )}
          </div>
        ) : (
          <form className="product-form" onSubmit={handleSubmit}>
            <label>
              {t("Nome do cliente")}
              <input
                disabled={!canEdit}
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder={t("Nome do Cliente")}
              />
            </label>

            {isCompany && (
              <label>
                {t("Razão Social")}
                <input
                  disabled={!canEdit}
                  value={form.legal_name}
                  onChange={(event) => updateForm("legal_name", event.target.value)}
                  placeholder={t("Nome legal para faturamento")}
                />
              </label>
            )}

            <div className="form-row">
              <label>
                Email
                <input
                  disabled={!canEdit}
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="financeiro@cliente.com"
                />
              </label>

              <label>
                Telefone
                <input
                  disabled={!canEdit}
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  placeholder="(11) 4000-1000"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Documento
                <input
                  disabled={!canEdit}
                  value={form.document}
                  onBlur={(event) => updateForm("document", formatDocument(event.target.value))}
                  onChange={(event) => updateForm("document", event.target.value)}
                  placeholder="CPF ou CNPJ"
                />
              </label>

              <label>
                {t("Status do serviço")}
                <select disabled value={form.status}>
                  <option value="active">{t("Ativo")}</option>
                  <option value="canceled">{t("Cancelado")}</option>
                </select>
              </label>
            </div>

            <label>
              {t("Plano contratado")}
              <select
                disabled={!canEdit}
                value={form.product_id}
                onChange={(event) => updateForm("product_id", event.target.value)}
              >
                <option value="">{t("Selecione o plano")}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {currency.format((product.price_cents ?? 0) / 100)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Vencimento
              <input
                disabled={!canEdit}
                max="31"
                min="1"
                type="number"
                value={form.billing_due_day}
                onChange={(event) => updateForm("billing_due_day", event.target.value)}
                placeholder={t("Dia do mês, ex.: 10")}
              />
            </label>

            <label>
              Observações
              <textarea
                disabled={!canEdit}
                rows="4"
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                placeholder={t("Informações comerciais, cobrança, contrato...")}
              />
            </label>

            {error && <p className="form-message error-message">{error}</p>}
            {notice && <p className="form-message success-message">{notice}</p>}

            {canEdit ? (
              <div className="form-actions">
                <button disabled={saving} type="submit">
                  {saving ? "Salvando..." : editingCustomer ? "Salvar cliente" : "Criar cliente"}
                </button>
                {editingCustomer && (
                  <button className="secondary-button" type="button" onClick={resetForm}>
                    Cancelar edição
                  </button>
                )}
              </div>
            ) : (
              <p className="form-message read-only-message">
                Seu papel permite visualizar clientes, sem alterar cadastros.
              </p>
            )}
          </form>
        )}
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p>{t("Clientes")}</p>
            <h2>{t(`${customers.length} cadastrados`)}</h2>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">{t("Carregando clientes...")}</div>
        ) : (
          <div className="customer-list">
            {customers.map((customer) => {
              const customOpen = customCancellationCustomerId === customer.id;

              return (
                <article className="customer-record" key={customer.id}>
                  <div>
                    <span className={customer.service_status === "canceled" ? "status canceled" : "status active"}>
                      {customer.identifier_label}
                    </span>
                    <h3>{customer.name}</h3>
                    {customer.legal_name && <p>{t("Razão Social:")} {customer.legal_name}</p>}
                    <p>
                      {t("Status do serviço:")} <strong>{t(customer.service_status_label)}</strong>
                    </p>
                    <p>{t("Plano:")} {customer.product_name || t("Sem plano cadastrado")}</p>
                    <p>{customer.email || t("Sem email")} | {customer.phone || t("Sem telefone")}</p>
                    <small>
                      {customer.document || t("Sem documento cadastrado")} | {t("vencimento dia")} {customer.billing_due_day}
                    </small>
                  </div>
                  {canEdit && (
                    <div className="product-actions">
                      <button className="secondary-button" type="button" onClick={() => startEdit(customer)}>
                        {t("Editar")}
                      </button>

                      {customer.service_status === "canceled" ? (
                        <button className="secondary-button" type="button" onClick={() => applyCancellation(customer, "reactivate")}>
                          {t("Reativar cadastro")}
                        </button>
                      ) : (
                        <details className="action-menu">
                          <summary>{t("Cancelar")}</summary>
                          <div className="action-menu-options">
                            <button className="danger-button" type="button" onClick={() => applyCancellation(customer, "immediate")}>
                              {t("Imediatamente")}
                            </button>
                            <button className="secondary-button" type="button" onClick={() => applyCancellation(customer, "period_end")}>
                              {t("Final do período")} ({customer.current_period_end_label})
                            </button>
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => setCustomCancellationCustomerId(customOpen ? null : customer.id)}
                            >
                              {t("Personalizado")}
                            </button>
                            {customOpen && (
                              <div className="custom-cancellation">
                                <input
                                  className="inline-date-input"
                                  type="date"
                                  value={cancellationForms[customer.id]?.cancel_at ?? ""}
                                  onChange={(event) => updateCancellationForm(customer.id, "cancel_at", event.target.value)}
                                  aria-label={`Data personalizada para cancelamento de ${customer.name}`}
                                />
                                <button className="secondary-button" type="button" onClick={() => applyCancellation(customer, "scheduled")}>
                                  {t("Agendar")}
                                </button>
                              </div>
                            )}
                          </div>
                        </details>
                      )}

                      {customer.service_status === "scheduled_cancellation" && (
                        <button className="secondary-button" type="button" onClick={() => clearCancellation(customer)}>
                          {t("Remover agendamento")}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </article>
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </section>
  );
}