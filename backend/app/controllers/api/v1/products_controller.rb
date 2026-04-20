module Api
  module V1
    class ProductsController < BaseController
      def index
        render json: Product.order(:name)
      end

      def show
        render json: product
      end

      def create
        render json: Product.create!(product_params), status: :created
      end

      def update
        product.update!(product_params)
        render json: product
      end

      def destroy
        product.destroy!
        head :no_content
      end

      private

      def product
        @product ||= Product.find(params[:id])
      end

      def product_params
        params.require(:product).permit(:name, :description, :price_cents, :billing_cycle, :active)
      end
    end
  end
end