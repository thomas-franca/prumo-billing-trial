class TaxDocument < ApplicationRecord
  belongs_to :invoice

  validates :status, presence: true
  validates :status, inclusion: { in: %w[pending issued failed canceled] }
end