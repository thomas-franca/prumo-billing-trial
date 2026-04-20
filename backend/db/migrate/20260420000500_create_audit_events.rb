class CreateAuditEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :audit_events do |t|
      t.references :user, foreign_key: true
      t.string :action, null: false
      t.string :resource_type
      t.string :resource_id
      t.string :ip_address
      t.string :user_agent
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :audit_events, :action
    add_index :audit_events, %i[resource_type resource_id]
    add_index :audit_events, :created_at
  end
end