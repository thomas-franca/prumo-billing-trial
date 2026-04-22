module Api
  module V1
    class PaymentMethodsController < BaseController
      def index
        render json: PaymentMethod.order(created_at: :desc).map { |payment_method| serialize_payment_method(payment_method) }
      end

      def show
        render json: serialize_payment_method(payment_method)
      end

      def create
        render json: serialize_payment_method(PaymentMethod.create!(payment_method_params)), status: :created
      end

      def update
        payment_method.update!(payment_method_params)
        render json: serialize_payment_method(payment_method)
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

      def serialize_payment_method(payment_method)
        payment_method.as_json(only: %i[id customer_name kind last_digits active created_at updated_at])
      end
    end
  end
end