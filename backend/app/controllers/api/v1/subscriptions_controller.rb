module Api
  module V1
    class SubscriptionsController < BaseController
      def index
        render json: Subscription.includes(:product).order(created_at: :desc)
      end

      def show
        render json: subscription
      end

      def create
        render json: Subscription.create!(subscription_params), status: :created
      end

      def update
        subscription.update!(subscription_params)
        render json: subscription
      end

      def destroy
        subscription.destroy!
        head :no_content
      end

      def cancel
        render json: Subscriptions::CancelService.call(
          subscription: subscription,
          cancel_at_period_end: ActiveModel::Type::Boolean.new.cast(params[:cancel_at_period_end])
        )
      end

      def reactivate
        subscription.update!(status: "active", cancel_at: nil, canceled_at: nil)
        render json: subscription
      end

      private

      def subscription
        @subscription ||= Subscription.find(params[:id])
      end

      def subscription_params
        params.require(:subscription).permit(
          :product_id,
          :payment_method_id,
          :customer_name,
          :customer_email,
          :billing_cycle,
          :due_day,
          :status,
          :coupon_id
        )
      end
    end
  end
end