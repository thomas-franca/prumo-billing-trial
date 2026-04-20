module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate_user!, only: :login
      skip_before_action :authorize_request!, only: %i[login me logout]
      skip_after_action :audit_security_relevant_request!, only: %i[login logout]

      def login
        limiter = LoginRateLimiter.new(username: auth_params[:username], request: request)

        if limiter.throttled?
          AuditLogger.call(
            user: nil,
            action: "auth.login_throttled",
            resource_type: "auth",
            request: request,
            metadata: { username: auth_params[:username].to_s.strip.downcase }
          )
          render json: { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, status: :too_many_requests
          return
        end

        user = User.find_by(username: auth_params[:username].to_s.strip.downcase)

        unless user&.authenticate(auth_params[:password])
          limiter.record_failure!
          AuditLogger.call(
            user: user,
            action: "auth.login_failed",
            resource_type: "auth",
            request: request,
            metadata: {
              username: auth_params[:username].to_s.strip.downcase,
              remaining_attempts: limiter.remaining_attempts
            }
          )
          render json: { error: "Usuário ou senha inválidos." }, status: :unauthorized
          return
        end

        limiter.reset!
        session = UserSession.create_for!(user: user, request: request)
        AuditLogger.call(user: user, action: "auth.login_success", resource_type: "auth", request: request)

        render json: {
          token: session.plain_token,
          expires_at: session.expires_at,
          user: serialize_user(user),
          permissions: permissions_for(user)
        }, status: :created
      end

      def me
        render json: {
          user: serialize_user(current_user),
          permissions: permissions_for(current_user)
        }
      end

      def logout
        AuditLogger.call(user: current_user, action: "auth.logout", resource_type: "auth", request: request)
        current_user_session&.revoke!
        head :no_content
      end

      private

      def auth_params
        params.require(:auth).permit(:username, :password)
      end
    end
  end
end