module Api
  module V1
    class TaxDocumentsController < BaseController
      def index
        render json: invoice.tax_documents.order(created_at: :desc)
      end

      def show
        render json: invoice.tax_documents.find(params[:id])
      end

      def create
        render json: TaxDocuments::IssueService.call(invoice: invoice), status: :created
      end

      private

      def invoice
        @invoice ||= Invoice.find(params[:invoice_id])
      end
    end
  end
end