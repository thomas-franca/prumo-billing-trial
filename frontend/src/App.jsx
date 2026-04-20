import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import LoginPage from "./components/LoginPage.jsx";
import { authApi, clearAuthToken, getAuthToken } from "./api/client.js";
import { LanguageProvider } from "./i18n/language.js";

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
        <main className="fallback-shell">
          <section className="panel">
            <strong>Validando sessão...</strong>
          </section>
        </main>
      ) : !session ? (
        <LoginPage onLogin={setSession} />
      ) : (
        <Dashboard currentUser={session.user} permissions={session.permissions} onLogout={logout} />
      )}
    </LanguageProvider>
  );
}