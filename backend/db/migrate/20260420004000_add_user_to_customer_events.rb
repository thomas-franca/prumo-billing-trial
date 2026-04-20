class AddUserToCustomerEvents < ActiveRecord::Migration[8.1]
  def change
    add_reference :customer_billing_events, :user, foreign_key: true
    add_reference :customer_service_events, :user, foreign_key: true
  end
end