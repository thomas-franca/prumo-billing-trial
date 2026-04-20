import json
import sys


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


def main():
    data = json.load(sys.stdin)

    revenue = int(data.get("revenue_cents") or 0)
    expenses = int(data.get("expenses_cents") or 0)
    delinquency = int(data.get("delinquency_cents") or 0)
    overdue_count = int(data.get("overdue_invoices_count") or 0)
    active_customers = int(data.get("active_customers_count") or 0)

    margin = round(((revenue - expenses) / revenue) * 100) if revenue > 0 else 0
    delinquency_rate = round((delinquency / revenue) * 100) if revenue > 0 else 0
    customer_bonus = 8 if active_customers >= 3 else active_customers * 2
    overdue_penalty = overdue_count * 4
    health_score = clamp(round(45 + margin - delinquency_rate - overdue_penalty + customer_bonus))

    if health_score >= 80:
        headline = "Risco baixo no trimestre."
        body = "A receita paga cobre as despesas registradas e a inadimplência está sob controle. Mantenha o acompanhamento dos vencimentos para preservar a margem."
        status = "Saudável para reinvestimento"
    elif health_score >= 60:
        headline = "Risco moderado no trimestre."
        body = "O caixa segue operacional, mas há pontos de atenção em inadimplência ou margem. Priorize cobranças vencidas e revise custos cadastrados."
        status = "Acompanhar cobranças"
    else:
        headline = "Risco alto no trimestre."
        body = "A combinação de baixa receita paga, inadimplência e despesas reduz a folga operacional. Concentre esforço em recebíveis vencidos."
        status = "Revisar cobranças e despesas"

    print(json.dumps({
        "headline": headline,
        "body": body,
        "health_score": health_score,
        "operational_margin_percentage": margin,
        "status": status,
    }, ensure_ascii=True))


if __name__ == "__main__":
    main()
