module Invoices
  class GenerateService
    def self.call(...)
      new(...).call
    end

    def initialize(subscription:, due_date: Date.current)
      @subscription = subscription
      @due_date = due_date
    end

    def call
      Invoice.create!(
        subscription: subscription,
        coupon: subscription.coupon,
        status: "open",
        amount_cents: discounted_amount_cents,
        due_date: due_date
      )
    end

    private

    attr_reader :subscription, :due_date

    def discounted_amount_cents
      amount = subscription.product.price_cents
      coupon = subscription.coupon
      return amount unless coupon&.applicable?

      [amount - coupon.discount_amount_for(amount), 0].max
    end
  end
end