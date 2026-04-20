require "digest"
require "securerandom"

class UserSession < ApplicationRecord
  TOKEN_TTL = 12.hours

  belongs_to :user

  validates :token_digest, :expires_at, presence: true
  validates :token_digest, uniqueness: true

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  attr_reader :plain_token

  def self.create_for!(user:, request:)
    plain_token = SecureRandom.hex(32)
    session = create!(
      user: user,
      token_digest: digest(plain_token),
      user_agent: request.user_agent.to_s.truncate(500),
      ip_address: request.remote_ip,
      expires_at: TOKEN_TTL.from_now,
      last_used_at: Time.current
    )
    session.instance_variable_set(:@plain_token, plain_token)
    session
  end

  def self.find_by_token(token)
    return if token.blank?

    active.find_by(token_digest: digest(token))
  end

  def self.digest(token)
    Digest::SHA256.hexdigest(token.to_s)
  end

  def active?
    revoked_at.nil? && expires_at.future?
  end

  def touch_usage!
    update_column(:last_used_at, Time.current)
  end

  def revoke!
    update!(revoked_at: Time.current)
  end
end