class CreateCustomers < ActiveRecord::Migration[8.1]
  def change
    create_table :customers do |t|
      t.integer :identifier, null: false
      t.string :name, null: false
      t.string :email
      t.string :phone
      t.string :document
      t.string :status, null: false, default: "active"
      t.text :notes
      t.timestamps
    end

    add_index :customers, :identifier, unique: true
  end
end