import { useEffect, useState } from "react";
import CustomerManager from "../components/CustomerManager.jsx";
import CouponManager from "../components/CouponManager.jsx";
import InvoiceManager from "../components/InvoiceManager.jsx";
import ProductManager from "../components/ProductManager.jsx";
import UserManager from "../components/UserManager.jsx";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import { useLanguage } from "../i18n/language.js";
import { dashboardApi } from "../api/client.js";
import DocumentsPage from "./DocumentsPage.jsx";
import TransactionsPageReal from "./TransactionsPage.jsx";

const roleLabels = {
  administrator: "Administrador",
  finance: "Financeiro",
  seller: "Vendedor",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function PageHeader({ eyebrow, title, children }) {
  return (
    <header className="topbar page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children && <div className="topbar-actions">{children}</div>}
    </header>
  );
}

function CashDashboard({ currentUser }) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState("30");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        setDashboard(await dashboardApi.show());
      } catch (apiError) {
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const chartEntries = dashboard?.chart?.[period] ?? [];
  const maxValue = Math.max(1, ...chartEntries.flatMap((entry) => [entry.income_cents, entry.expense_cents]));
  const insight = dashboard?.insight ?? {
    headline: "Analisando dados financeiros.",
    body: "A análise será exibida assim que a base responder.",
    health_score: 0,
    operational_margin_percentage: 0,
    status: "Aguardando dados",
  };
  const monthlyChange = dashboard?.monthly_revenue_change_percentage ?? 0;
  const monthlyChangeClass = monthlyChange >= 0 ? "positive" : "negative";

  return (
    <>
      <PageHeader eyebrow="Painel financeiro" title="Controle de caixa em tempo real.">
        <button className="ghost-button" type="button">Exportar</button>
        <button className="primary-button" type="button">Novo lançamento</button>
        <div className="avatar" aria-label={`Usuário ${currentUser.username}`}>
          {currentUser.username.charAt(0).toUpperCase()}
        </div>
      </PageHeader>

      <section className="summary-grid" aria-label="Resumo financeiro">
        <article className="metric-card">
          <span>Saldo atual</span>
          <strong>{currency.format((dashboard?.balance_cents ?? 0) / 100)}</strong>
          <small>Receita paga menos inadimplência e custos</small>
        </article>
        <article className="metric-card">
          <span>Receita mensal</span>
          <strong>{currency.format((dashboard?.current_month_revenue_cents ?? 0) / 100)}</strong>
          <small className={monthlyChangeClass}>
            {monthlyChange >= 0 ? "+" : ""}{monthlyChange}% vs. mês anterior
          </small>
        </article>
        <article className="metric-card">
          <span>Despesas</span>
          <strong>{currency.format((dashboard?.expenses_cents ?? 0) / 100)}</strong>
          <small className="negative">Inadimplência + custos cadastrados</small>
        </article>
        <article className="metric-card accent">
          <span>Margem operacional</span>
          <strong>{insight.operational_margin_percentage}%</strong>
          <small>{t(insight.status)}</small>
        </article>
      </section>

      {error && <p className="form-message error-message">{error}</p>}
      {loading && (
        <section className="dashboard-loading" aria-label={t("Carregando dados do dashboard...")}>
          <div>
            <span className="loading-pulse" />
            <strong>{t("Carregando dados do dashboard...")}</strong>
          </div>
          <p>{t("Atualizando caixa, indicadores e análise rápida.")}</p>
        </section>
      )}

      <section className="workspace">
        <article className="cashflow-panel" aria-labelledby="cashflow-title">
          <div className="section-header">
            <div>
              <p className="eyebrow">Fluxo de caixa</p>
              <h2 id="cashflow-title">Entradas e saídas</h2>
            </div>
            <div className="period-tabs" aria-label="Período">
              {["30", "60", "90"].map((option) => (
                <button
                  className={period === option ? "tab active" : "tab"}
                  key={option}
                  type="button"
                  onClick={() => setPeriod(option)}
                >
                  {t(`${option} dias`)}
                </button>
              ))}
            </div>
          </div>
          <div className="chart" aria-label="Gráfico de fluxo de caixa">
            {chartEntries.map((entry) => (
              <div className="bar-group" key={entry.label}>
                <div className="bars">
                  <span className="bar income" style={{ height: `${Math.round((entry.income_cents / maxValue) * 100)}%` }} />
                  <span className="bar expense" style={{ height: `${Math.round((entry.expense_cents / maxValue) * 100)}%` }} />
                </div>
                <span className="bar-label">{entry.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="insight-panel">
          <p className="eyebrow">Análise rápida</p>
          <h2>{t(insight.headline)}</h2>
          <p>{t(insight.body)}</p>
          <div className="insight-score">
            <span>Índice de saúde</span>
            <strong>{insight.health_score}</strong>
          </div>
        </article>
      </section>
    </>
  );
}

function ClientsPage({ canEdit }) {
  return (
    <>
      <PageHeader eyebrow="Carteira" title="Clientes do sistema." />
      <CustomerManager canEdit={canEdit} />
    </>
  );
}

function BillingPage({ canEdit }) {
  return (
    <>
      <PageHeader eyebrow="Billing" title="Faturas e cobranças." />
      <InvoiceManager canEdit={canEdit} />
      <section className="billing-grid">
        <article className="insight-panel">
          <p className="eyebrow">Automações</p>
          <h2>Rotinas financeiras</h2>
          <ul>
            <li>Geração mensal de faturas</li>
            <li>Emissão de nota fiscal após o pagamento</li>
            <li>Cancelamentos agendados</li>
            <li>Controle de inadimplência com 30 dias</li>
          </ul>
        </article>
      </section>
    </>
  );
}

function ProductsPage({ canEdit }) {
  return (
    <>
      <PageHeader eyebrow="Catálogo" title="Produtos e serviços." />
      <ProductManager canEdit={canEdit} />
    </>
  );
}

function CouponsPage({ canEdit }) {
  return (
    <>
      <PageHeader eyebrow="Catálogo" title="Cupons comerciais." />
      <CouponManager canEdit={canEdit} />
    </>
  );
}

function UsersPage({ canManage }) {
  return (
    <>
      <PageHeader eyebrow="Acessos" title="Usuários do sistema." />
      <UserManager canManage={canManage} />
    </>
  );
}

export default function Dashboard({ currentUser, permissions, onLogout }) {
  const { t } = useLanguage();
  const [activePage, setActivePage] = useState("dashboard");
  const [openMenu, setOpenMenu] = useState("catalog");
  const [showToast, setShowToast] = useState(true);
  const canManageUsers = Boolean(permissions?.can_manage_users);
  const canEditFinancialData = Boolean(permissions?.can_edit_financial_data);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowToast(false), 5200);

    return () => window.clearTimeout(timer);
  }, []);

  const pages = {
    dashboard: <CashDashboard currentUser={currentUser} />,
    products: <ProductsPage canEdit={canEditFinancialData} />,
    coupons: <CouponsPage canEdit={canEditFinancialData} />,
    users: <UsersPage canManage={canManageUsers} />,
    transactions: <TransactionsPageReal />,
    clients: <ClientsPage canEdit={canEditFinancialData} />,
    documents: <DocumentsPage />,
    billing: <BillingPage canEdit={canEditFinancialData} />,
  };
  const activePageContent = pages[activePage] ?? pages.dashboard;

  const menuItems = [
    { id: "dashboard", label: "Dashboard" },
    {
      id: "catalog",
      label: "Catálogo",
      children: [
        { id: "products", label: "Produtos" },
        { id: "coupons", label: "Cupons" },
      ],
    },
    canManageUsers ? { id: "users", label: "Usuários" } : null,
    { id: "transactions", label: "Transações" },
    { id: "clients", label: "Clientes" },
    { id: "documents", label: "Documentos" },
    { id: "billing", label: "Faturas" },
  ].filter(Boolean);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegação principal">
        <button className="brand brand-button" type="button" onClick={() => setActivePage("dashboard")}>
          <span className="brand-mark">P</span>
          <span>
            <strong>Prumo</strong>
            <small>Billing Trial</small>
          </span>
        </button>
        <div className="trial-pill" aria-label="Ambiente demonstrativo">
          Ambiente demonstrativo
        </div>

        <nav className="nav-list">
          {menuItems.map((item) =>
            item.children ? (
              <div className="nav-group" key={item.id}>
                <button
                  aria-expanded={openMenu === item.id}
                  className={item.children.some((child) => child.id === activePage) ? "nav-link nav-parent active" : "nav-link nav-parent"}
                  type="button"
                  onClick={() => setOpenMenu((current) => (current === item.id ? "" : item.id))}
                >
                  <span>{item.label}</span>
                  <span aria-hidden="true">{openMenu === item.id ? "-" : "+"}</span>
                </button>

                {openMenu === item.id && (
                  <div className="nav-submenu">
                    {item.children.map((child) => (
                      <button
                        className={activePage === child.id ? "nav-link nav-child active" : "nav-link nav-child"}
                        key={child.id}
                        type="button"
                        onClick={() => setActivePage(child.id)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                className={activePage === item.id ? "nav-link active" : "nav-link"}
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
              >
                {item.label}
              </button>
            ),
          )}
        </nav>

        <section className="advisor-panel" aria-labelledby="advisor-title">
          <div>
            <p id="advisor-title">Usuário ativo</p>
            <strong>{currentUser.username}</strong>
            <small>{roleLabels[currentUser.role]}</small>
            <LanguageSwitcher />
            <button className="secondary-button" type="button" onClick={onLogout}>
              Sair
            </button>
          </div>
        </section>
      </aside>

      <main className="main-content">
        <div className="trial-banner">
          Versão demonstrativa. Use dados fictícios e valide fluxos antes de adaptar para produção.
        </div>
        {showToast && (
          <aside className="toast-panel" role="status" aria-live="polite">
            <div>
              <span className="toast-dot" />
              <strong>{t("Painel pronto")}</strong>
            </div>
            <p>{t(`Você está conectado como ${currentUser.username}.`)}</p>
            <button type="button" aria-label={t("Fechar aviso")} onClick={() => setShowToast(false)}>
              {t("Fechar")}
            </button>
          </aside>
        )}
        {activePageContent}
      </main>
    </div>
  );
}