import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import LoginPage from "./components/LoginPage.jsx";
import { authApi, clearAuthToken, getAuthToken } from "./api/client.js";
import { LanguageProvider, useLanguage } from "./i18n/language.js";

function SessionLoader() {
  const { t } = useLanguage();

  return (
    <main className="loading-shell" aria-live="polite">
      <section className="loading-card" aria-label={t("Validando sessão")}>
        <div className="loading-brand">
          <span className="brand-mark">P</span>
          <div>
            <strong>Prumo</strong>
            <small>Billing Trial</small>
          </div>
        </div>
        <div className="loading-copy">
          <strong>{t("Validando sessão...")}</strong>
          <p>{t("Estamos preparando seu painel financeiro com segurança.")}</p>
        </div>
        <div className="loading-track" aria-hidden="true">
          <span />
        </div>
        <ul className="loading-steps">
          <li>{t("Conferindo autenticação")}</li>
          <li>{t("Carregando permissões")}</li>
          <li>{t("Sincronizando dados do painel")}</li>
        </ul>
      </section>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(getAuthToken()));

  useEffect(() => {
    async function loadSession() {
      if (!getAuthToken()) return;

      try {
        setSession(await authApi.me());
      } catch {
        clearAuthToken();
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // The local token should still be removed even when the server session has expired.
    } finally {
      clearAuthToken();
      setSession(null);
    }
  }

  return (
    <LanguageProvider>
      {loading ? (
        <SessionLoader />
      ) : !session ? (
        <LoginPage onLogin={setSession} />
      ) : (
        <Dashboard currentUser={session.user} permissions={session.permissions} onLogout={logout} />
      )}
    </LanguageProvider>
  );
}