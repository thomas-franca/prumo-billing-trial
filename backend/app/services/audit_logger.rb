class AuditLogger
  def self.call(...)
    new(...).call
  end

  def initialize(user:, action:, resource_type: nil, resource_id: nil, request: nil, metadata: {})
    @user = user
    @action = action
    @resource_type = resource_type
    @resource_id = resource_id
    @request = request
    @metadata = metadata || {}
  end

  def call
    AuditEvent.create!(
      user: user,
      action: action,
      resource_type: resource_type,
      resource_id: resource_id,
      ip_address: request&.remote_ip,
      user_agent: request&.user_agent.to_s.truncate(500),
      metadata: safe_metadata
    )
  rescue StandardError => error
    Rails.logger.warn("audit_event_failed action=#{action} error=#{error.class}")
    nil
  end

  private

  attr_reader :user, :action, :resource_type, :resource_id, :request, :metadata

  def safe_metadata
    metadata.deep_stringify_keys.except("password", "token", "password_confirmation")
  end
end