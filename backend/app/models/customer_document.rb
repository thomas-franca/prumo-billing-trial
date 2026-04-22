class CustomerDocument < ApplicationRecord
  MAX_FILE_SIZE = 10.megabytes

  belongs_to :customer

  validates :title, :original_filename, :content_type, :checksum_sha256, :file_data, presence: true
  validates :byte_size, numericality: { greater_than: 0, less_than_or_equal_to: MAX_FILE_SIZE }
  validate :pdf_file

  private

  def pdf_file
    return if content_type == "application/pdf" &&
      original_filename.to_s.downcase.end_with?(".pdf") &&
      file_data.to_s.start_with?("%PDF-")

    errors.add(:base, "Envie apenas arquivos PDF válidos")
  end
end