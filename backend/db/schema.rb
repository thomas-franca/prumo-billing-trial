# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_20_004000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "audit_events", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.jsonb "metadata", default: {}, null: false
    t.string "resource_id"
    t.string "resource_type"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id"
    t.index ["action"], name: "index_audit_events_on_action"
    t.index ["created_at"], name: "index_audit_events_on_created_at"
    t.index ["resource_type", "resource_id"], name: "index_audit_events_on_resource_type_and_resource_id"
    t.index ["user_id"], name: "index_audit_events_on_user_id"
  end

  create_table "coupons", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.string "discount_type", null: false
    t.datetime "expires_at"
    t.decimal "percentage", precision: 5, scale: 2
    t.datetime "updated_at", null: false
    t.integer "value_cents"
    t.index ["code"], name: "index_coupons_on_code", unique: true
  end

  create_table "customer_billing_events", force: :cascade do |t|
    t.integer "amount_cents", default: 0, null: false
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.string "details"
    t.date "due_date", null: false
    t.string "event_type", null: false
    t.integer "invoice_id"
    t.string "invoice_number", null: false
    t.string "invoice_status", null: false
    t.datetime "occurred_at", null: false
    t.date "period_end", null: false
    t.date "period_start", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["customer_id"], name: "index_customer_billing_events_on_customer_id"
    t.index ["event_type"], name: "index_customer_billing_events_on_event_type"
    t.index ["occurred_at"], name: "index_customer_billing_events_on_occurred_at"
    t.index ["user_id"], name: "index_customer_billing_events_on_user_id"
  end

  create_table "customer_documents", force: :cascade do |t|
    t.integer "byte_size", null: false
    t.string "checksum_sha256", null: false
    t.string "content_type", null: false
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.binary "file_data", null: false
    t.string "original_filename", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "uploaded_by"
    t.index ["checksum_sha256"], name: "index_customer_documents_on_checksum_sha256"
    t.index ["created_at"], name: "index_customer_documents_on_created_at"
    t.index ["customer_id"], name: "index_customer_documents_on_customer_id"
  end

  create_table "customer_service_events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.string "details"
    t.date "effective_date"
    t.string "event_type", null: false
    t.datetime "occurred_at", null: false
    t.string "service_status", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["customer_id"], name: "index_customer_service_events_on_customer_id"
    t.index ["event_type"], name: "index_customer_service_events_on_event_type"
    t.index ["occurred_at"], name: "index_customer_service_events_on_occurred_at"
    t.index ["user_id"], name: "index_customer_service_events_on_user_id"
  end

  create_table "customers", force: :cascade do |t|
    t.integer "billing_due_day", default: 10, null: false
    t.date "cancel_at"
    t.datetime "canceled_at"
    t.datetime "created_at", null: false
    t.string "document"
    t.string "email"
    t.integer "identifier", null: false
    t.string "legal_name"
    t.string "name", null: false
    t.text "notes"
    t.string "phone"
    t.bigint "product_id"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["cancel_at"], name: "index_customers_on_cancel_at"
    t.index ["canceled_at"], name: "index_customers_on_canceled_at"
    t.index ["identifier"], name: "index_customers_on_identifier", unique: true
    t.index ["product_id"], name: "index_customers_on_product_id"
  end

  create_table "documents", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "document_type", null: false
    t.string "file_url"
    t.string "status", default: "draft", null: false
    t.bigint "subscription_id", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["subscription_id"], name: "index_documents_on_subscription_id"
  end

  create_table "invoices", force: :cascade do |t|
    t.integer "amount_cents", default: 0, null: false
    t.datetime "canceled_at"
    t.bigint "coupon_id"
    t.datetime "created_at", null: false
    t.bigint "customer_id"
    t.string "description"
    t.date "due_date", null: false
    t.datetime "paid_at"
    t.date "period_end", null: false
    t.date "period_start", null: false
    t.bigint "product_id"
    t.string "status", default: "draft", null: false
    t.bigint "subscription_id"
    t.datetime "updated_at", null: false
    t.index ["coupon_id"], name: "index_invoices_on_coupon_id"
    t.index ["customer_id"], name: "index_invoices_on_customer_id"
    t.index ["product_id"], name: "index_invoices_on_product_id"
    t.index ["subscription_id"], name: "index_invoices_on_subscription_id"
  end

  create_table "payment_methods", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.string "customer_name", null: false
    t.string "kind", null: false
    t.string "last_digits"
    t.string "token"
    t.datetime "updated_at", null: false
  end

  create_table "products", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "billing_cycle", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.integer "price_cents", default: 0, null: false
    t.datetime "updated_at", null: false
  end

  create_table "subscriptions", force: :cascade do |t|
    t.string "billing_cycle", null: false
    t.datetime "cancel_at"
    t.datetime "canceled_at"
    t.bigint "coupon_id"
    t.datetime "created_at", null: false
    t.string "customer_email", null: false
    t.string "customer_name", null: false
    t.integer "due_day", null: false
    t.bigint "payment_method_id"
    t.bigint "product_id", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["coupon_id"], name: "index_subscriptions_on_coupon_id"
    t.index ["payment_method_id"], name: "index_subscriptions_on_payment_method_id"
    t.index ["product_id"], name: "index_subscriptions_on_product_id"
  end

  create_table "tax_documents", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "external_reference"
    t.bigint "invoice_id", null: false
    t.datetime "issued_at"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["invoice_id"], name: "index_tax_documents_on_invoice_id"
  end

  create_table "user_sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "ip_address"
    t.datetime "last_used_at"
    t.datetime "revoked_at"
    t.string "token_digest", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id", null: false
    t.index ["expires_at"], name: "index_user_sessions_on_expires_at"
    t.index ["revoked_at"], name: "index_user_sessions_on_revoked_at"
    t.index ["token_digest"], name: "index_user_sessions_on_token_digest", unique: true
    t.index ["user_id"], name: "index_user_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "password_digest", null: false
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.string "username", null: false
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "audit_events", "users"
  add_foreign_key "customer_billing_events", "customers"
  add_foreign_key "customer_billing_events", "users"
  add_foreign_key "customer_documents", "customers"
  add_foreign_key "customer_service_events", "customers"
  add_foreign_key "customer_service_events", "users"
  add_foreign_key "customers", "products"
  add_foreign_key "documents", "subscriptions"
  add_foreign_key "invoices", "coupons"
  add_foreign_key "invoices", "customers"
  add_foreign_key "invoices", "products"
  add_foreign_key "invoices", "subscriptions"
  add_foreign_key "subscriptions", "coupons"
  add_foreign_key "subscriptions", "payment_methods"
  add_foreign_key "subscriptions", "products"
  add_foreign_key "tax_documents", "invoices"
  add_foreign_key "user_sessions", "users"
end
