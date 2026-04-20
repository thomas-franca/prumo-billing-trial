import { useState } from "react";
import { authApi, setAuthToken } from "../api/client.js";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await authApi.login(form);
      setAuthToken(session.token);
      onLogin(session);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Acesso seguro</p>
          <h1>Entrar no Prumo Billing Trial.</h1>
          <p className="login-copy">
            Use seu usuário e senha para acessar o painel financeiro.
          </p>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <label>
            Usuário
            <input
              autoComplete="username"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              placeholder="Seu usuário"
            />
          </label>

          <label>
            Senha
            <input
              autoComplete="current-password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Sua senha"
            />
          </label>

          {error && <p className="form-message error-message">{error}</p>}

          <button disabled={loading} type="submit">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}