import { useEffect, useMemo, useState } from "react";
import { couponsApi } from "../api/client.js";

const emptyForm = {
  code: "",
  discount_type: "percentage",
  percentage: "",
  value: "",
  active: true,
  expires_at: "",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function couponToForm(coupon) {
  return {
    code: coupon.code ?? "",
    discount_type: coupon.discount_type ?? "percentage",
    percentage: coupon.percentage ? String(Number(coupon.percentage)) : "",
    value: String((coupon.value_cents ?? 0) / 100),
    active: Boolean(coupon.active),
    expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
  };
}

function normalizeCoupon(form) {
  const isPercentage = form.discount_type === "percentage";

  return {
    code: form.code.trim().toUpperCase(),
    discount_type: form.discount_type,
    percentage: isPercentage ? Number(form.percentage || 0) : null,
    value_cents: isPercentage ? null : Math.round(Number(form.value || 0) * 100),
    active: form.active,
    expires_at: form.expires_at ? `${form.expires_at}T23:59:59` : null,
  };
}

function couponValue(coupon) {
  if (coupon.discount_type === "percentage") {
    return `${Number(coupon.percentage ?? 0).toLocaleString("pt-BR")}%`;
  }

  return currency.format((coupon.value_cents ?? 0) / 100);
}

function expirationLabel(coupon) {
  if (!coupon.expires_at) return "Sem vencimento";

  return `Válido até ${new Date(coupon.expires_at).toLocaleDateString("pt-BR")}`;
}

export default function CouponManager({ canEdit = true }) {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeCoupons = useMemo(
    () => coupons.filter((coupon) => coupon.active).length,
    [coupons],
  );

  async function loadCoupons() {
    setLoading(true);
    setError("");

    try {
      setCoupons(await couponsApi.list());
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingCoupon(null);
    setForm(emptyForm);
  }

  function startEdit(coupon) {
    setEditingCoupon(coupon);
    setForm(couponToForm(coupon));
    setError("");
    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setError("");
    setNotice("");

    if (!form.code.trim()) {
      setSaving(false);
      setError("Informe o código do cupom.");
      return;
    }

    if (form.discount_type === "percentage") {
      const percentage = Number(form.percentage || 0);
      if (percentage <= 0 || percentage > 100) {
        setSaving(false);
        setError("Informe um percentual entre 1 e 100.");
        return;
      }
    } else if (Number(form.value || 0) <= 0) {
      setSaving(false);
      setError("Informe um valor fixo maior que zero.");
      return;
    }

    try {
      const payload = normalizeCoupon(form);

      if (editingCoupon) {
        await couponsApi.update(editingCoupon.id, payload);
        setNotice("Cupom atualizado.");
      } else {
        await couponsApi.create(payload);
        setNotice("Cupom criado.");
      }

      resetForm();
      await loadCoupons();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCoupon(coupon) {
    if (!canEdit) return;
    if (!window.confirm(`Excluir o cupom ${coupon.code}?`)) return;

    setError("");
    setNotice("");

    try {
      await couponsApi.remove(coupon.id);
      setNotice("Cupom excluído.");
      if (editingCoupon?.id === coupon.id) resetForm();
      await loadCoupons();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  return (
    <section className="module-grid">
      <article className="panel">
        <div className="panel-kicker">Cupons</div>
        <h2>{editingCoupon ? "Editar cupom" : "Novo cupom"}</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Código
            <input
              disabled={!canEdit}
              value={form.code}
              onChange={(event) => updateForm("code", event.target.value)}
              placeholder="Ex.: BEMVINDO10"
            />
          </label>

          <label>
            Tipo de desconto
            <select
              disabled={!canEdit}
              value={form.discount_type}
              onChange={(event) => updateForm("discount_type", event.target.value)}
            >
              <option value="percentage">Percentual</option>
              <option value="fixed_amount">Valor fixo</option>
            </select>
          </label>

          {form.discount_type === "percentage" ? (
            <label>
              Percentual
              <input
                disabled={!canEdit}
                max="100"
                min="1"
                step="0.01"
                type="number"
                value={form.percentage}
                onChange={(event) => updateForm("percentage", event.target.value)}
                placeholder="10"
              />
            </label>
          ) : (
            <label>
              Valor fixo
              <input
                disabled={!canEdit}
                min="0"
                step="0.01"
                type="number"
                value={form.value}
                onChange={(event) => updateForm("value", event.target.value)}
                placeholder="50.00"
              />
            </label>
          )}

          <label>
            Vencimento
            <input
              disabled={!canEdit}
              type="date"
              value={form.expires_at}
              onChange={(event) => updateForm("expires_at", event.target.value)}
            />
          </label>

          <label className="checkbox-label">
            <input
              checked={form.active}
              disabled={!canEdit}
              type="checkbox"
              onChange={(event) => updateForm("active", event.target.checked)}
            />
            Cupom ativo
          </label>

          {error && <p className="form-message error-message">{error}</p>}
          {notice && <p className="form-message success-message">{notice}</p>}

          {canEdit ? (
            <div className="form-actions">
              <button disabled={saving} type="submit">
                {saving ? "Salvando..." : editingCoupon ? "Salvar cupom" : "Criar cupom"}
              </button>
              {editingCoupon && (
                <button className="secondary-button" type="button" onClick={resetForm}>
                  Cancelar edição
                </button>
              )}
            </div>
          ) : (
            <p className="form-message read-only-message">
              Seu papel permite visualizar cupons, sem alterar cadastros.
            </p>
          )}
        </form>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p>Cupons</p>
            <h2>{coupons.length} cadastrados</h2>
          </div>
          <span className="pill">{activeCoupons} ativos</span>
        </div>

        {loading ? (
          <div className="empty-state">Carregando cupons...</div>
        ) : coupons.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum cupom cadastrado.</strong>
            <span>Crie cupons para aplicar descontos comerciais.</span>
          </div>
        ) : (
          <div className="product-list">
            {coupons.map((coupon) => (
              <article className="product-item" key={coupon.id}>
                <div>
                  <span className={coupon.active ? "status active" : "status inactive"}>
                    {coupon.active ? "Ativo" : "Inativo"}
                  </span>
                  <h3>{coupon.code}</h3>
                  <p>{coupon.discount_type === "percentage" ? "Desconto percentual" : "Desconto em valor fixo"}</p>
                  <small>{expirationLabel(coupon)}</small>
                </div>

                <div className="product-meta">
                  <strong>{couponValue(coupon)}</strong>
                  <small>Desconto</small>
                </div>

                {canEdit && (
                  <div className="product-actions">
                    <button className="secondary-button" type="button" onClick={() => startEdit(coupon)}>
                      Editar
                    </button>
                    <button className="danger-button" type="button" onClick={() => deleteCoupon(coupon)}>
                      Excluir
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}