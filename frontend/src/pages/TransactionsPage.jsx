import { useEffect, useMemo, useState } from "react";
import { invoicesApi } from "../api/client.js";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const statusLabels = {
  paid: "Pago",
  overdue: "Vencida",
  planned: "Previsto",
};

const systemCosts = [];

function parseIsoDate(value) {
  return new Date(`${value}T00:00:00`);
}

function isOverdue(invoice) {
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return invoice.status === "open" && invoice.due_date && parseIsoDate(invoice.due_date) < todayOnly;
}

function invoiceToRevenue(invoice) {
  return {
    id: `invoice-revenue-${invoice.id}`,
    description: `Fatura #${invoice.id} - ${invoice.customer_name}`,
    category: "Receita",
    type: "income",
    status: "paid",
    amount: invoice.amount_cents,
  };
}

function invoiceToDelinquency(invoice) {
  return {
    id: `invoice-delinquency-${invoice.id}`,
    description: `Inadimplência #${invoice.id} - ${invoice.customer_name}`,
    category: "Inadimplência",
    type: "expense",
    status: "overdue",
    amount: -Math.abs(invoice.amount_cents),
  };
}

export default function TransactionsPage() {
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true);
      setError("");

      try {
        setInvoices(await invoicesApi.list());
      } catch (apiError) {
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  const transactions = useMemo(() => {
    const revenue = invoices.filter((invoice) => invoice.status === "paid").map(invoiceToRevenue);
    const delinquency = invoices.filter(isOverdue).map(invoiceToDelinquency);
    const costs = systemCosts.map((cost) => ({ ...cost, type: "expense", category: "Custos cadastrados" }));

    return [...revenue, ...delinquency, ...costs];
  }, [invoices]);

  const summary = useMemo(() => {
    const revenue = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const delinquency = transactions
      .filter((transaction) => transaction.category === "Inadimplência")
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const costs = transactions
      .filter((transaction) => transaction.category === "Custos cadastrados")
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return {
      revenue,
      delinquency,
      costs,
      expenses: delinquency + costs,
    };
  }, [transactions]);

  const filteredTransactions = transactions.filter((transaction) => {
    if (transactionFilter === "all") return true;
    if (transactionFilter === "income") return transaction.type === "income";
    if (transactionFilter === "expense") return transaction.type === "expense";
    if (transactionFilter === "delinquency") return transaction.category === "Inadimplência";
    if (transactionFilter === "costs") return transaction.category === "Custos cadastrados";

    return true;
  });

  return (
    <>
      <header className="topbar page-header">
        <div>
          <p className="eyebrow">Operações</p>
          <h1>Transações recentes.</h1>
        </div>
      </header>

      <section className="summary-grid" aria-label="Resumo de transações">
        <article className="metric-card">
          <span>Receita</span>
          <strong>{currency.format(summary.revenue / 100)}</strong>
          <small className="positive">Faturas pagas</small>
        </article>
        <article className="metric-card">
          <span>Inadimplência</span>
          <strong>{currency.format(summary.delinquency / 100)}</strong>
          <small className="negative">Faturas vencidas</small>
        </article>
        <article className="metric-card">
          <span>Custos cadastrados</span>
          <strong>{currency.format(summary.costs / 100)}</strong>
          <small>Feature futura</small>
        </article>
        <article className="metric-card accent">
          <span>Despesa</span>
          <strong>{currency.format(summary.expenses / 100)}</strong>
          <small>Inadimplência + custos</small>
        </article>
      </section>

      <article className="table-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Lançamentos</p>
            <h2>Histórico financeiro</h2>
          </div>
          <select
            aria-label="Filtrar transações"
            value={transactionFilter}
            onChange={(event) => setTransactionFilter(event.target.value)}
          >
            <option value="all">Todas</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
            <option value="delinquency">Inadimplência</option>
            <option value="costs">Custos cadastrados</option>
          </select>
        </div>

        {error && <p className="form-message error-message">{error}</p>}

        {loading ? (
          <div className="empty-state">Carregando transações...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhuma transação encontrada.</strong>
            <span>As faturas pagas e vencidas aparecem aqui automaticamente.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.description}</td>
                    <td>{transaction.category}</td>
                    <td><span className={`status ${transaction.status}`}>{statusLabels[transaction.status]}</span></td>
                    <td className={transaction.type === "income" ? "positive" : "negative"}>
                      {currency.format(transaction.amount / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </>
  );
}