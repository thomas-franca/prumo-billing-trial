module Api
  module V1
    class PaymentMethodsController < BaseController
      def index
        render json: PaymentMethod.order(created_at: :desc)
      end

      def show
        render json: payment_method
      end

      def create
        render json: PaymentMethod.create!(payment_method_params), status: :created
      end

      def update
        payment_method.update!(payment_method_params)
        render json: payment_method
      end

      def destroy
        payment_method.destroy!
        head :no_content
      end

      private

      def payment_method
        @payment_method ||= PaymentMethod.find(params[:id])
      end

      def payment_method_params
        params.require(:payment_method).permit(:customer_name, :kind, :token, :last_digits, :active)
      end
    end
  end
end