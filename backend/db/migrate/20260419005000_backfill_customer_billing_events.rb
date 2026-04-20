class BackfillCustomerBillingEvents < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL.squish
      INSERT INTO customer_billing_events (
        customer_id, event_type, invoice_id, invoice_number, amount_cents, invoice_status,
        period_start, period_end, due_date, occurred_at, details, created_at, updated_at
      )
      SELECT
        invoices.customer_id,
        'invoice_generated',
        invoices.id,
        '#' || invoices.id,
        invoices.amount_cents,
        'open',
        invoices.period_start,
        invoices.period_end,
        invoices.due_date,
        invoices.created_at,
        'Fatura gerada',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM invoices
      WHERE invoices.customer_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM customer_billing_events
          WHERE customer_billing_events.invoice_id = invoices.id
            AND customer_billing_events.event_type = 'invoice_generated'
        )
    SQL

    execute <<~SQL.squish
      INSERT INTO customer_billing_events (
        customer_id, event_type, invoice_id, invoice_number, amount_cents, invoice_status,
        period_start, period_end, due_date, occurred_at, details, created_at, updated_at
      )
      SELECT
        invoices.customer_id,
        'invoice_canceled',
        invoices.id,
        '#' || invoices.id,
        invoices.amount_cents,
        'canceled',
        invoices.period_start,
        invoices.period_end,
        invoices.due_date,
        invoices.canceled_at,
        'Fatura cancelada',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM invoices
      WHERE invoices.customer_id IS NOT NULL
        AND invoices.canceled_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM customer_billing_events
          WHERE customer_billing_events.invoice_id = invoices.id
            AND customer_billing_events.event_type = 'invoice_canceled'
        )
    SQL

    execute <<~SQL.squish
      INSERT INTO customer_billing_events (
        customer_id, event_type, invoice_id, invoice_number, amount_cents, invoice_status,
        period_start, period_end, due_date, occurred_at, details, created_at, updated_at
      )
      SELECT
        invoices.customer_id,
        'invoice_paid',
        invoices.id,
        '#' || invoices.id,
        invoices.amount_cents,
        'paid',
        invoices.period_start,
        invoices.period_end,
        invoices.due_date,
        invoices.paid_at,
        'Fatura paga',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM invoices
      WHERE invoices.customer_id IS NOT NULL
        AND invoices.paid_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM customer_billing_events
          WHERE customer_billing_events.invoice_id = invoices.id
            AND customer_billing_events.event_type = 'invoice_paid'
        )
    SQL

    execute <<~SQL.squish
      UPDATE invoices
      SET canceled_at = NULL
      WHERE status = 'paid'
    SQL
  end

  def down
    execute <<~SQL.squish
      DELETE FROM customer_billing_events
      WHERE event_type IN ('invoice_generated', 'invoice_canceled', 'invoice_paid')
    SQL
  end
end