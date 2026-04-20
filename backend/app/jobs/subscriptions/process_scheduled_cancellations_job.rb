module Subscriptions
  class ProcessScheduledCancellationsJob < ApplicationJob
    queue_as :default

    def perform(reference_time = Time.current)
      Subscription.where(status: "active").where("cancel_at <= ?", reference_time).find_each do |subscription|
        subscription.update!(status: "canceled", canceled_at: reference_time)
      end
    end
  end
end