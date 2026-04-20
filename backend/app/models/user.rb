class User < ApplicationRecord
  has_secure_password
  has_many :user_sessions, dependent: :destroy
  has_many :audit_events, dependent: :nullify

  ROLES = %w[administrator finance seller].freeze

  validates :first_name, :last_name, :username, :role, presence: true
  validates :username, uniqueness: { case_sensitive: false }
  validates :role, inclusion: { in: ROLES }
  validates :password, length: { minimum: 10 }, if: -> { password.present? }
  validate :password_strength, if: -> { password.present? }

  before_validation :normalize_username

  def full_name
    "#{first_name} #{last_name}".strip
  end

  def administrator?
    role == "administrator"
  end

  def finance?
    role == "finance"
  end

  def seller?
    role == "seller"
  end

  private

  def normalize_username
    self.username = username.to_s.strip.downcase
  end

  def password_strength
    return if password.match?(/[0-9]/) && password.match?(/[^A-Za-z0-9]/)

    errors.add(:password, "deve conter numeros e caracteres especiais")
  end
end