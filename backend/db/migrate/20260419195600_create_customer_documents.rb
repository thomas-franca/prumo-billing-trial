class CreateCustomerDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :customer_documents do |t|
      t.references :customer, null: false, foreign_key: true
      t.string :title, null: false
      t.string :original_filename, null: false
      t.string :content_type, null: false
      t.integer :byte_size, null: false
      t.string :checksum_sha256, null: false
      t.string :uploaded_by
      t.binary :file_data, null: false
      t.timestamps
    end

    add_index :customer_documents, :checksum_sha256
    add_index :customer_documents, :created_at
  end
end