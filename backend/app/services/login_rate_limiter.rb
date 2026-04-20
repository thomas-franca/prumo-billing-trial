class LoginRateLimiter
  MAX_ATTEMPTS = 5
  WINDOW = 15.minutes

  def initialize(username:, request:)
    @username = username.to_s.strip.downcase
    @request = request
  end

  def throttled?
    current_entry[:count] >= MAX_ATTEMPTS
  end

  def record_failure!
    entry = current_entry
    entry[:count] += 1
    Rails.cache.write(cache_key, entry, expires_in: WINDOW)
  end

  def reset!
    Rails.cache.delete(cache_key)
  end

  def remaining_attempts
    [MAX_ATTEMPTS - current_entry[:count], 0].max
  end

  private

  attr_reader :username, :request

  def current_entry
    entry = Rails.cache.read(cache_key)
    return fresh_entry unless entry.is_a?(Hash)
    return fresh_entry if entry[:first_attempt_at].to_i < WINDOW.ago.to_i

    { count: entry[:count].to_i, first_attempt_at: entry[:first_attempt_at].to_i }
  end

  def fresh_entry
    { count: 0, first_attempt_at: Time.current.to_i }
  end

  def cache_key
    "auth:login:#{request.remote_ip}:#{username.presence || 'blank'}"
  end
end