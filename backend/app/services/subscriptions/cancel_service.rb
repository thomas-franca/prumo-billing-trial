module Subscriptions
  class CancelService
    def self.call(...)
      new(...).call
    end

    def initialize(subscription:, cancel_at_period_end: false)
      @subscription = subscription
      @cancel_at_period_end = cancel_at_period_end
    end

    def call
      if cancel_at_period_end
        subscription.update!(cancel_at: next_cycle_date)
      else
        subscription.update!(status: "canceled", canceled_at: Time.current, cancel_at: nil)
      end

      subscription
    end

    private

    attr_reader :subscription, :cancel_at_period_end

    def next_cycle_date
      base_date = Date.current.change(day: [subscription.due_day, Date.current.end_of_month.day].min)
      base_date.future? ? base_date : base_date.next_month
    end
  end
end