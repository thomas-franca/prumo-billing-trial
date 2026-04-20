const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const transactions = [
  {
    description: "Plano Enterprise - NovaLink",
    category: "Receita",
    type: "income",
    status: "paid",
    statusLabel: "Pago",
    amount: 42800,
  },
  {
    description: "Infraestrutura cloud",
    category: "Tecnologia",
    type: "expense",
    status: "pending",
    statusLabel: "Pendente",
    amount: -6800,
  },
  {
    description: "Consultoria financeira",
    category: "Servico",
    type: "income",
    status: "paid",
    statusLabel: "Pago",
    amount: 12400,
  },
  {
    description: "Licencas internas",
    category: "Operacional",
    type: "expense",
    status: "late",
    statusLabel: "Atrasado",
    amount: -2950,
  },
  {
    description: "Onboarding - Mercado Atlas",
    category: "Receita",
    type: "income",
    status: "paid",
    statusLabel: "Pago",
    amount: 18900,
  },
];

const clients = [
  {
    name: "NovaLink",
    plan: "Enterprise",
    risk: "Baixo",
    status: "paid",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "Mercado Atlas",
    plan: "Scale",
    risk: "Medio",
    status: "pending",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80",
  },
  {
    name: "CorePay",
    plan: "Growth",
    risk: "Alto",
    status: "late",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
  },
];

const cashflowData = {
  30: [
    { label: "S1", income: 48, expense: 26 },
    { label: "S2", income: 55, expense: 31 },
    { label: "S3", income: 46, expense: 29 },
    { label: "S4", income: 64, expense: 34 },
  ],
  60: [
    { label: "Jan", income: 44, expense: 28 },
    { label: "Fev", income: 52, expense: 32 },
    { label: "Mar", income: 59, expense: 35 },
    { label: "Abr", income: 64, expense: 34 },
    { label: "Mai", income: 68, expense: 39 },
    { label: "Jun", income: 72, expense: 42 },
  ],
  90: [
    { label: "T1", income: 126, expense: 88 },
    { label: "T2", income: 156, expense: 96 },
    { label: "T3", income: 178, expense: 112 },
    { label: "T4", income: 196, expense: 121 },
  ],
};

const balanceElement = document.querySelector("#currentBalance");
const revenueElement = document.querySelector("#monthlyRevenue");
const expensesElement = document.querySelector("#monthlyExpenses");
const marginElement = document.querySelector("#operatingMargin");
const chartElement = document.querySelector("#cashflowChart");
const transactionRows = document.querySelector("#transactionRows");
const transactionFilter = document.querySelector("#transactionFilter");
const clientList = document.querySelector("#clientList");
const modal = document.querySelector("#transactionModal");
const toast = document.querySelector("#toast");

function calculateSummary() {
  const revenue = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = Math.abs(
    transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );
  const balance = revenue - expenses;
  const margin = Math.round(((revenue - expenses) / revenue) * 100);

  balanceElement.textContent = currency.format(balance);
  revenueElement.textContent = currency.format(revenue);
  expensesElement.textContent = currency.format(expenses);
  marginElement.textContent = `${margin}%`;
}

function renderTransactions(filter = "all") {
  const visibleTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((transaction) => transaction.type === filter);

  transactionRows.innerHTML = visibleTransactions
    .map(
      (transaction) => `
        <tr>
          <td>${transaction.description}</td>
          <td>${transaction.category}</td>
          <td><span class="status ${transaction.status}">${transaction.statusLabel}</span></td>
          <td class="${transaction.type === "income" ? "positive" : "negative"}">
            ${currency.format(transaction.amount)}
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderClients() {
  clientList.innerHTML = clients
    .map(
      (client) => `
        <div class="client-item">
          <img src="${client.image}" alt="Contato da conta ${client.name}" />
          <div>
            <strong>${client.name}</strong>
            <span>${client.plan}</span>
          </div>
          <span class="status ${client.status} risk">${client.risk}</span>
        </div>
      `,
    )
    .join("");
}

function renderChart(period = "30") {
  const entries = cashflowData[period];
  const maxValue = Math.max(
    ...entries.flatMap((entry) => [entry.income, entry.expense]),
  );

  chartElement.innerHTML = entries
    .map((entry) => {
      const incomeHeight = Math.round((entry.income / maxValue) * 100);
      const expenseHeight = Math.round((entry.expense / maxValue) * 100);

      return `
        <div class="bar-group" title="${entry.label}: entrada ${entry.income}k, saida ${entry.expense}k">
          <div class="bars">
            <span class="bar income" style="height: ${incomeHeight}%"></span>
            <span class="bar expense" style="height: ${expenseHeight}%"></span>
          </div>
          <span class="bar-label">${entry.label}</span>
        </div>
      `;
    })
    .join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    renderChart(button.dataset.period);
  });
});

transactionFilter.addEventListener("change", (event) => {
  renderTransactions(event.target.value);
});

document.querySelector("#openTransactionModal").addEventListener("click", () => {
  modal.showModal();
});

document.querySelector("#saveTransaction").addEventListener("click", (event) => {
  event.preventDefault();
  const description = document.querySelector("#descriptionInput").value.trim();
  const amount = Number(document.querySelector("#amountInput").value);
  const type = document.querySelector("#typeInput").value;

  if (!description || !amount) {
    showToast("Preencha descricao e valor para continuar.");
    return;
  }

  transactions.unshift({
    description,
    category: type === "income" ? "Receita" : "Despesa",
    type,
    status: "pending",
    statusLabel: "Pendente",
    amount: type === "income" ? Math.abs(amount) : -Math.abs(amount),
  });

  calculateSummary();
  renderTransactions(transactionFilter.value);
  modal.close();
  event.target.form.reset();
  showToast("Lancamento adicionado ao painel.");
});

document.querySelector("#exportButton").addEventListener("click", () => {
  showToast("Relatorio financeiro preparado para exportacao.");
});

calculateSummary();
renderTransactions();
renderClients();
renderChart();