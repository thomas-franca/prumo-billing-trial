module Api
  module V1
    class CustomerCancellationsController < BaseController
      def create
        Customers::CancellationService.call(
          customer: customer,
          mode: cancellation_params[:mode],
          cancel_at: cancellation_params[:cancel_at]
        )

        render json: serialize_customer(customer.reload)
      end

      def destroy
        if customer.cancel_at.present?
          customer.record_service_event!(
            "service_cancellation_removed",
            "Agendamento de cancelamento removido",
            effective_date: customer.cancel_at
          )
        end

        customer.update!(cancel_at: nil)
        render json: serialize_customer(customer.reload)
      end

      private

      def customer
        @customer ||= Customer.includes(:product, :invoices).find(params[:customer_id])
      end

      def cancellation_params
        params.require(:cancellation).permit(:mode, :cancel_at)
      end

      def serialize_customer(customer)
        customer.as_json(
          only: %i[
            id identifier name email phone document legal_name product_id status notes billing_due_day
            cancel_at canceled_at created_at updated_at
          ]
        ).merge(
          identifier_label: customer.identifier_label,
          service_status: customer.service_status,
          service_status_label: customer.service_status_label,
          current_period_end: customer.current_period_end,
          current_period_end_label: customer.current_period_end_label,
          product_name: customer.product&.name,
          product_price_cents: customer.product&.price_cents,
          product_billing_cycle: customer.product&.billing_cycle
        )
      end
    end
  end
end