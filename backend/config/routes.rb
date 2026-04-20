Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "auth/login", to: "auth#login"
      post "auth/logout", to: "auth#logout"
      get "auth/me", to: "auth#me"
      resource :dashboard, only: :show, controller: :dashboard
      resources :users
      resources :customers do
        resource :cancellation, only: %i[create destroy], controller: :customer_cancellations
        resources :customer_documents, only: %i[index create]
      end
      resources :products
      resources :coupons
      resources :payment_methods

      resources :subscriptions do
        member do
          post :cancel
          post :reactivate
        end
      end

      resources :invoices do
        resources :tax_documents, only: %i[index create show]

        member do
          post :pay
          post :cancel
          post :reactivate
        end
      end

      resources :customer_documents, only: %i[index show destroy] do
        member do
          get :download
        end
      end

      resources :documents
    end
  end
end