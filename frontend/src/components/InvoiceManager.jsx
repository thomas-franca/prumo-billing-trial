import { useEffect, useMemo, useState } from "react";
import { couponsApi, customersApi, invoicesApi } from "../api/client.js";
import { useLanguage } from "../i18n/language.js";

const emptyForm = {
  customer_id: "",
  product_id: "",
  product_name: "",
  description: "",
  amount: "",
  coupon_id: "",
  period_start: "",
  period_end: "",
  due_date: "",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const statusLabels = {
  draft: "Rascunho",
  open: "Aberta",
  paid: "Paga",
  failed: "Falhou",
  canceled: "Cancelada",
  overdue: "Vencida",
};

function todayPlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value) {
  if (!value) return "-";

  return parseIsoDate(value).toLocaleDateString("pt-BR");
}

function invoiceDisplayStatus(invoice) {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (invoice.status === "open" && invoice.due_date && parseIsoDate(invoice.due_date) < todayOnly) {
    return "overdue";
  }

  return invoice.status;
}

function currentPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return { start: toIsoDate(start), end: toIsoDate(end) };
}

function periodEndFromCycle(periodStart, billingCycle) {
  if (!periodStart) return "";

  const start = parseIsoDate(periodStart);
  const end =
    billingCycle === "yearly"
      ? new Date(start.getFullYear() + 1, start.getMonth(), start.getDate() - 1)
      : new Date(start.getFullYear(), start.getMonth() + 1, 0);

  return toIsoDate(end);
}

function latestPeriodEnd(customer) {
  return (customer?.billing_history ?? [])
    .map((event) => event.period_end)
    .filter(Boolean)
    .sort()
    .at(-1);
}

function nextPeriodFromCustomer(customer, billingCycle) {
  const lastPeriodEnd = latestPeriodEnd(customer);

  if (!lastPeriodEnd) {
    const fallback = currentPeriod();
    return {
      start: fallback.start,
      end: periodEndFromCycle(fallback.start, billingCycle),
    };
  }

  const startDate = parseIsoDate(lastPeriodEnd);
  startDate.setDate(startDate.getDate() + 1);

  const start = toIsoDate(startDate);
  return {
    start,
    end: periodEndFromCycle(start, billingCycle),
  };
}

function dueDateFromCustomer(customer) {
  const dueDay = customer?.billing_due_day ?? 10;
  const now = new Date();
  const monthLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let due = new Date(now.getFullYear(), now.getMonth(), Math.min(dueDay, monthLastDay));

  if (due < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthLastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    due = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(dueDay, nextMonthLastDay));
  }

  return toIsoDate(due);
}

function couponIsActive(coupon) {
  if (!coupon?.active) return false;
  if (!coupon.expires_at) return true;

  return new Date(coupon.expires_at) > new Date();
}

function couponDiscountCents(coupon, amountCents) {
  if (!couponIsActive(coupon)) return 0;

  const discount =
    coupon.discount_type === "percentage"
      ? Math.round((amountCents * Number(coupon.percentage ?? 0)) / 100)
      : Number(coupon.value_cents ?? 0);

  return Math.min(discount, amountCents);
}

function couponLabel(coupon) {
  const discount =
    coupon.discount_type === "percentage"
      ? `${Number(coupon.percentage).toLocaleString("pt-BR")}%`
      : currency.format((coupon.value_cents ?? 0) / 100);

  return `${coupon.code} - ${discount}`;
}

export default function InvoiceManager({ canEdit = true }) {
  const { language, t } = useLanguage();
  const initialPeriod = currentPeriod();
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [customerIdentifierFilter, setCustomerIdentifierFilter] = useState("");
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    ...emptyForm,
    period_start: initialPeriod.start,
    period_end: initialPeriod.end,
    due_date: todayPlus(7),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedCoupon = useMemo(
    () => coupons.find((coupon) => String(coupon.id) === String(form.coupon_id)),
    [coupons, form.coupon_id],
  );
  const amountCents = Math.round(Number(form.amount || 0) * 100);
  const discountCents = couponDiscountCents(selectedCoupon, amountCents);
  const finalAmountCents = Math.max(amountCents - discountCents, 0);
  const invoiceCurrency = useMemo(
    () => new Intl.NumberFormat(language === "en" ? "en-US" : "pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
    [language],
  );

  function statusLabel(status) {
    return t(statusLabels[status] ?? status);
  }

  function displayDate(value) {
    if (!value) return "-";

    return parseIsoDate(value).toLocaleDateString(language === "en" ? "en-US" : "pt-BR");
  }

  function displayText(value) {
    return t(value ?? "");
  }

  const openInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "open").length,
    [invoices],
  );

  const filteredInvoices = useMemo(() => {
    const invoiceNumber = invoiceSearch.trim().replace("#", "");
    const customerIdentifier = customerIdentifierFilter.trim().replace("identificador:", "");

    return invoices.filter((invoice) => {
      const matchesInvoice = !invoiceNumber || String(invoice.id).includes(invoiceNumber);
      const matchesCustomer =
        !customerIdentifier ||
        String(invoice.customer_identifier ?? "")
          .replace("identificador:", "")
          .includes(customerIdentifier);

      return matchesInvoice && matchesCustomer;
    });
  }, [customerIdentifierFilter, invoiceSearch, invoices]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / 10));
  const visibleInvoices = filteredInvoices.slice((page - 1) * 10, page * 10);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [customerData, couponData, invoiceData] = await Promise.all([
        customersApi.list(),
        couponsApi.list(),
        invoicesApi.list(),
      ]);

      setCustomers(customerData);
      setCoupons(couponData);
      setInvoices(invoiceData);
    } catch (apiError) {
      setError(t(apiError.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [customerIdentifierFilter, invoiceSearch]);

  function resetForm() {
    setEditingInvoiceId(null);
    setForm({
      ...emptyForm,
      period_start: currentPeriod().start,
      period_end: currentPeriod().end,
      due_date: todayPlus(7),
    });
  }

  function updateForm(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "period_start") {
        const customer = customers.find((item) => String(item.id) === String(current.customer_id));
        next.period_end = periodEndFromCycle(value, customer?.product_billing_cycle);
      }

      return next;
    });
  }

  function selectCustomer(customerId) {
    const customer = customers.find((item) => String(item.id) === String(customerId));

    setForm((current) => {
      const nextPeriod = customer ? nextPeriodFromCustomer(customer, customer.product_billing_cycle) : null;

      return {
        ...current,
        customer_id: customerId,
        product_id: customer?.product_id ? String(customer.product_id) : "",
        product_name: customer?.product_name ?? "",
        amount: customer?.product_price_cents ? String(customer.product_price_cents / 100) : "",
        description: customer?.product_name ? `Fatura - ${customer.product_name}` : "",
        period_start: nextPeriod?.start ?? current.period_start,
        period_end: nextPeriod?.end ?? current.period_end,
        due_date: customer ? dueDateFromCustomer(customer) : current.due_date,
      };
    });
  }

  function startEditing(invoice) {
    if (!canEdit || invoice.status !== "open") return;

    setError("");
    setNotice("");
    setEditingInvoiceId(invoice.id);
    setForm({
      customer_id: invoice.customer_id ? String(invoice.customer_id) : "",
      product_id: invoice.product_id ? String(invoice.product_id) : "",
      product_name: invoice.product_name ?? "",
      description: invoice.description ?? "",
      amount: String((invoice.subtotal_cents ?? invoice.amount_cents ?? 0) / 100),
      coupon_id: invoice.coupon_id ? String(invoice.coupon_id) : "",
      period_start: invoice.period_start ?? "",
      period_end: invoice.period_end ?? "",
      due_date: invoice.due_date ?? "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canEdit) return;

    setError("");
    setNotice("");

    if (!form.customer_id || !form.product_id || !form.amount || !form.period_start || !form.period_end || !form.due_date) {
      setError(t("Informe cliente com plano cadastrado, período e vencimento."));
      return;
    }

    if (parseIsoDate(form.period_end) < parseIsoDate(form.period_start)) {
      setError(t("O fim do período não pode ser anterior ao início."));
      return;
    }

    setSaving(true);

    try {
      const payload = {
        customer_id: Number(form.customer_id),
        coupon_id: form.coupon_id ? Number(form.coupon_id) : null,
        period_start: form.period_start,
        period_end: form.period_end,
        due_date: form.due_date,
        description: form.description.trim(),
        status: "open",
      };

      if (editingInvoiceId) {
        await invoicesApi.update(editingInvoiceId, payload);
        setNotice(t("Fatura atualizada."));
      } else {
        await invoicesApi.create(payload);
        setNotice(t("Fatura gerada."));
      }

      resetForm();
      await loadData();
    } catch (apiError) {
      setError(t(apiError.message));
    } finally {
      setSaving(false);
    }
  }

  async function markAsPaid(invoice) {
    if (!canEdit) return;
    setError("");
    setNotice("");

    try {
      await invoicesApi.pay(invoice.id);
      setNotice(t("Fatura marcada como paga."));
      await loadData();
    } catch (apiError) {
      setError(t(apiError.message));
    }
  }

  async function cancelInvoice(invoice) {
    if (!canEdit) return;
    setError("");
    setNotice("");

    try {
      await invoicesApi.cancel(invoice.id);
      setNotice(t("Fatura cancelada."));
      if (editingInvoiceId === invoice.id) resetForm();
      await loadData();
    } catch (apiError) {
      setError(t(apiError.message));
    }
  }

  async function reactivateInvoice(invoice) {
    if (!canEdit) return;
    setError("");
    setNotice("");

    try {
      await invoicesApi.reactivate(invoice.id);
      setNotice(t("Fatura reativada."));
      await loadData();
    } catch (apiError) {
      setError(t(apiError.message));
    }
  }

  return (
    <section className="module-grid">
      <article className="panel">
        <div className="panel-kicker">{editingInvoiceId ? t("Edição") : t("Geração")}</div>
        <h2>{editingInvoiceId ? `${t("Editar fatura")} #${editingInvoiceId}` : t("Nova fatura")}</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            {t("Cliente")}
            <select
              disabled={!canEdit || Boolean(editingInvoiceId)}
              value={form.customer_id}
              onChange={(event) => selectCustomer(event.target.value)}
            >
              <option value="">{t("Selecione")}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.identifier_label} - {customer.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("Produto ou serviço")}
            <input
              disabled
              value={displayText(form.product_name)}
              readOnly
              placeholder={t("Selecione um cliente com plano cadastrado")}
            />
          </label>

          <label>
            {t("Descrição")}
            <input
              disabled
              value={displayText(form.description)}
              readOnly
              placeholder={t("Ex.: Fatura mensal - Plano Pro")}
            />
          </label>

          <div className="form-row">
            <label>
              {t("Valor do plano")}
              <input
                disabled
                min="0"
                step="0.01"
                type="number"
                value={form.amount}
                readOnly
                placeholder="990.00"
              />
            </label>

            <label>
              {t("Cupom de desconto")}
              <select
                disabled={!canEdit}
                value={form.coupon_id}
                onChange={(event) => updateForm("coupon_id", event.target.value)}
              >
                <option value="">{t("Sem desconto")}</option>
                {coupons.filter(couponIsActive).map((coupon) => (
                  <option key={coupon.id} value={coupon.id}>
                    {couponLabel(coupon)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="discount-summary">
            <span>{t("Desconto:")} {invoiceCurrency.format(discountCents / 100)}</span>
            <strong>{t("Total:")} {invoiceCurrency.format(finalAmountCents / 100)}</strong>
          </div>

          <label>
            {t("Vencimento")}
            <input
              disabled={!canEdit}
              type="date"
              value={form.due_date}
              onChange={(event) => updateForm("due_date", event.target.value)}
            />
          </label>

          <div className="form-row">
            <label>
              {t("Início do período")}
              <input
                disabled={!canEdit}
                type="date"
                value={form.period_start}
                onChange={(event) => updateForm("period_start", event.target.value)}
              />
            </label>

            <label>
              {t("Fim do período")}
              <input
                disabled={!canEdit}
                type="date"
                value={form.period_end}
                onChange={(event) => updateForm("period_end", event.target.value)}
              />
            </label>
          </div>

          <p className="form-message read-only-message">
            {t("Produto, serviço e valor vêm do plano cadastrado no cliente. Apenas período, vencimento e desconto podem ser ajustados.")}
          </p>

          {error && <p className="form-message error-message">{error}</p>}
          {notice && <p className="form-message success-message">{notice}</p>}

          {canEdit ? (
            <div className="form-actions">
              <button disabled={saving} type="submit">
                {saving ? t("Salvando...") : editingInvoiceId ? t("Salvar fatura") : t("Gerar fatura")}
              </button>
              {editingInvoiceId && (
                <button className="secondary-button" type="button" onClick={resetForm}>
                  {t("Cancelar edição")}
                </button>
              )}
            </div>
          ) : (
            <p className="form-message read-only-message">
              {t("Seu papel permite visualizar faturas, sem gerar cobranças.")}
            </p>
          )}
        </form>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p>{t("Faturas")}</p>
            <h2>{t(`${filteredInvoices.length} emitidas`)}</h2>
          </div>
          <span className="pill">{t(`${openInvoices} abertas`)}</span>
        </div>

        <div className="invoice-filters" aria-label={t("Filtros de faturas")}>
          <label>
            {t("Buscar por número")}
            <input
              inputMode="numeric"
              value={invoiceSearch}
              onChange={(event) => setInvoiceSearch(event.target.value)}
              placeholder="Ex.: 12"
            />
          </label>
          <label>
            {t("Identificador do cliente")}
            <input
              inputMode="numeric"
              value={customerIdentifierFilter}
              onChange={(event) => setCustomerIdentifierFilter(event.target.value)}
              placeholder="Ex.: 2"
            />
          </label>
        </div>

        {loading ? (
          <div className="empty-state">{t("Carregando faturas...")}</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <strong>{t("Nenhuma fatura encontrada.")}</strong>
            <span>{t("Ajuste os filtros ou gere uma nova cobrança.")}</span>
          </div>
        ) : (
          <>
            <div className="invoice-list">
              {visibleInvoices.map((invoice) => {
                const displayStatus = invoiceDisplayStatus(invoice);
                const invoiceDiscount = invoice.discount_cents ?? 0;

                return (
                  <article className="invoice-item" key={invoice.id}>
                    <div>
                      <span className={`status ${displayStatus}`}>{statusLabel(displayStatus)}</span>
                      <h3>{t("Fatura")} #{invoice.id}</h3>
                      <p>{invoice.customer_identifier} - {invoice.customer_name}</p>
                      <small className="invoice-description">{displayText(invoice.description || invoice.product_name || "Fatura avulsa")}</small>
                      <small className="invoice-period">{t("Período")} {invoice.period_label}</small>
                      {invoice.coupon_code && (
                        <small className="invoice-period">
                          {t("Cupom")} {invoice.coupon_code} · {t("desconto")} {invoiceCurrency.format(invoiceDiscount / 100)}
                        </small>
                      )}
                    </div>
                    <div className="product-meta">
                      <strong>{invoiceCurrency.format((invoice.amount_cents ?? 0) / 100)}</strong>
                      <small>{t("Vence em")} {displayDate(invoice.due_date)}</small>
                    </div>
                    {canEdit && (
                      <div className="product-actions">
                        {invoice.status === "open" && (
                          <>
                            <button className="secondary-button" type="button" onClick={() => startEditing(invoice)}>
                              {t("Editar")}
                            </button>
                            <button className="secondary-button" type="button" onClick={() => markAsPaid(invoice)}>
                              {t("Marcar como paga")}
                            </button>
                            <button className="secondary-button" type="button" onClick={() => cancelInvoice(invoice)}>
                              {t("Cancelar")}
                            </button>
                          </>
                        )}
                        {invoice.status === "canceled" && (
                          <button className="secondary-button" type="button" onClick={() => reactivateInvoice(invoice)}>
                            {t("Reativar")}
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination" aria-label={t("Paginação de faturas")}>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    className={page === pageNumber ? "tab active" : "tab"}
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </article>
    </section>
  );
}