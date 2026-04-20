class AddInvoicePeriodsAndCustomerHistory < ActiveRecord::Migration[8.1]
  def change
    add_column :customers, :billing_due_day, :integer, null: false, default: 10

    add_column :invoices, :period_start, :date
    add_column :invoices, :period_end, :date

    reversible do |direction|
      direction.up do
        execute <<~SQL.squish
          UPDATE invoices
          SET
            period_start = date_trunc('month', due_date)::date,
            period_end = (date_trunc('month', due_date)::date + interval '1 month - 1 day')::date
          WHERE period_start IS NULL OR period_end IS NULL
        SQL
      end
    end

    change_column_null :invoices, :period_start, false
    change_column_null :invoices, :period_end, false

    create_table :customer_billing_events do |t|
      t.references :customer, null: false, foreign_key: true
      t.string :event_type, null: false
      t.integer :invoice_id
      t.string :invoice_number, null: false
      t.integer :amount_cents, null: false, default: 0
      t.string :invoice_status, null: false
      t.date :period_start, null: false
      t.date :period_end, null: false
      t.date :due_date, null: false
      t.datetime :occurred_at, null: false
      t.string :details
      t.timestamps
    end

    add_index :customer_billing_events, :event_type
    add_index :customer_billing_events, :occurred_at
  end
end