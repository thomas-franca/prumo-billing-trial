module Subscriptions
  class CheckDefaultersJob < ApplicationJob
    queue_as :default

    def perform(reference_date = Date.current)
      Invoice.where(status: "open").where("due_date < ?", reference_date - 30.days).find_each do |invoice|
        invoice.subscription.update!(status: "suspended")
      end
    end
  end
end