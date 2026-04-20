module TaxDocuments
  class IssueService
    def self.call(...)
      new(...).call
    end

    def initialize(invoice:)
      @invoice = invoice
    end

    def call
      invoice.tax_documents.create!(
        status: "pending",
        external_reference: SecureRandom.uuid,
        issued_at: nil
      )
    end

    private

    attr_reader :invoice
  end
end