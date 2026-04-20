module Invoices
  class ScheduleMonthlyGenerationJob < ApplicationJob
    queue_as :default

    def perform(reference_date = Date.current)
      Subscription.where(status: "active", due_day: reference_date.day).find_each do |subscription|
        Invoices::GenerateService.call(subscription: subscription, due_date: reference_date)
      end
    end
  end
end