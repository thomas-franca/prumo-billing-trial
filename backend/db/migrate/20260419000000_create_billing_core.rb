class CreateBillingCore < ActiveRecord::Migration[8.1]
  def change
    create_table :products do |t|
      t.string :name, null: false
      t.text :description
      t.integer :price_cents, null: false, default: 0
      t.string :billing_cycle, null: false
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    create_table :coupons do |t|
      t.string :code, null: false
      t.string :discount_type, null: false
      t.integer :value_cents
      t.decimal :percentage, precision: 5, scale: 2
      t.boolean :active, null: false, default: true
      t.datetime :expires_at
      t.timestamps
    end
    add_index :coupons, :code, unique: true

    create_table :payment_methods do |t|
      t.string :customer_name, null: false
      t.string :kind, null: false
      t.string :token
      t.string :last_digits
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    create_table :subscriptions do |t|
      t.references :product, null: false, foreign_key: true
      t.references :payment_method, foreign_key: true
      t.references :coupon, foreign_key: true
      t.string :customer_name, null: false
      t.string :customer_email, null: false
      t.string :billing_cycle, null: false
      t.integer :due_day, null: false
      t.string :status, null: false, default: "active"
      t.datetime :cancel_at
      t.datetime :canceled_at
      t.timestamps
    end

    create_table :invoices do |t|
      t.references :subscription, null: false, foreign_key: true
      t.references :coupon, foreign_key: true
      t.string :status, null: false, default: "draft"
      t.integer :amount_cents, null: false, default: 0
      t.date :due_date, null: false
      t.datetime :paid_at
      t.datetime :canceled_at
      t.timestamps
    end

    create_table :tax_documents do |t|
      t.references :invoice, null: false, foreign_key: true
      t.string :status, null: false, default: "pending"
      t.string :external_reference
      t.datetime :issued_at
      t.timestamps
    end

    create_table :documents do |t|
      t.references :subscription, null: false, foreign_key: true
      t.string :title, null: false
      t.string :document_type, null: false
      t.string :status, null: false, default: "draft"
      t.string :file_url
      t.timestamps
    end
  end
end