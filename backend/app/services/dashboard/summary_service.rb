module Dashboard
  class SummaryService
    SYSTEM_COSTS_CENTS = 0

    def call
      invoices = Invoice.all.to_a
      paid_invoices = invoices.select { |invoice| invoice.status == "paid" }
      overdue_invoices = invoices.select { |invoice| overdue?(invoice) }

      revenue_cents = paid_invoices.sum(&:amount_cents)
      delinquency_cents = overdue_invoices.sum(&:amount_cents)
      expenses_cents = delinquency_cents + SYSTEM_COSTS_CENTS
      balance_cents = revenue_cents - expenses_cents
      current_month_revenue_cents = revenue_for_month(paid_invoices, Date.current)
      previous_month_revenue_cents = revenue_for_month(paid_invoices, Date.current.prev_month)

      metrics = {
        revenue_cents: revenue_cents,
        delinquency_cents: delinquency_cents,
        costs_cents: SYSTEM_COSTS_CENTS,
        expenses_cents: expenses_cents,
        balance_cents: balance_cents,
        current_month_revenue_cents: current_month_revenue_cents,
        previous_month_revenue_cents: previous_month_revenue_cents,
        monthly_revenue_change_percentage: percentage_change(current_month_revenue_cents, previous_month_revenue_cents),
        paid_invoices_count: paid_invoices.count,
        overdue_invoices_count: overdue_invoices.count,
        open_invoices_count: invoices.count { |invoice| invoice.status == "open" },
        active_customers_count: Customer.where(status: "active").count,
        chart: {
          "30" => cashflow_for(30, paid_invoices, overdue_invoices),
          "60" => cashflow_for(60, paid_invoices, overdue_invoices),
          "90" => cashflow_for(90, paid_invoices, overdue_invoices)
        }
      }

      metrics.merge(insight: ruby_insight(metrics))
    end

    private

    def overdue?(invoice)
      invoice.status == "open" && invoice.due_date.present? && invoice.due_date < Date.current
    end

    def revenue_for_month(invoices, date)
      invoices.sum do |invoice|
        paid_date = (invoice.paid_at || invoice.updated_at)&.to_date
        paid_date&.year == date.year && paid_date&.month == date.month ? invoice.amount_cents : 0
      end
    end

    def percentage_change(current_value, previous_value)
      return 0 if previous_value.to_i.zero?

      (((current_value - previous_value).to_f / previous_value) * 100).round(1)
    end

    def cashflow_for(days, paid_invoices, overdue_invoices)
      start_date = Date.current - (days - 1).days
      bucket_count = days == 30 ? 4 : 6
      bucket_size = (days.to_f / bucket_count).ceil

      bucket_count.times.map do |index|
        bucket_start = start_date + (index * bucket_size).days
        bucket_end = [bucket_start + (bucket_size - 1).days, Date.current].min

        {
          label: bucket_label(days, index, bucket_start),
          income_cents: income_for_period(paid_invoices, bucket_start, bucket_end),
          expense_cents: expense_for_period(overdue_invoices, bucket_start, bucket_end)
        }
      end
    end

    def bucket_label(days, index, bucket_start)
      return "S#{index + 1}" if days == 30

      bucket_start.strftime("%d/%m")
    end

    def income_for_period(invoices, start_date, end_date)
      invoices.sum do |invoice|
        paid_date = (invoice.paid_at || invoice.updated_at)&.to_date
        paid_date && paid_date.between?(start_date, end_date) ? invoice.amount_cents : 0
      end
    end

    def expense_for_period(invoices, start_date, end_date)
      invoices.sum do |invoice|
        invoice.due_date&.between?(start_date, end_date) ? invoice.amount_cents : 0
      end
    end

    def ruby_insight(metrics)
      revenue = metrics[:revenue_cents].to_i
      expenses = metrics[:expenses_cents].to_i
      margin = revenue.positive? ? (((revenue - expenses).to_f / revenue) * 100).round : 0
      delinquency_rate = revenue.positive? ? ((metrics[:delinquency_cents].to_f / revenue) * 100).round : 0
      score = [[margin - delinquency_rate + 40, 0].max, 100].min

      {
        headline: score >= 70 ? "Risco baixo no trimestre." : "Atenção ao caixa no trimestre.",
        body: "A leitura combina faturas pagas, inadimplência e custos cadastrados. Priorize cobranças vencidas para preservar a margem operacional.",
        health_score: score,
        operational_margin_percentage: margin,
        status: score >= 70 ? "Saudável para reinvestimento" : "Revisar cobranças e despesas"
      }
    end
  end
end