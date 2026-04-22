class Invoice < ApplicationRecord
  belongs_to :subscription, optional: true
  belongs_to :customer, optional: true
  belongs_to :product, optional: true
  belongs_to :coupon, optional: true

  has_many :tax_documents, dependent: :destroy

  before_validation :assign_customer_plan
  before_validation :assign_billing_dates
  after_create_commit :record_invoice_generated
  before_destroy :record_invoice_deleted

  validates :amount_cents, :due_date, :period_start, :period_end, :status, presence: true
  validates :amount_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :status, inclusion: { in: %w[draft open paid failed canceled] }
  validate :billable_reference_present
  validate :customer_plan_present
  validate :period_end_cannot_precede_period_start

  def editable?
    status == "open"
  end

  def cancellable?
    status == "open" || status == "failed"
  end

  def reactivatable?
    status == "canceled"
  end

  def subtotal_cents
    product&.price_cents.to_i
  end

  def discount_cents
    coupon&.discount_amount_for(subtotal_cents).to_i
  end

  def invoice_number
    "##{id}"
  end

  def period_label
    "#{period_start.strftime('%d/%m/%Y')} até #{period_end.strftime('%d/%m/%Y')}"
  end

  def record_paid!
    with_lock do
      unless editable?
        errors.add(:base, "Somente faturas abertas podem ser marcadas como pagas")
        raise ActiveRecord::RecordInvalid, self
      end

      update!(status: "paid", paid_at: Time.current, canceled_at: nil)
      record_billing_event!("invoice_paid", "Fatura paga")
    end
  end

  def record_canceled!
    with_lock do
      unless cancellable?
        errors.add(:base, "Somente faturas abertas ou falhas podem ser canceladas")
        raise ActiveRecord::RecordInvalid, self
      end

      update!(status: "canceled", canceled_at: Time.current)
      record_billing_event!("invoice_canceled", "Fatura cancelada")
    end
  end

  def record_reactivated!
    with_lock do
      unless reactivatable?
        errors.add(:base, "Somente faturas canceladas podem ser reativadas")
        raise ActiveRecord::RecordInvalid, self
      end

      update!(status: "open", canceled_at: nil)
      record_billing_event!("invoice_reactivated", "Fatura reativada")
    end
  end

  def record_billing_event!(event_type, details)
    return unless customer

    customer.customer_billing_events.create!(
      event_type: event_type,
      invoice_id: id,
      invoice_number: invoice_number,
      amount_cents: amount_cents,
      invoice_status: status,
      period_start: period_start,
      period_end: period_end,
      due_date: due_date,
      occurred_at: Time.current,
      user: Current.user,
      details: details
    )
  end

  private

  def assign_billing_dates
    self.period_start ||= Date.current.beginning_of_month
    self.period_end ||= default_period_end
    self.due_date ||= default_due_date
  end

  def assign_customer_plan
    return unless customer

    self.product = customer.product
    self.amount_cents = [subtotal_cents - discount_cents, 0].max if customer.product
    self.description = "Fatura - #{customer.product.name}" if customer.product
  end

  def default_period_end
    return period_start.end_of_year if product&.billing_cycle == "yearly"

    period_start.end_of_month
  end

  def default_due_date
    due_day = customer&.billing_due_day || 10
    candidate = safe_date(Date.current.year, Date.current.month, due_day)
    return candidate if candidate >= Date.current

    next_month = Date.current.next_month
    safe_date(next_month.year, next_month.month, due_day)
  end

  def safe_date(year, month, day)
    Date.new(year, month, [day, Time.days_in_month(month, year)].min)
  end

  def billable_reference_present
    return if subscription.present? || customer.present?

    errors.add(:base, "Informe uma assinatura ou cliente para gerar a fatura")
  end

  def customer_plan_present
    return unless customer
    return if customer.product.present?

    errors.add(:base, "Cadastre um plano no cliente antes de gerar a fatura")
  end

  def period_end_cannot_precede_period_start
    return if period_start.blank? || period_end.blank? || period_end >= period_start

    errors.add(:period_end, "não pode ser anterior ao início do período")
  end

  def record_invoice_generated
    record_billing_event!("invoice_generated", "Fatura gerada")
  end

  def record_invoice_deleted
    record_billing_event!("invoice_deleted", "Fatura excluída")
  end
end