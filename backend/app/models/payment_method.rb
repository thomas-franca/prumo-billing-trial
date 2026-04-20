class PaymentMethod < ApplicationRecord
  has_many :subscriptions, dependent: :restrict_with_error

  validates :customer_name, :kind, presence: true
  validates :kind, inclusion: { in: %w[credit_card boleto pix] }
end