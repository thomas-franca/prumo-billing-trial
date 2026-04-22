module Api
  module V1
    class BaseController < ActionController::API
      before_action :authenticate_user!
      before_action :authorize_request!
      after_action :set_security_headers!
      after_action :audit_security_relevant_request!

      rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
      rescue_from ActiveRecord::RecordInvalid, with: :render_unprocessable_entity
      rescue_from ActionController::ParameterMissing, with: :render_bad_request

      private

      attr_reader :current_user, :current_user_session

      def authenticate_user!
        token = request.authorization.to_s[/\ABearer (.+)\z/, 1]
        @current_user_session = UserSession.find_by_token(token)

        unless current_user_session&.active?
          audit_security_event!("auth.required", metadata: { reason: "missing_or_expired_token" })
          render json: { error: "Autenticacao obrigatoria." }, status: :unauthorized
          return
        end

        current_user_session.touch_usage!
        @current_user = current_user_session.user
        Current.user = current_user
      end

      def authorize_request!
        policy = ApiAuthorizationPolicy.new(
          user: current_user,
          controller_name: controller_name,
          action_name: action_name
        )

        return if policy.allowed?

        audit_security_event!(
          "authorization.denied",
          metadata: {
            controller: controller_name,
            action: action_name,
            params_id: params[:id]
          }
        )
        render json: { error: "Acesso negado." }, status: :forbidden
      end

      def serialize_user(user)
        user.as_json(only: %i[id first_name last_name username role created_at updated_at]).merge(
          full_name: user.full_name
        )
      end

      def permissions_for(user)
        {
          can_manage_users: user.administrator?,
          can_edit_financial_data: user.administrator? || user.finance?,
          can_view_only: user.seller?
        }
      end

      def render_not_found(error)
        Rails.logger.info("record_not_found controller=#{controller_name} action=#{action_name} error=#{error.class}")
        render json: { error: "Recurso nao encontrado." }, status: :not_found
      end

      def render_unprocessable_entity(error)
        render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
      end

      def render_bad_request(error)
        render json: { error: error.message }, status: :bad_request
      end

      def audit_security_relevant_request!
        return unless current_user
        return unless response.status < 400
        return unless audit_action?

        AuditLogger.call(
          user: current_user,
          action: "#{controller_name}.#{action_name}",
          resource_type: controller_name,
          resource_id: audit_resource_id,
          request: request,
          metadata: { status: response.status }
        )
      end

      def audit_action?
        %w[create update destroy pay cancel reactivate download].include?(action_name)
      end

      def audit_resource_id
        params[:id] || params[:customer_id] || params[:invoice_id] || params[:subscription_id]
      end

      def audit_security_event!(action, metadata: {})
        AuditLogger.call(
          user: current_user,
          action: action,
          resource_type: controller_name,
          resource_id: audit_resource_id,
          request: request,
          metadata: metadata
        )
      end

      def set_security_headers!
        response.set_header("X-Content-Type-Options", "nosniff")
        response.set_header("X-Frame-Options", "DENY")
        response.set_header("Referrer-Policy", "strict-origin-when-cross-origin")
        response.set_header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
      end
    end
  end
end