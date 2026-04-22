class ApiAuthorizationPolicy
  READ_ACTIONS = %w[index show].freeze
  WRITE_ACTIONS = %w[create update].freeze
  FINANCIAL_STATE_ACTIONS = %w[pay cancel reactivate].freeze

  FINANCE_READ_CONTROLLERS = %w[
    coupons
    customers
    customer_cancellations
    customer_documents
    dashboard
    documents
    invoices
    payment_methods
    products
    subscriptions
    tax_documents
  ].freeze

  FINANCE_WRITE_CONTROLLERS = %w[
    coupons
    customers
    customer_cancellations
    customer_documents
    invoices
    products
    subscriptions
    tax_documents
  ].freeze

  SELLER_READ_CONTROLLERS = %w[
    coupons
    customers
    dashboard
    invoices
    products
    subscriptions
  ].freeze

  def initialize(user:, controller_name:, action_name:)
    @user = user
    @controller_name = controller_name
    @action_name = action_name
  end

  def allowed?
    return false unless user
    return true if user.administrator?
    return finance_allowed? if user.finance?
    return seller_allowed? if user.seller?

    false
  end

  private

  attr_reader :user, :controller_name, :action_name

  def finance_allowed?
    return false if controller_name == "users"
    return false if action_name == "destroy"
    return true if FINANCE_READ_CONTROLLERS.include?(controller_name) && READ_ACTIONS.include?(action_name)
    return true if FINANCE_WRITE_CONTROLLERS.include?(controller_name) && WRITE_ACTIONS.include?(action_name)
    return true if controller_name == "invoices" && FINANCIAL_STATE_ACTIONS.include?(action_name)
    return true if controller_name == "subscriptions" && %w[cancel reactivate].include?(action_name)
    return true if controller_name == "customer_documents" && action_name == "download"

    false
  end

  def seller_allowed?
    return false unless SELLER_READ_CONTROLLERS.include?(controller_name)

    READ_ACTIONS.include?(action_name) || dashboard_show?
  end

  def dashboard_show?
    controller_name == "dashboard" && action_name == "show"
  end
end