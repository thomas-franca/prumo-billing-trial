class CustomerBillingEvent < ApplicationRecord
  EVENT_TYPES = %w[
    invoice_generated
    invoice_updated
    invoice_paid
    invoice_canceled
    invoice_reactivated
    invoice_deleted
  ].freeze

  belongs_to :customer
  belongs_to :user, optional: true

  validates :event_type, inclusion: { in: EVENT_TYPES }
  validates :invoice_number, :invoice_status, :period_start, :period_end, :due_date, :occurred_at, presence: true
  validates :amount_cents, numericality: { greater_than_or_equal_to: 0 }
end