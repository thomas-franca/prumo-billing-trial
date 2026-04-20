module Api
  module V1
    class InvoicesController < BaseController
      def index
        render json: Invoice.includes(:customer, :product, :subscription).order(due_date: :desc).map { |invoice|
          serialize_invoice(invoice)
        }
      end

      def show
        render json: serialize_invoice(invoice)
      end

      def create
        created_invoice = Invoice.create!(invoice_params.with_defaults(status: "open"))
        render json: serialize_invoice(created_invoice), status: :created
      end

      def update
        unless invoice.editable?
          render json: { error: "Somente faturas abertas podem ser editadas." }, status: :unprocessable_entity
          return
        end

        invoice.update!(invoice_params)
        invoice.record_billing_event!("invoice_updated", "Fatura editada")
        render json: serialize_invoice(invoice)
      end

      def destroy
        render json: { error: "Faturas não podem ser excluídas pela interface. Cancele a fatura para manter rastreabilidade." }, status: :method_not_allowed
      end

      def pay
        invoice.record_paid!
        TaxDocuments::AutoIssueJob.perform_later(invoice.id)
        render json: serialize_invoice(invoice)
      end

      def cancel
        invoice.record_canceled!
        render json: serialize_invoice(invoice)
      end

      def reactivate
        invoice.record_reactivated!
        render json: serialize_invoice(invoice)
      end

      private

      def invoice
        @invoice ||= Invoice.find(params[:id])
      end

      def invoice_params
        params.require(:invoice).permit(
          :subscription_id,
          :customer_id,
          :coupon_id,
          :due_date,
          :period_start,
          :period_end,
          :description
        )
      end

      def serialize_invoice(invoice)
        invoice.as_json(
          only: %i[
            id subscription_id customer_id product_id coupon_id status amount_cents due_date
            period_start period_end paid_at canceled_at description created_at updated_at
          ]
        ).merge(
          invoice_number: invoice.invoice_number,
          period_label: invoice.period_label,
          subtotal_cents: invoice.subtotal_cents,
          discount_cents: invoice.discount_cents,
          coupon_code: invoice.coupon&.code,
          customer_name: invoice.customer&.name,
          customer_identifier: invoice.customer&.identifier_label,
          customer_billing_due_day: invoice.customer&.billing_due_day,
          product_name: invoice.product&.name
        )
      end
    end
  end
end