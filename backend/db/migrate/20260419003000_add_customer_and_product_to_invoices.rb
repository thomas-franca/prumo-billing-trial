class AddCustomerAndProductToInvoices < ActiveRecord::Migration[8.1]
  def change
    change_column_null :invoices, :subscription_id, true
    add_reference :invoices, :customer, foreign_key: true
    add_reference :invoices, :product, foreign_key: true
    add_column :invoices, :description, :string
  end
end