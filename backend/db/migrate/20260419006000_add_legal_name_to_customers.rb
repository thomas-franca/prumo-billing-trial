class AddLegalNameToCustomers < ActiveRecord::Migration[8.1]
  def change
    add_column :customers, :legal_name, :string

    reversible do |direction|
      direction.up do
        execute <<~SQL.squish
          UPDATE customers
          SET legal_name = name
          WHERE regexp_replace(COALESCE(document, ''), '[^0-9]', '', 'g') ~ '^[0-9]{12,}$'
        SQL
      end
    end
  end
end