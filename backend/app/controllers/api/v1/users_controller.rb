module Api
  module V1
    class UsersController < BaseController
      def index
        render json: User.order(:first_name, :last_name).map { |user| serialize_user(user) }
      end

      def show
        render json: serialize_user(user)
      end

      def create
        created_user = User.create!(user_params)
        render json: serialize_user(created_user), status: :created
      end

      def update
        if last_administrator? && user_params[:role].present? && user_params[:role] != "administrator"
          render json: { errors: [ "Não é possível alterar o papel do último administrador." ] },
            status: :unprocessable_entity
          return
        end

        user.update!(user_params)
        render json: serialize_user(user)
      end

      def destroy
        if last_administrator?
          render json: { errors: [ "Não é possível excluir o último administrador." ] },
            status: :unprocessable_entity
          return
        end

        user.destroy!
        head :no_content
      end

      private

      def user
        @user ||= User.find(params[:id])
      end

      def user_params
        permitted_params = params.require(:user).permit(
          :first_name,
          :last_name,
          :username,
          :role,
          :password,
          :password_confirmation
        )

        if permitted_params[:password].blank?
          permitted_params.delete(:password)
          permitted_params.delete(:password_confirmation)
        end

        permitted_params
      end

      def serialize_user(user)
        user.as_json(only: %i[id first_name last_name username role created_at updated_at]).merge(
          full_name: user.full_name
        )
      end

      def last_administrator?
        user.administrator? && User.where(role: "administrator").where.not(id: user.id).none?
      end
    end
  end
end