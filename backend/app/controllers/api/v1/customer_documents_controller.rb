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

        metadata_error = upload_metadata_error(file)
        if metadata_error
          render json: { error: metadata_error[:message] }, status: metadata_error[:status]
          return
        end

        file_data = file.read
        unless valid_pdf_content?(file_data)
          render json: { error: "O conteudo enviado nao parece ser um PDF valido." }, status: :unprocessable_entity
          return
        end

        created_document = customer.customer_documents.create!(
          title: document_title(file),
          original_filename: safe_filename(file),
          content_type: "application/pdf",
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
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Content-Security-Policy"] = "default-src 'none'; sandbox"
        send_data(
          customer_document.file_data,
          filename: customer_document.original_filename,
          type: "application/pdf",
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
        params[:title].presence || File.basename(safe_filename(file), ".pdf")
      end

      def upload_metadata_error(file)
        size = file.size.to_i
        return { message: "Arquivo PDF vazio.", status: :unprocessable_entity } if size <= 0

        if size > MAX_FILE_SIZE
          return { message: "Arquivo PDF excede o limite de #{MAX_FILE_SIZE / 1.megabyte} MB.", status: :payload_too_large }
        end

        return if safe_filename(file).downcase.end_with?(".pdf")

        { message: "Envie apenas arquivos PDF.", status: :unprocessable_entity }
      end

      def valid_pdf_content?(file_data)
        file_data.start_with?("%PDF-")
      end

      def safe_filename(file)
        File.basename(file.original_filename.to_s).presence || "document.pdf"
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