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
  rootElement.textContent = "";

  const main = document.createElement("main");
  main.className = "dashboard";

  const title = document.createElement("section");
  title.className = "page-title";

  const label = document.createElement("p");
  label.textContent = "Prumo Billing Trial";

  const heading = document.createElement("h1");
  heading.textContent = "Não foi possível carregar a interface.";

  const panel = document.createElement("section");
  panel.className = "panel";

  const strong = document.createElement("strong");
  strong.textContent = "Erro ao iniciar o frontend.";

  const message = document.createElement("span");
  message.textContent = error instanceof Error ? error.message : "Erro desconhecido";

  title.append(label, heading);
  panel.append(strong, message);
  main.append(title, panel);
  rootElement.append(main);
}