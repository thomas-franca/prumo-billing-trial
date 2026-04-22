class Coupon < ApplicationRecord
  has_many :subscriptions, dependent: :nullify
  has_many :invoices, dependent: :nullify

  validates :code, presence: true, uniqueness: true
  validates :discount_type, inclusion: { in: %w[percentage fixed_amount] }
  validates :percentage, numericality: { greater_than: 0, less_than_or_equal_to: 100 }, allow_nil: true
  validates :value_cents, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validate :required_discount_value

  def applicable?
    active? && (expires_at.blank? || expires_at.future?)
  end

  def discount_amount_for(amount_cents)
    return 0 unless applicable?

    discount =
      if discount_type == "percentage"
        (amount_cents * percentage / 100).round
      else
        value_cents.to_i
      end

    [discount, amount_cents].min
  end

  private

  def required_discount_value
    if discount_type == "percentage"
      errors.add(:percentage, "deve ser informado para cupom percentual") if percentage.blank?
      errors.add(:value_cents, "não deve ser informado para cupom percentual") if value_cents.present? && value_cents.positive?
    elsif discount_type == "fixed_amount"
      errors.add(:value_cents, "deve ser informado para cupom de valor fixo") if value_cents.blank?
      errors.add(:percentage, "não deve ser informado para cupom de valor fixo") if percentage.present? && percentage.positive?
    end
  end
end