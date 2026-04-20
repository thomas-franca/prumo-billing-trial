module Api
  module V1
    class DocumentsController < BaseController
      def index
        render json: Document.order(created_at: :desc)
      end

      def show
        render json: document
      end

      def create
        render json: Document.create!(document_params), status: :created
      end

      def update
        document.update!(document_params)
        render json: document
      end

      def destroy
        document.destroy!
        head :no_content
      end

      private

      def document
        @document ||= Document.find(params[:id])
      end

      def document_params
        params.require(:document).permit(:subscription_id, :title, :document_type, :status, :file_url)
      end
    end
  end
end