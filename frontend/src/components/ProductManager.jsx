import { useEffect, useMemo, useState } from "react";
import { productsApi } from "../api/client.js";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  billing_cycle: "monthly",
  active: true,
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function normalizeProduct(product) {
  return {
    name: product.name.trim(),
    description: product.description.trim(),
    price_cents: Math.round(Number(product.price || 0) * 100),
    billing_cycle: product.billing_cycle,
    active: product.active,
  };
}

function productToForm(product) {
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    price: String((product.price_cents ?? 0) / 100),
    billing_cycle: product.billing_cycle ?? "monthly",
    active: Boolean(product.active),
  };
}

export default function ProductManager({ canEdit = true }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeProducts = useMemo(
    () => products.filter((product) => product.active).length,
    [products],
  );

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const data = await productsApi.list();
      setProducts(data);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(product) {
    setEditingProduct(product);
    setForm(productToForm(product));
    setNotice("");
    setError("");
  }

  function resetForm() {
    setEditingProduct(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canEdit) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    if (!form.name.trim()) {
      setSaving(false);
      setError("Informe o nome do produto ou serviço.");
      return;
    }

    try {
      const payload = normalizeProduct(form);

      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        setNotice("Produto atualizado.");
      } else {
        await productsApi.create(payload);
        setNotice("Produto criado.");
      }

      resetForm();
      await loadProducts();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleProduct(product) {
    if (!canEdit) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await productsApi.update(product.id, { active: !product.active });
      setNotice(product.active ? "Produto pausado." : "Produto ativado.");
      await loadProducts();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  async function deleteProduct(product) {
    if (!canEdit) {
      return;
    }

    setError("");
    setNotice("");

    if (!window.confirm(`Excluir ${product.name}?`)) {
      return;
    }

    try {
      await productsApi.remove(product.id);
      setNotice("Produto excluído.");
      if (editingProduct?.id === product.id) {
        resetForm();
      }
      await loadProducts();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  return (
    <section className="module-grid" id="catalog">
      <article className="panel product-form-panel">
        <div className="panel-kicker">Catálogo</div>
        <h2>{canEdit ? (editingProduct ? "Editar produto" : "Novo produto ou serviço") : "Catálogo em modo leitura"}</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Nome
            <input
              value={form.name}
              disabled={!canEdit}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Ex.: Plano Pro"
            />
          </label>

          <label>
            Descrição
            <textarea
              value={form.description}
              disabled={!canEdit}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder="O que este plano entrega?"
              rows="4"
            />
          </label>

          <div className="form-row">
            <label>
              Valor mensal/anual
              <input
                min="0"
                step="0.01"
                type="number"
                value={form.price}
                disabled={!canEdit}
                onChange={(event) => updateForm("price", event.target.value)}
                placeholder="199.90"
              />
            </label>

            <label>
              Ciclo
              <select
                value={form.billing_cycle}
                disabled={!canEdit}
                onChange={(event) => updateForm("billing_cycle", event.target.value)}
              >
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </label>
          </div>

          <label className="checkbox-label">
            <input
              checked={form.active}
              disabled={!canEdit}
              type="checkbox"
              onChange={(event) => updateForm("active", event.target.checked)}
            />
            Produto ativo para novas assinaturas
          </label>

          {error && <p className="form-message error-message">{error}</p>}
          {notice && <p className="form-message success-message">{notice}</p>}

          {canEdit ? (
          <div className="form-actions">
            <button disabled={saving} type="submit">
              {saving ? "Salvando..." : editingProduct ? "Salvar alterações" : "Criar produto"}
            </button>
            {editingProduct && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Cancelar edições
              </button>
            )}
          </div>
          ) : (
            <p className="form-message read-only-message">
              Seu papel permite visualizar o catálogo, sem alterar produtos.
            </p>
          )}
        </form>
      </article>

      <article className="panel products-panel">
        <div className="panel-header">
          <div>
            <p>Produtos e serviços</p>
            <h2>{products.length} cadastrados</h2>
          </div>
          <span className="pill">{activeProducts} ativos</span>
        </div>

        {loading ? (
          <div className="empty-state">Carregando catálogo...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum produto cadastrado.</strong>
            <span>Crie o primeiro plano para iniciar o faturamento.</span>
          </div>
        ) : (
          <div className="product-list">
            {products.map((product) => (
              <article className="product-item" key={product.id}>
                <div>
                  <span className={product.active ? "status active" : "status inactive"}>
                    {product.active ? "Ativo" : "Pausado"}
                  </span>
                  <h3>{product.name}</h3>
                  <p>{product.description || "Sem descrição."}</p>
                </div>

                <div className="product-meta">
                  <strong>{currency.format((product.price_cents ?? 0) / 100)}</strong>
                  <small>{product.billing_cycle === "yearly" ? "Anual" : "Mensal"}</small>
                </div>

                {canEdit && (
                <div className="product-actions">
                  <button className="secondary-button" type="button" onClick={() => startEdit(product)}>
                    Editar
                  </button>
                  <button className="secondary-button" type="button" onClick={() => toggleProduct(product)}>
                    {product.active ? "Pausar" : "Ativar"}
                  </button>
                  <button className="danger-button" type="button" onClick={() => deleteProduct(product)}>
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