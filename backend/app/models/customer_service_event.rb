class CustomerServiceEvent < ApplicationRecord
  EVENT_TYPES = %w[
    service_cancellation_scheduled
    service_cancellation_removed
    service_canceled
    service_reactivated
  ].freeze

  belongs_to :customer
  belongs_to :user, optional: true

  validates :event_type, inclusion: { in: EVENT_TYPES }
  validates :service_status, :occurred_at, presence: true
end