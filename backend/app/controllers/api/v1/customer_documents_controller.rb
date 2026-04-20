require "digest"

module Api
  module V1
    class CustomerDocumentsController < BaseController
      MAX_FILE_SIZE = CustomerDocument::MAX_FILE_SIZE

      def index
        scope = CustomerDocument.includes(:customer).order(created_at: :desc)
        scope = scope.where(customer_id: params[:customer_id]) if params[:customer_id].present?

        render json: scope.map { |document| serialize_document(document) }
      end

      def show
        render json: serialize_document(customer_document)
      end

      def create
        file = params[:file]
        raise ActionController::ParameterMissing, "file" unless file

        file_data = file.read
        created_document = customer.customer_documents.create!(
          title: document_title(file),
          original_filename: File.basename(file.original_filename.to_s),
          content_type: file.content_type,
          byte_size: file_data.bytesize,
          checksum_sha256: Digest::SHA256.hexdigest(file_data),
          uploaded_by: current_user.username,
          file_data: file_data
        )

        render json: serialize_document(created_document), status: :created
      end

      def destroy
        customer_document.destroy!
        head :no_content
      end

      def download
        send_data(
          customer_document.file_data,
          filename: customer_document.original_filename,
          type: customer_document.content_type,
          disposition: "attachment"
        )
      end

      private

      def customer
        @customer ||= Customer.find(params[:customer_id])
      end

      def customer_document
        @customer_document ||= CustomerDocument.includes(:customer).find(params[:id])
      end

      def document_title(file)
        params[:title].presence || File.basename(file.original_filename.to_s, ".pdf")
      end

      def serialize_document(document)
        document.as_json(
          only: %i[id customer_id title original_filename content_type byte_size checksum_sha256 uploaded_by created_at updated_at]
        ).merge(
          customer_name: document.customer.name,
          customer_identifier: document.customer.identifier_label,
          download_url: "/api/v1/customer_documents/#{document.id}/download"
        )
      end
    end
  end
end