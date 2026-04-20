class CreateCustomerServiceEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :customer_service_events do |t|
      t.references :customer, null: false, foreign_key: true
      t.string :event_type, null: false
      t.string :service_status, null: false
      t.date :effective_date
      t.datetime :occurred_at, null: false
      t.string :details
      t.timestamps
    end

    add_index :customer_service_events, :event_type
    add_index :customer_service_events, :occurred_at
  end
end