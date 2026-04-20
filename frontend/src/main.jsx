import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

const rootElement = document.getElementById("root");

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error(error);
  rootElement.innerHTML = `
    <main class="dashboard">
      <section class="page-title">
        <p>Prumo Billing Trial</p>
        <h1>Não foi possível carregar a interface.</h1>
      </section>
      <section class="panel">
        <strong>Erro ao iniciar o frontend.</strong>
        <span>${error instanceof Error ? error.message : "Erro desconhecido"}</span>
      </section>
    </main>
  `;
}