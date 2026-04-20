class Customer < ApplicationRecord
  belongs_to :product

  has_many :invoices, dependent: :restrict_with_error
  has_many :customer_billing_events, dependent: :destroy
  has_many :customer_documents, dependent: :destroy
  has_many :customer_service_events, dependent: :destroy

  validates :identifier, :name, :billing_due_day, :product, presence: true
  validates :identifier, numericality: { only_integer: true, greater_than: 0 }, uniqueness: true
  validates :billing_due_day, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 31 }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
  validates :status, inclusion: { in: %w[active inactive canceled] }
  validates :legal_name, presence: true, if: :company?

  before_validation :assign_identifier, on: :create
  before_validation :assign_billing_due_day, on: :create
  before_validation :normalize_document
  before_validation :normalize_legal_name

  def identifier_label
    "identificador:#{identifier}"
  end

  def company?
    document_digits.length > 11
  end

  def service_status
    return "canceled" if status == "canceled"
    return "scheduled_cancellation" if cancel_at.present?

    "active"
  end

  def service_status_label
    case service_status
    when "canceled"
      "Cancelado"
    when "scheduled_cancellation"
      "Cancelamento agendado para #{cancel_at.strftime('%d/%m/%Y')}"
    else
      "Ativo"
    end
  end

  def current_period_end
    last_invoice_period_end = invoices.where(status: %w[open paid]).maximum(:period_end)
    return last_invoice_period_end if last_invoice_period_end.present? && last_invoice_period_end >= Date.current

    return Date.current.end_of_year if product&.billing_cycle == "yearly"

    Date.current.end_of_month
  end

  def current_period_end_label
    current_period_end.strftime("%d/%m/%Y")
  end

  def record_service_event!(event_type, details, effective_date: nil)
    customer_service_events.create!(
      event_type: event_type,
      service_status: service_status,
      effective_date: effective_date,
      occurred_at: Time.current,
      user: Current.user,
      details: details
    )
  end

  private

  def assign_identifier
    self.identifier ||= Customer.maximum(:identifier).to_i + 1
  end

  def assign_billing_due_day
    self.billing_due_day ||= 10
  end

  def normalize_document
    digits = document_digits
    self.document =
      if digits.blank?
        nil
      elsif digits.length <= 11
        format_cpf(digits)
      else
        format_cnpj(digits)
      end
  end

  def normalize_legal_name
    self.legal_name = nil unless company?
    self.legal_name = legal_name.to_s.strip.presence if company?
  end

  def document_digits
    document.to_s.gsub(/\D/, "")
  end

  def format_cpf(digits)
    return digits unless digits.length == 11

    "#{digits[0, 3]}.#{digits[3, 3]}.#{digits[6, 3]}-#{digits[9, 2]}"
  end

  def format_cnpj(digits)
    cnpj = digits[0, 14]
    return cnpj unless cnpj.length == 14

    "#{cnpj[0, 2]}.#{cnpj[2, 3]}.#{cnpj[5, 3]}/#{cnpj[8, 4]}-#{cnpj[12, 2]}"
  end
end