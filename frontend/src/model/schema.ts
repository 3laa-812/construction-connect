import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'companies',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'commercial_reg_no', type: 'string', isOptional: true },
        { name: 'tax_id', type: 'string', isOptional: true },
        { name: 'wallet_balance', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'company_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'budget', type: 'number' },
        { name: 'start_date', type: 'number', isOptional: true },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'project_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'contact_person', type: 'string', isOptional: true },
        { name: 'contact_phone', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'company_id', type: 'string', isOptional: true },
        { name: 'email', type: 'string' },
        { name: 'role', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'rfqs',
      columns: [
        { name: 'project_id', type: 'string' },
        { name: 'created_by', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'deadline', type: 'number', isOptional: true },
        { name: 'payment_terms', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'rfq_items',
      columns: [
        { name: 'rfq_id', type: 'string' },
        { name: 'product_name', type: 'string', isOptional: true },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'bids',
      columns: [
        { name: 'rfq_id', type: 'string' },
        { name: 'supplier_id', type: 'string' },
        { name: 'total_price', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'purchase_orders',
      columns: [
        { name: 'project_id', type: 'string' },
        { name: 'supplier_id', type: 'string' },
        { name: 'bid_id', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'total_amount', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'invoices',
      columns: [
        { name: 'po_id', type: 'string', isOptional: true },
        { name: 'supplier_id', type: 'string' },
        { name: 'buyer_id', type: 'string' },
        { name: 'total_amount', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'boq_items',
      columns: [
        { name: 'project_id', type: 'string' },
        { name: 'code', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'quantity', type: 'number', isOptional: true },
        { name: 'unit', type: 'string', isOptional: true },
        { name: 'estimated_rate', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'bid_items',
      columns: [
        { name: 'bid_id', type: 'string' },
        { name: 'rfq_item_id', type: 'string' },
        { name: 'unit_price', type: 'number', isOptional: true },
        { name: 'note', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'po_items',
      columns: [
        { name: 'po_id', type: 'string' },
        { name: 'item_description', type: 'string', isOptional: true },
        { name: 'ordered_qty', type: 'number', isOptional: true },
        { name: 'unit_price', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'delivery_notes',
      columns: [
        { name: 'po_id', type: 'string' },
        { name: 'delivery_date', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'received_by', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'grn_items',
      columns: [
        { name: 'delivery_note_id', type: 'string' },
        { name: 'po_item_id', type: 'string' },
        { name: 'delivered_qty', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'wallets',
      columns: [
        { name: 'company_id', type: 'string' },
        { name: 'balance', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'wallet_id', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'type', type: 'string' },
        { name: 'reference', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'invoice_id', type: 'string', isOptional: true },
        { name: 'po_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
})
