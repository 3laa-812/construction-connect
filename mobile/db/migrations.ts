import {
  addColumns,
  createTable,
  schemaMigrations,
} from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'products',
          columns: [
            { name: 'server_id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'unit', type: 'string' },
            { name: 'specifications', type: 'string', isOptional: true },
            { name: 'price', type: 'number', isOptional: true },
            { name: 'supplier_id', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'cart_items',
          columns: [
            { name: 'product_id', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'project_id', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'purchase_orders',
          columns: [
            { name: 'server_id', type: 'string', isOptional: true },
            { name: 'project_id', type: 'string' },
            { name: 'supplier_id', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'total_amount', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'po_items',
          columns: [
            { name: 'po_id', type: 'string' },
            { name: 'product_id', type: 'string', isOptional: true },
            { name: 'name', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'unit_price', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'projects',
          columns: [
            { name: 'server_id', type: 'string', isOptional: true },
          ],
        }),
        createTable({
          name: 'site_inventory',
          columns: [
            { name: 'project_id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'unit', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'daily_logs',
          columns: [
            { name: 'log_title', type: 'string', isOptional: true },
            { name: 'progress_notes', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
})
