module TaxDocuments
  class AutoIssueJob < ApplicationJob
    queue_as :default

    def perform(invoice_id)
      invoice = Invoice.find(invoice_id)
      return unless invoice.status == "paid"

      TaxDocuments::IssueService.call(invoice: invoice)
    end
  end
end