module Api
  module V1
    class CouponsController < BaseController
      def index
        render json: Coupon.order(created_at: :desc)
      end

      def show
        render json: coupon
      end

      def create
        render json: Coupon.create!(coupon_params), status: :created
      end

      def update
        coupon.update!(coupon_params)
        render json: coupon
      end

      def destroy
        coupon.destroy!
        head :no_content
      end

      private

      def coupon
        @coupon ||= Coupon.find(params[:id])
      end

      def coupon_params
        params.require(:coupon).permit(:code, :discount_type, :value_cents, :percentage, :active, :expires_at)
      end
    end
  end
end