class Document < ApplicationRecord
  belongs_to :subscription

  validates :title, :document_type, :status, presence: true
  validates :document_type, inclusion: { in: %w[contract addendum cancellation_notice] }
  validates :status, inclusion: { in: %w[draft signed archived] }
end