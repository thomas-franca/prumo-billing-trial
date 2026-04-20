class Product < ApplicationRecord
  has_many :subscriptions, dependent: :restrict_with_error
  has_many :invoices, dependent: :restrict_with_error
  has_many :customers, dependent: :restrict_with_error

  validates :name, :billing_cycle, presence: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :billing_cycle, inclusion: { in: %w[monthly yearly] }
end