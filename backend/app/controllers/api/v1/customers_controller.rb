module Api
  module V1
    class CustomersController < BaseController
      def index
        render json: Customer.includes(
          :product,
          :invoices,
          :customer_documents,
          customer_billing_events: :user,
          customer_service_events: :user
        ).order(:identifier).map { |customer| serialize_customer(customer) }
      end

      def show
        render json: serialize_customer(customer)
      end

      def create
        created_customer = Customer.create!(customer_params)
        render json: serialize_customer(created_customer), status: :created
      end

      def update
        customer.update!(customer_params)
        render json: serialize_customer(customer)
      end

      def destroy
        render json: { error: "Clientes não podem ser excluídos pela interface. Cancele o serviço para manter rastreabilidade." }, status: :method_not_allowed
      end

      private

      def customer
        @customer ||= Customer.includes(
          :product,
          :invoices,
          :customer_documents,
          customer_billing_events: :user,
          customer_service_events: :user
        ).find(params[:id])
      end

      def customer_params
        params.require(:customer).permit(:name, :email, :phone, :document, :legal_name, :status, :notes, :billing_due_day, :product_id)
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
          customer_type: customer.company? ? "pj" : "pf",
          product_name: customer.product&.name,
          product_price_cents: customer.product&.price_cents,
          product_billing_cycle: customer.product&.billing_cycle,
          documents: customer.customer_documents.order(created_at: :desc).map { |document| serialize_document(document) },
          billing_history: customer.customer_billing_events.order(occurred_at: :desc).map { |event| serialize_billing_event(event) },
          service_history: customer.customer_service_events.order(occurred_at: :desc).map { |event| serialize_service_event(event) }
        )
      end

      def serialize_billing_event(event)
        event.as_json(
          only: %i[
            id event_type invoice_id invoice_number amount_cents invoice_status period_start period_end due_date
            occurred_at details created_at
          ]
        ).merge(
          user_username: event.user&.username || "Sistema",
          period_label: "#{event.period_start.strftime('%d/%m/%Y')} até #{event.period_end.strftime('%d/%m/%Y')}"
        )
      end

      def serialize_document(document)
        document.as_json(
          only: %i[id customer_id title original_filename content_type byte_size checksum_sha256 uploaded_by created_at updated_at]
        ).merge(
          download_url: "/api/v1/customer_documents/#{document.id}/download"
        )
      end

      def serialize_service_event(event)
        event.as_json(
          only: %i[id event_type service_status effective_date occurred_at details created_at]
        ).merge(
          record_type: "service",
          user_username: event.user&.username || "Sistema",
          effective_date_label: event.effective_date&.strftime("%d/%m/%Y")
        )
      end
    end
  end
end