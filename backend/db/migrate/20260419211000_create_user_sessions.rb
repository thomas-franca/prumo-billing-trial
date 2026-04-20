class CreateUserSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :user_sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token_digest, null: false
      t.string :user_agent
      t.string :ip_address
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.datetime :last_used_at
      t.timestamps
    end

    add_index :user_sessions, :token_digest, unique: true
    add_index :user_sessions, :expires_at
    add_index :user_sessions, :revoked_at
  end
end