import { useEffect, useMemo, useState } from "react";
import { usersApi } from "../api/client.js";

const roleLabels = {
  administrator: "Administrador",
  finance: "Financeiro",
  seller: "Vendedor",
};

const emptyForm = {
  first_name: "",
  last_name: "",
  username: "",
  role: "seller",
  password: "",
  password_confirmation: "",
};

function normalizeUser(form, editingUser) {
  const payload = {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    username: form.username.trim().toLowerCase(),
    role: form.role,
  };

  if (!editingUser || form.password) {
    payload.password = form.password;
    payload.password_confirmation = form.password_confirmation;
  }

  return payload;
}

function userToForm(user) {
  return {
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    username: user.username ?? "",
    role: user.role ?? "seller",
    password: "",
    password_confirmation: "",
  };
}

export default function UserManager({ canManage = false }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const adminCount = useMemo(
    () => users.filter((user) => user.role === "administrator").length,
    [users],
  );

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canManage) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [canManage]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingUser(null);
    setForm(emptyForm);
  }

  function startEdit(user) {
    setEditingUser(user);
    setForm(userToForm(user));
    setError("");
    setNotice("");
  }

  function validateForm() {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.username.trim()) {
      return "Preencha nome, sobrenome e usuário.";
    }

    if (!editingUser || form.password) {
      if (form.password.length < 10) {
        return "A senha deve ter pelo menos 10 caracteres.";
      }

      if (!/[0-9]/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
        return "A senha deve conter números e caracteres especiais.";
      }

      if (form.password !== form.password_confirmation) {
        return "A confirmação de senha não confere.";
      }
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const payload = normalizeUser(form, editingUser);

      if (editingUser) {
        await usersApi.update(editingUser.id, payload);
        setNotice("Usuário atualizado.");
      } else {
        await usersApi.create(payload);
        setNotice("Usuário criado.");
      }

      resetForm();
      await loadUsers();
    } catch (apiError) {
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user) {
    setError("");
    setNotice("");

    if (!window.confirm(`Excluir ${user.full_name}?`)) {
      return;
    }

    try {
      await usersApi.remove(user.id);
      setNotice("Usuário excluído.");
      if (editingUser?.id === user.id) {
        resetForm();
      }
      await loadUsers();
    } catch (apiError) {
      setError(apiError.message);
    }
  }

  if (!canManage) {
    return null;
  }

  return (
    <section className="module-grid" id="users">
      <article className="panel product-form-panel">
        <div className="panel-kicker">Usuários</div>
        <h2>{editingUser ? "Editar acesso" : "Novo usuário"}</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Nome
              <input
                value={form.first_name}
                onChange={(event) => updateForm("first_name", event.target.value)}
                placeholder="Nome"
              />
            </label>

            <label>
              Sobrenome
              <input
                value={form.last_name}
                onChange={(event) => updateForm("last_name", event.target.value)}
                placeholder="Sobrenome"
              />
            </label>
          </div>

          <label>
            Usuário
            <input
              value={form.username}
              onChange={(event) => updateForm("username", event.target.value)}
              placeholder="usuário-demo"
            />
          </label>

          <label>
            Papel de acesso
            <select value={form.role} onChange={(event) => updateForm("role", event.target.value)}>
              <option value="administrator">Administrador</option>
              <option value="finance">Financeiro</option>
              <option value="seller">Vendedor</option>
            </select>
          </label>

          <div className="form-row">
            <label>
              Senha {editingUser ? "nova" : ""}
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateForm("password", event.target.value)}
                placeholder={editingUser ? "Deixe vazio para manter" : "Mínimo 10 caracteres"}
              />
            </label>

            <label>
              Confirmar senha
              <input
                type="password"
                value={form.password_confirmation}
                onChange={(event) => updateForm("password_confirmation", event.target.value)}
                placeholder="Repita a senha"
              />
            </label>
          </div>

          <p className="password-rules">
            A senha deve ter pelo menos 10 caracteres, com números e caracteres especiais.
          </p>

          {error && <p className="form-message error-message">{error}</p>}
          {notice && <p className="form-message success-message">{notice}</p>}

          <div className="form-actions">
            <button disabled={saving} type="submit">
              {saving ? "Salvando..." : editingUser ? "Salvar usuário" : "Criar usuário"}
            </button>
            {editingUser && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </article>

      <article className="panel products-panel">
        <div className="panel-header">
          <div>
            <p>Controle de acesso</p>
            <h2>{users.length} usuários</h2>
          </div>
          <span className="pill">{adminCount} admins</span>
        </div>

        {loading ? (
          <div className="empty-state">Carregando usuários...</div>
        ) : (
          <div className="user-list">
            {users.map((user) => (
              <article className="user-item" key={user.id}>
                <div>
                  <span className={`status role-${user.role}`}>{roleLabels[user.role]}</span>
                  <h3>{user.full_name}</h3>
                  <p>{user.username}</p>
                </div>

                <div className="product-actions">
                  <button className="secondary-button" type="button" onClick={() => startEdit(user)}>
                    Editar
                  </button>
                  <button className="danger-button" type="button" onClick={() => deleteUser(user)}>
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}