class AddProductToCustomers < ActiveRecord::Migration[8.1]
  def change
    add_reference :customers, :product, foreign_key: true

    reversible do |direction|
      direction.up do
        execute <<~SQL.squish
          UPDATE customers
          SET product_id = (SELECT products.id FROM products ORDER BY products.id ASC LIMIT 1)
          WHERE product_id IS NULL
            AND EXISTS (SELECT 1 FROM products)
        SQL
      end
    end
  end
end