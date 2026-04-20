module Customers
  class CancellationService
    def self.call(...)
      new(...).call
    end

    def initialize(customer:, mode:, cancel_at: nil)
      @customer = customer
      @mode = mode.to_s
      @cancel_at = cancel_at
    end

    def call
      case mode
      when "immediate"
        cancel_immediately
      when "scheduled"
        schedule_cancellation
      when "period_end"
        schedule_at_period_end
      when "reactivate"
        reactivate
      else
        customer.errors.add(:base, "Tipo de cancelamento inválido")
        raise ActiveRecord::RecordInvalid, customer
      end

      customer
    end

    private

    attr_reader :customer, :mode, :cancel_at

    def cancel_immediately
      customer.update!(status: "canceled", canceled_at: Time.current, cancel_at: nil)
      customer.record_service_event!(
        "service_canceled",
        "Serviço cancelado imediatamente",
        effective_date: Date.current
      )
    end

    def schedule_cancellation
      date = parse_cancel_at

      if date < Date.current
        customer.errors.add(:cancel_at, "não pode ser anterior à data atual")
        raise ActiveRecord::RecordInvalid, customer
      end

      customer.update!(status: "active", cancel_at: date, canceled_at: nil)
      customer.record_service_event!(
        "service_cancellation_scheduled",
        "Cancelamento agendado para data personalizada",
        effective_date: date
      )
    end

    def schedule_at_period_end
      date = customer.current_period_end
      customer.update!(status: "active", cancel_at: date, canceled_at: nil)
      customer.record_service_event!(
        "service_cancellation_scheduled",
        "Cancelamento agendado para o final do período vigente",
        effective_date: date
      )
    end

    def reactivate
      customer.update!(status: "active", cancel_at: nil, canceled_at: nil)
      customer.record_service_event!(
        "service_reactivated",
        "Cadastro reativado",
        effective_date: Date.current
      )
    end

    def parse_cancel_at
      Date.parse(cancel_at.to_s)
    rescue ArgumentError
      customer.errors.add(:cancel_at, "inválida")
      raise ActiveRecord::RecordInvalid, customer
    end
  end
end