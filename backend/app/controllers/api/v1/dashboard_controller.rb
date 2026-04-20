module Api
  module V1
    class DashboardController < BaseController
      def show
        render json: Dashboard::SummaryService.new.call
      end
    end
  end
end