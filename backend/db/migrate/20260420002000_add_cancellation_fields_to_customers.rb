class AddCancellationFieldsToCustomers < ActiveRecord::Migration[8.1]
  def change
    add_column :customers, :cancel_at, :date
    add_column :customers, :canceled_at, :datetime

    add_index :customers, :cancel_at
    add_index :customers, :canceled_at
  end
end