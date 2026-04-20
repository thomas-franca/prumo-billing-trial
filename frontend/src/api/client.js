const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const TOKEN_KEY = "prumo_billing_trial_auth_token";
const REQUEST_TIMEOUT_MS = 10000;

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The API did not respond in time. Please check if the backend is running.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function apiRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const body = options.body && typeof options.body !== "string" && !isFormData ? JSON.stringify(options.body) : options.body;
  const token = getAuthToken();
  const headers = isFormData
    ? { ...options.headers }
    : {
        "Content-Type": "application/json",
        ...options.headers,
      };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
    body,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error ?? payload.errors?.join(", ") ?? "Failed to communicate with the API";
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function apiBlobRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = { ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error ?? payload.errors?.join(", ") ?? "Falha na comunicação com a API";
    throw new Error(message);
  }

  return response.blob();
}

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export const authApi = {
  login: (credentials) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: { auth: credentials },
    }),
  logout: () =>
    apiRequest("/auth/logout", {
      method: "POST",
    }),
  me: () => apiRequest("/auth/me"),
};

export const dashboardApi = {
  show: () => apiRequest("/dashboard"),
};

export const productsApi = {
  list: () => apiRequest("/products"),
  create: (product) =>
    apiRequest("/products", {
      method: "POST",
      body: { product },
    }),
  update: (id, product) =>
    apiRequest(`/products/${id}`, {
      method: "PATCH",
      body: { product },
    }),
  remove: (id) =>
    apiRequest(`/products/${id}`, {
      method: "DELETE",
    }),
};

export const couponsApi = {
  list: () => apiRequest("/coupons"),
  create: (coupon) =>
    apiRequest("/coupons", {
      method: "POST",
      body: { coupon },
    }),
  update: (id, coupon) =>
    apiRequest(`/coupons/${id}`, {
      method: "PATCH",
      body: { coupon },
    }),
  remove: (id) =>
    apiRequest(`/coupons/${id}`, {
      method: "DELETE",
    }),
};

export const usersApi = {
  list: () => apiRequest("/users"),
  create: (user) =>
    apiRequest("/users", {
      method: "POST",
      body: { user },
    }),
  update: (id, user) =>
    apiRequest(`/users/${id}`, {
      method: "PATCH",
      body: { user },
    }),
  remove: (id) =>
    apiRequest(`/users/${id}`, {
      method: "DELETE",
    }),
};

export const customersApi = {
  list: () => apiRequest("/customers"),
  create: (customer) =>
    apiRequest("/customers", {
      method: "POST",
      body: { customer },
    }),
  update: (id, customer) =>
    apiRequest(`/customers/${id}`, {
      method: "PATCH",
      body: { customer },
    }),
  remove: (id) =>
    apiRequest(`/customers/${id}`, {
      method: "DELETE",
    }),
  cancelService: (id, cancellation) =>
    apiRequest(`/customers/${id}/cancellation`, {
      method: "POST",
      body: { cancellation },
    }),
  clearCancellation: (id) =>
    apiRequest(`/customers/${id}/cancellation`, {
      method: "DELETE",
    }),
};

export const invoicesApi = {
  list: () => apiRequest("/invoices"),
  create: (invoice) =>
    apiRequest("/invoices", {
      method: "POST",
      body: { invoice },
    }),
  update: (id, invoice) =>
    apiRequest(`/invoices/${id}`, {
      method: "PATCH",
      body: { invoice },
    }),
  pay: (id) =>
    apiRequest(`/invoices/${id}/pay`, {
      method: "POST",
    }),
  cancel: (id) =>
    apiRequest(`/invoices/${id}/cancel`, {
      method: "POST",
    }),
  reactivate: (id) =>
    apiRequest(`/invoices/${id}/reactivate`, {
      method: "POST",
    }),
  remove: (id) =>
    apiRequest(`/invoices/${id}`, {
      method: "DELETE",
    }),
};

export const customerDocumentsApi = {
  list: () => apiRequest("/customer_documents"),
  listForCustomer: (customerId) => apiRequest(`/customers/${customerId}/customer_documents`),
  create: (customerId, formData) =>
    apiRequest(`/customers/${customerId}/customer_documents`, {
      method: "POST",
      body: formData,
    }),
  remove: (id) =>
    apiRequest(`/customer_documents/${id}`, {
      method: "DELETE",
    }),
  download: (id) => apiBlobRequest(`/customer_documents/${id}/download`),
  downloadUrl: (id) => apiUrl(`/customer_documents/${id}/download`),
};