class Subscription < ApplicationRecord
  belongs_to :product
  belongs_to :payment_method, optional: true
  belongs_to :coupon, optional: true

  has_many :invoices, dependent: :restrict_with_error
  has_many :documents, dependent: :destroy

  validates :customer_name, :customer_email, :billing_cycle, :due_day, :status, presence: true
  validates :status, inclusion: { in: %w[active canceled past_due suspended] }
  validates :billing_cycle, inclusion: { in: %w[monthly yearly] }
  validates :due_day, numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 31 }
end