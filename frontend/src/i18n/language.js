import { createContext, createElement, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "prumo_billing_language";
const SUPPORTED_LANGUAGES = ["pt", "en"];

const ptToEn = {
  "Acesso seguro": "Secure access",
  "Entrar no Prumo Billing.": "Sign in to Prumo Billing.",
  "Entrar no Prumo Billing Trial.": "Sign in to Prumo Billing Trial.",
  "Use seu usuário e senha para acessar o painel financeiro.": "Use your username and password to access the financial dashboard.",
  "Usuário": "Username",
  "Seu usuário": "Your username",
  "Senha": "Password",
  "Sua senha": "Your password",
  "Entrar": "Sign in",
  "Entrando...": "Signing in...",
  "Validando sessão...": "Validating session...",
  "Painel financeiro": "Financial dashboard",
  "Controle de caixa em tempo real.": "Real-time cash control.",
  "Exportar": "Export",
  "Novo lançamento": "New entry",
  "Resumo financeiro": "Financial summary",
  "Saldo atual": "Current balance",
  "Receita mensal": "Monthly revenue",
  "Despesas": "Expenses",
  "Margem operacional": "Operating margin",
  "Receita paga menos inadimplência e custos": "Paid revenue minus delinquency and costs",
  "Inadimplência + custos cadastrados": "Delinquency + registered costs",
  "Fluxo de caixa": "Cash flow",
  "Entradas e saídas": "Income and expenses",
  "Período": "Period",
  "Análise rápida": "Quick analysis",
  "Índice de saúde": "Health score",
  "Carregando dados do dashboard...": "Loading dashboard data...",
  "Analisando dados financeiros.": "Analyzing financial data.",
  "A análise será exibida assim que a base responder.": "The analysis will appear as soon as the database responds.",
  "Aguardando dados": "Waiting for data",
  "Dashboard": "Dashboard",
  "Catálogo": "Catalog",
  "Produtos": "Products",
  "Cupons": "Coupons",
  "Usuários": "Users",
  "Transações": "Transactions",
  "Clientes": "Customers",
  "Documentos": "Documents",
  "Faturas": "Invoices",
  "Fatura": "Invoice",
  "Usuário ativo": "Active user",
  "Sair": "Sign out",
  "Administrador": "Administrator",
  "Financeiro": "Finance",
  "Vendedor": "Sales",
  "Ambiente demonstrativo": "Demo environment",
  "Versão demonstrativa. Use dados fictícios e valide fluxos antes de adaptar para produção.": "Demo version. Use fictional data and validate flows before adapting them for production.",
  "Carteira": "Portfolio",
  "Clientes do sistema.": "System customers.",
  "Billing": "Billing",
  "Faturas e cobranças.": "Invoices and billing.",
  "Automações": "Automations",
  "Rotinas financeiras": "Financial routines",
  "Geração mensal de faturas": "Monthly invoice generation",
  "Emissão de nota fiscal após o pagamento": "Tax document issuance after payment",
  "Cancelamentos agendados": "Scheduled cancellations",
  "Controle de inadimplência com 30 dias": "30-day delinquency control",
  "Produtos e serviços.": "Products and services.",
  "Produtos e serviços": "Products and services",
  "Cupons comerciais.": "Commercial coupons.",
  "Cupom": "Coupon",
  "Acessos": "Access",
  "Usuários do sistema.": "System users.",
  "Operações": "Operations",
  "Transações recentes.": "Recent transactions.",
  "Lançamentos": "Entries",
  "Histórico financeiro": "Financial history",
  "Todas": "All",
  "Receitas": "Revenue",
  "Descrição": "Description",
  "Categoria": "Category",
  "Status": "Status",
  "Valor": "Amount",
  "Receita": "Revenue",
  "Inadimplência": "Delinquency",
  "Custos cadastrados": "Registered costs",
  "Despesa": "Expense",
  "Faturas pagas": "Paid invoices",
  "Faturas vencidas": "Overdue invoices",
  "Feature futura": "Future feature",
  "Inadimplência + custos": "Delinquency + costs",
  "Novo cliente": "New customer",
  "Nome do cliente": "Customer name",
  "Nome do Cliente": "Customer name",
  "Nome legal para faturamento": "Legal billing name",
  "Dia do mês, ex.: 10": "Day of month, ex.: 10",
  "NomeCliente": "CustomerName",
  "Email": "Email",
  "Telefone": "Phone",
  "Documento": "Document",
  "CNPJ ou CPF": "Company or personal tax ID",
  "CPF ou CNPJ": "CPF or CNPJ",
  "Status do serviço": "Service status",
  "Status do serviço:": "Service status:",
  "Razão Social": "Legal name",
  "Razão Social:": "Legal name:",
  "Plano contratado": "Subscribed plan",
  "Plano:": "Plan:",
  "Selecione o plano": "Select a plan",
  "Vencimento": "Due date",
  "Observações": "Notes",
  "Informações comerciais, cobrança, contrato...": "Commercial details, billing, contract...",
  "Criar cliente": "Create customer",
  "Cliente atualizado.": "Customer updated.",
  "Cliente criado.": "Customer created.",
  "Informe o nome do cliente.": "Enter the customer name.",
  "Informe um vencimento entre 1 e 31.": "Enter a due day between 1 and 31.",
  "Informe a razão social para cliente PJ.": "Enter the legal name for a company customer.",
  "Selecione o plano contratado do cliente.": "Select the customer's subscribed plan.",
  "Informe a data personalizada para agendar o cancelamento.": "Enter the custom date to schedule cancellation.",
  "Serviço cancelado imediatamente.": "Service canceled immediately.",
  "Cancelamento agendado para o final do período.": "Cancellation scheduled for the period end.",
  "Cancelamento agendado para a data personalizada.": "Cancellation scheduled for the custom date.",
  "Cadastro reativado.": "Customer registration reactivated.",
  "Agendamento de cancelamento removido.": "Cancellation schedule removed.",
  "Selecione um PDF para enviar.": "Select a PDF to upload.",
  "Envie apenas arquivos PDF.": "Upload PDF files only.",
  "Documento enviado.": "Document uploaded.",
  "Documento excluído.": "Document deleted.",
  "Enviando...": "Uploading...",
  "Editar cliente": "Edit customer",
  "Reativar cadastro": "Reactivate registration",
  "Imediatamente": "Immediately",
  "Final do período": "Period end",
  "Data efetiva": "Effective date",
  "vencimento dia": "due day",
  "Serviço": "Service",
  "Sistema": "System",
  "Personalizado": "Custom",
  "Agendar": "Schedule",
  "Remover agendamento": "Remove schedule",
  "Carregando clientes...": "Loading customers...",
  "Sem plano cadastrado": "No plan registered",
  "Sem email": "No email",
  "Sem telefone": "No phone",
  "Salvar cliente": "Save customer",
  "Cadastro": "Registration",
  "Histórico": "History",
  "Envie contratos, comprovantes e documentos de apoio em PDF.": "Upload contracts, receipts and supporting documents as PDF files.",
  "Nenhum documento enviado para este cliente.": "No document has been uploaded for this customer.",
  "Somente arquivos PDF são aceitos.": "Only PDF files are accepted.",
  "Nome do documento": "Document name",
  "Ex.: Contrato assinado": "Ex.: Signed contract",
  "Arquivo PDF": "PDF file",
  "O arquivo fica no banco de dados, sem URL pública, com hash SHA-256 para rastreabilidade.": "The file is stored in the database without a public URL, with a SHA-256 hash for traceability.",
  "Enviar documento": "Upload document",
  "Excluir documento": "Delete document",
  "Novo produto ou serviço": "New product or service",
  "Nome": "First name",
  "Sobrenome": "Last name",
  "Valor mensal/anual": "Monthly/yearly amount",
  "Ciclo": "Cycle",
  "Mensal": "Monthly",
  "Anual": "Yearly",
  "Produto ativo para novas assinaturas": "Product active for new subscriptions",
  "Produto ativado.": "Product enabled.",
  "Produto atualizado.": "Product updated.",
  "Produto criado.": "Product created.",
  "Produto pausado.": "Product paused.",
  "Produto excluído.": "Product deleted.",
  "Ativar": "Activate",
  "Salvar alterações": "Save changes",
  "Cancelar edições": "Cancel edits",
  "Catálogo em modo leitura": "Catalog in read-only mode",
  "O que este plano entrega?": "What does this plan include?",
  "Assinatura para empresas de médio porte": "Subscription for mid-sized companies",
  "Assinatura inicial para pequenas empresas": "Entry subscription for small businesses",
  "Operação financeira completa para times em escala": "Complete financial operations for scaling teams",
  "Sem descrição.": "No description.",
  "Nenhum produto cadastrado.": "No product registered.",
  "Crie o primeiro plano para iniciar o faturamento.": "Create the first plan to start billing.",
  "Carregando catálogo...": "Loading catalog...",
  "Seu papel permite visualizar o catálogo, sem alterar produtos.": "Your role can view the catalog without changing products.",
  "Informe o nome do produto ou serviço.": "Enter the product or service name.",
  "Criar produto": "Create product",
  "Editar produto": "Edit product",
  "Pausar": "Pause",
  "Excluir": "Delete",
  "Novo cupom": "New coupon",
  "Código": "Code",
  "Tipo de desconto": "Discount type",
  "Percentual": "Percentage",
  "Valor fixo": "Fixed amount",
  "Criar cupom": "Create coupon",
  "Nova fatura": "New invoice",
  "Cliente": "Customer",
  "Selecione": "Select",
  "selecione": "select",
  "Edição": "Editing",
  "Geração": "Generation",
  "Editar fatura": "Edit invoice",
  "Salvar fatura": "Save invoice",
  "Salvando...": "Saving...",
  "Produto ou serviço": "Product or service",
  "Selecione um cliente com plano cadastrado": "Select a customer with a subscribed plan",
  "Ex.: Fatura mensal - Plano Pro": "Ex.: Monthly invoice - Pro Plan",
  "Fatura mensal": "Monthly invoice",
  "Valor do plano": "Plan amount",
  "Cupom de desconto": "Discount coupon",
  "Sem desconto": "No discount",
  "Produto, serviço e valor vêm do plano cadastrado no cliente. Apenas período, vencimento e desconto podem ser ajustados.": "Product, service and amount come from the customer's subscribed plan. Only period, due date and discount can be adjusted.",
  "Seu papel permite visualizar faturas, sem gerar cobranças.": "Your role can view invoices without generating charges.",
  "Carregando faturas...": "Loading invoices...",
  "Nenhuma fatura encontrada.": "No invoice found.",
  "Ajuste os filtros ou gere uma nova cobrança.": "Adjust the filters or generate a new charge.",
  "Filtros de faturas": "Invoice filters",
  "Paginação de faturas": "Invoice pagination",
  "Desconto:": "Discount:",
  "Total:": "Total:",
  "Início do período": "Period start",
  "Fim do período": "Period end",
  "Gerar fatura": "Generate invoice",
  "Buscar por número": "Search by number",
  "Identificador do cliente": "Customer identifier",
  "Marcar paga": "Mark as paid",
  "Marcar como paga": "Mark as paid",
  "Vence em": "Due on",
  "Fatura avulsa": "One-off invoice",
  "desconto": "discount",
  "Cancelar": "Cancel",
  "Reativar": "Reactivate",
  "Aberta": "Open",
  "Rascunho": "Draft",
  "Falhou": "Failed",
  "Cancelada": "Canceled",
  "Paga": "Paid",
  "Vencida": "Overdue",
  "Ativo": "Active",
  "Inativo": "Inactive",
  "Cancelado": "Canceled",
  "Pausado": "Paused",
  "Fatura gerada": "Invoice generated",
  "Fatura atualizada.": "Invoice updated.",
  "Fatura gerada.": "Invoice generated.",
  "Fatura marcada como paga.": "Invoice marked as paid.",
  "Fatura cancelada.": "Invoice canceled.",
  "Fatura reativada.": "Invoice reactivated.",
  "Fatura paga": "Invoice paid",
  "Fatura cancelada": "Invoice canceled",
  "Fatura reativada": "Invoice reactivated",
  "Fatura editada": "Invoice updated",
  "Fatura excluída": "Invoice deleted",
  "Agendamento removido": "Schedule removed",
  "Serviço cancelado": "Service canceled",
  "Cancelamento agendado": "Cancellation scheduled",
  "Usuário:": "User:",
  "Sem documento cadastrado": "No document registered",
  "Informe cliente com plano cadastrado, período e vencimento.": "Select a customer with a subscribed plan, period and due date.",
  "O fim do período não pode ser anterior ao início.": "The period end cannot be earlier than the period start.",
  "Somente faturas abertas podem ser editadas.": "Only open invoices can be edited.",
  "Faturas não podem ser excluídas pela interface. Cancele a fatura para manter rastreabilidade.": "Invoices cannot be deleted from the interface. Cancel the invoice to keep traceability.",
  "Informe uma assinatura ou cliente para gerar a fatura": "Select a subscription or customer to generate the invoice",
  "Cadastre um plano no cliente antes de gerar a fatura": "Add a plan to the customer before generating the invoice",
  "não pode ser anterior ao início do período": "cannot be earlier than the period start",
  "Preencha nome, sobrenome e usuário.": "Fill in first name, last name and username.",
  "A senha deve ter pelo menos 10 caracteres.": "The password must have at least 10 characters.",
  "A senha deve conter números e caracteres especiais.": "The password must include numbers and special characters.",
  "A confirmação de senha não confere.": "The password confirmation does not match.",
  "Usuário atualizado.": "User updated.",
  "Usuário criado.": "User created.",
  "Usuário excluído.": "User deleted.",
  "Carregando usuários...": "Loading users...",
  "Informe o código do cupom.": "Enter the coupon code.",
  "Informe um percentual entre 1 e 100.": "Enter a percentage between 1 and 100.",
  "Informe um valor fixo maior que zero.": "Enter a fixed amount greater than zero.",
  "Cupom atualizado.": "Coupon updated.",
  "Cupom criado.": "Coupon created.",
  "Cupom excluído.": "Coupon deleted.",
  "Cupom ativo": "Active coupon",
  "Desconto percentual": "Percentage discount",
  "Desconto em valor fixo": "Fixed amount discount",
  "Sem vencimento": "No expiration date",
  "Válido até": "Valid until",
  "Carregando cupons...": "Loading coupons...",
  "Nenhum cupom cadastrado.": "No coupon registered.",
  "Crie cupons para aplicar descontos comerciais.": "Create coupons to apply commercial discounts.",
  "Desconto": "Discount",
  "Pago": "Paid",
  "Pendente": "Pending",
  "Atrasado": "Late",
  "Revisar cobranças e despesas": "Review billing and expenses",
  "Risco alto no trimestre.": "High risk this quarter.",
  "A combinação de baixa receita paga, inadimplência e despesas reduz a folga operacional. Concentre esforço em recebíveis vencidos.": "The combination of low paid revenue, delinquency and expenses reduces operating slack. Focus effort on overdue receivables.",
  "Controle de acesso": "Access control",
  "Novo usuário": "New user",
  "Papel de acesso": "Access role",
  "Confirmar senha": "Confirm password",
  "Mínimo 10 caracteres": "At least 10 characters",
  "Repita a senha": "Repeat password",
  "A senha deve ter pelo menos 10 caracteres, com números e caracteres especiais.": "The password must have at least 10 characters, including numbers and special characters.",
  "Criar usuário": "Create user",
  "Editar": "Edit",
  "Salvar usuário": "Save user",
  "Cancelar edição": "Cancel editing",
  "Idioma": "Language",
  "Português": "Portuguese",
  "English": "English",
};

const enToPt = Object.fromEntries(Object.entries(ptToEn).map(([pt, en]) => [en, normalizePortuguese(pt)]));

function normalizePortuguese(value) {
  return value;
}

function translateDynamic(text, language) {
  if (language !== "en") return text;

  return text
    .replace(/^(\d+) emitidas$/, "$1 issued")
    .replace(/^(\d+) abertas$/, "$1 open")
    .replace(/^(\d+) ativos$/, "$1 active")
    .replace(/^(\d+) cadastrados$/, "$1 registered")
    .replace(/^(\d+) usuários$/, "$1 users")
    .replace(/^(\d+) dias$/, "$1 days")
    .replace(/^(\d+) documentos$/, "$1 documents")
    .replace(/^(\d+) usuários$/, "$1 users")
    .replace(/^(\d+) admins$/, "$1 admins")
    .replace(/^(.+)% vs\. mês anterior$/, "$1% vs. previous month")
    .replace(/^Vence em (.+)$/, "Due on $1")
    .replace(/^Período (.+) até (.+)$/, "Period $1 to $2")
    .replace(/^Período (.+) ate (.+)$/, "Period $1 to $2")
    .replace(/^Fatura - (.+)$/, "Invoice - $1")
    .replace(/^Cupom (.+) · desconto (.+)$/, "Coupon $1 · discount $2")
    .replace(/^Fatura #(.+)$/, "Invoice #$1")
    .replace(/^Fatura gerada #(.+)$/, "Invoice generated #$1")
    .replace(/^Fatura paga #(.+)$/, "Invoice paid #$1")
    .replace(/^Fatura cancelada #(.+)$/, "Invoice canceled #$1")
    .replace(/^Fatura reativada #(.+)$/, "Invoice reactivated #$1")
    .replace(/^Fatura editada #(.+)$/, "Invoice updated #$1")
    .replace(/^Razão Social: (.+)$/, "Legal name: $1")
    .replace(/^Status do serviço: Ativo$/, "Service status: Active")
    .replace(/^Status do serviço: Cancelado$/, "Service status: Canceled")
    .replace(/^Status do serviço: Cancelamento agendado para (.+)$/, "Service status: Cancellation scheduled for $1")
    .replace(/^Plano: (.+)$/, "Plan: $1")
    .replace(/^vencimento dia (.+)$/, "due day $1")
    .replace(/^Vencimento todo dia (.+)$/, "Due every day $1")
    .replace(/^Data efetiva (.+)$/, "Effective date $1")
    .replace(/^Inadimplência #(.+)$/, "Delinquency #$1")
    .replace(/^Válido até (.+)$/, "Valid until $1")
    .replace(/^Usuário: (.+)$/, "User: $1")
    .replace(/^Cancelamento agendado para (.+)$/, "Cancellation scheduled for $1")
    .replace(/^identificador:(.+)$/, "identifier:$1");
}

export function translateValue(value, language) {
  if (!value || !value.trim()) return value;

  const trimmed = value.trim();
  const dictionary = language === "en" ? ptToEn : enToPt;
  const translated = dictionary[trimmed] ?? dictionary[normalizePortuguese(trimmed)] ?? translateDynamic(normalizePortuguese(trimmed), language);

  return value.replace(trimmed, translated);
}

function translateNode(root, language) {
  if (!root || root.nodeType !== Node.ELEMENT_NODE) return;
  if (root.dataset?.i18nLock === "true") return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("[data-i18n-lock='true']")) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const translated = translateValue(node.nodeValue, language);
    if (translated !== node.nodeValue) {
      node.nodeValue = translated;
    }
  });

  root.querySelectorAll("input, textarea, [aria-label], [title], img[alt]").forEach((element) => {
    ["placeholder", "aria-label", "title", "alt"].forEach((attribute) => {
      if (element.hasAttribute(attribute)) {
        const currentValue = element.getAttribute(attribute);
        const translated = translateValue(currentValue, language);
        if (translated !== currentValue) {
          element.setAttribute(attribute, translated);
        }
      }
    });
  });
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : "pt";
  });

  const value = useMemo(() => ({
    language,
    setLanguage(nextLanguage) {
      if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return;
      localStorage.setItem(STORAGE_KEY, nextLanguage);
      setLanguageState(nextLanguage);
    },
    t(text) {
      return translateValue(text, language);
    },
  }), [language]);

  useEffect(() => {
    let applyingTranslations = false;

    function applyTranslations(target) {
      if (applyingTranslations) return;

      applyingTranslations = true;
      try {
        translateNode(target, language);
      } finally {
        applyingTranslations = false;
      }
    }

    document.documentElement.lang = language === "en" ? "en" : "pt-BR";
    applyTranslations(document.body);

    const observer = new MutationObserver((mutations) => {
      if (applyingTranslations) return;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            applyTranslations(node);
          } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            const translated = translateValue(node.nodeValue, language);
            if (translated !== node.nodeValue) {
              node.nodeValue = translated;
            }
          }
        });

        if (mutation.type === "characterData" && mutation.target.nodeType === Node.TEXT_NODE) {
          const translated = translateValue(mutation.target.nodeValue, language);
          if (translated !== mutation.target.nodeValue) {
            mutation.target.nodeValue = translated;
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [language]);

  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}