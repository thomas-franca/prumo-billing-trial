admin_password = ENV.fetch("ADMIN_PASSWORD", "Prumo2026!Admin#")

admin_user = User.find_or_initialize_by(username: "dev-prumo")
admin_user.assign_attributes(
  first_name: "Dev",
  last_name: "Prumo",
  role: "administrator",
  password: admin_password,
  password_confirmation: admin_password
)
admin_user.save!

Current.user = admin_user if defined?(Current)

def upsert_product(name:, description:, price_cents:, billing_cycle: "monthly", active: true)
  product = Product.find_or_initialize_by(name: name)
  product.assign_attributes(
    description: description,
    price_cents: price_cents,
    billing_cycle: billing_cycle,
    active: active
  )
  product.save!
  product
end

def upsert_coupon(code:, discount_type:, percentage: nil, value_cents: nil, active: true, expires_at: nil)
  coupon = Coupon.find_or_initialize_by(code: code)
  coupon.assign_attributes(
    discount_type: discount_type,
    percentage: percentage,
    value_cents: value_cents,
    active: active,
    expires_at: expires_at
  )
  coupon.save!
  coupon
end

def upsert_customer(identifier:, product:, name:, email:, phone:, document:, legal_name: nil, billing_due_day: 10, status: "active", notes: nil, cancel_at: nil, canceled_at: nil)
  customer = Customer.find_or_initialize_by(identifier: identifier)
  customer.assign_attributes(
    product: product,
    name: name,
    email: email,
    phone: phone,
    document: document,
    legal_name: legal_name,
    billing_due_day: billing_due_day,
    status: status,
    notes: notes,
    cancel_at: cancel_at,
    canceled_at: canceled_at
  )
  customer.save!
  customer
end

def upsert_invoice(customer:, period_start:, period_end:, due_date:, status:, coupon: nil, paid_at: nil, canceled_at: nil)
  invoice = Invoice.find_or_initialize_by(
    customer: customer,
    period_start: period_start,
    period_end: period_end
  )

  invoice.assign_attributes(
    product: customer.product,
    coupon: coupon,
    due_date: due_date,
    status: status,
    paid_at: paid_at,
    canceled_at: canceled_at
  )
  invoice.save!
  invoice
end

def record_service_event_once(customer:, event_type:, details:, effective_date: nil)
  return if customer.customer_service_events.exists?(event_type: event_type, details: details)

  customer.customer_service_events.create!(
    event_type: event_type,
    service_status: customer.service_status,
    effective_date: effective_date,
    occurred_at: Time.current,
    user: Current.user,
    details: details
  )
end

starter_product = upsert_product(
  name: "Plano Starter",
  description: "Assinatura inicial para pequenas empresas",
  price_cents: 9900
)

basic_product = upsert_product(
  name: "Plano Basic",
  description: "Assinatura para empresas de médio porte",
  price_cents: 25000
)

enterprise_product = upsert_product(
  name: "Plano Enterprise",
  description: "Operação financeira completa para times em escala",
  price_cents: 42800
)

trial_coupon = upsert_coupon(
  code: "TRIAL10",
  discount_type: "percentage",
  percentage: 10,
  active: true,
  expires_at: 90.days.from_now
)

upsert_coupon(
  code: "WELCOME50",
  discount_type: "fixed_amount",
  value_cents: 5000,
  active: true,
  expires_at: 90.days.from_now
)

novalink = upsert_customer(
  identifier: 1,
  product: starter_product,
  name: "NovaLink",
  email: "financeiro@novalink.test",
  phone: "(11) 4002-1001",
  document: "12345678000190",
  legal_name: "NovaLink Tecnologia LTDA",
  billing_due_day: 10,
  notes: "Cliente PJ demonstrativo com faturas abertas e pagas."
)

novo_test = upsert_customer(
  identifier: 2,
  product: basic_product,
  name: "NovoTest",
  email: "teste@novotest.test",
  phone: "(41) 3122-2000",
  document: "12345678901",
  billing_due_day: 15,
  notes: "Cliente PF demonstrativo para validar ciclo mensal."
)

mercado_atlas = upsert_customer(
  identifier: 3,
  product: enterprise_product,
  name: "Mercado Atlas",
  email: "billing@mercadoatlas.test",
  phone: "(31) 3555-8800",
  document: "33222111000144",
  legal_name: "Mercado Atlas Pagamentos LTDA",
  billing_due_day: 20,
  notes: "Cliente enterprise com cancelamento agendado para fim do período.",
  cancel_at: Date.current.end_of_month
)

upsert_customer(
  identifier: 4,
  product: starter_product,
  name: "Cliente Cancelado Demo",
  email: "cancelado@demo.test",
  phone: "(21) 3000-4040",
  document: "44555666000177",
  legal_name: "Cliente Cancelado Demo LTDA",
  billing_due_day: 5,
  status: "canceled",
  canceled_at: 5.days.ago,
  notes: "Cadastro cancelado para validar bloqueios da interface."
)

previous_month = Date.current.prev_month
current_month = Date.current

upsert_invoice(
  customer: novalink,
  period_start: previous_month.beginning_of_month,
  period_end: previous_month.end_of_month,
  due_date: Date.new(previous_month.year, previous_month.month, novalink.billing_due_day),
  status: "paid",
  paid_at: previous_month.end_of_month
)

upsert_invoice(
  customer: novalink,
  period_start: current_month.beginning_of_month,
  period_end: current_month.end_of_month,
  due_date: Date.new(current_month.year, current_month.month, novalink.billing_due_day),
  status: "open"
)

upsert_invoice(
  customer: novo_test,
  period_start: previous_month.beginning_of_month,
  period_end: previous_month.end_of_month,
  due_date: Date.new(previous_month.year, previous_month.month, novo_test.billing_due_day),
  status: "paid",
  paid_at: 12.days.ago,
  coupon: trial_coupon
)

upsert_invoice(
  customer: novo_test,
  period_start: current_month.beginning_of_month,
  period_end: current_month.end_of_month,
  due_date: Date.current - 2.days,
  status: "open"
)

upsert_invoice(
  customer: mercado_atlas,
  period_start: previous_month.beginning_of_month,
  period_end: previous_month.end_of_month,
  due_date: Date.new(previous_month.year, previous_month.month, mercado_atlas.billing_due_day),
  status: "paid",
  paid_at: 7.days.ago
)

upsert_invoice(
  customer: mercado_atlas,
  period_start: current_month.beginning_of_month,
  period_end: current_month.end_of_month,
  due_date: Date.new(current_month.year, current_month.month, mercado_atlas.billing_due_day),
  status: "canceled",
  canceled_at: 1.day.ago
)

record_service_event_once(
  customer: mercado_atlas,
  event_type: "service_cancellation_scheduled",
  effective_date: mercado_atlas.cancel_at,
  details: "Cancelamento agendado para o fim do período #{mercado_atlas.cancel_at.strftime('%d/%m/%Y')}."
)

puts "Trial pronto. Login: dev-prumo / #{admin_password}"