import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 4,
  tables: [
    // -------------------------------------------------------------------------
    // 1. Identity & Onboarding (Mirrors: Company, User)
    // -------------------------------------------------------------------------
    tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string' },
        { name: 'role', type: 'string' },
        { name: 'company_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // -------------------------------------------------------------------------
    // 2. Project Management (Mirrors: Project, Site)
    // -------------------------------------------------------------------------
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'company_id', type: 'string' },
        { name: 'server_id', type: 'string', isOptional: true }, // Backend Project.id for API calls
        { name: 'status', type: 'string', isOptional: true }, // Added status
        { name: 'start_date', type: 'number', isOptional: true },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' }, // Added for sync tracking
      ]
    }),
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'project_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'geofence_polygon', type: 'string', isOptional: true }, // Store as JSON string
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ]
    }),

    // -------------------------------------------------------------------------
    // 3. Daily Logs (Module A)
    // -------------------------------------------------------------------------
    tableSchema({
        name: 'daily_logs',
        columns: [
            { name: 'project_id', type: 'string' },
            { name: 'user_id', type: 'string' },
            { name: 'log_date', type: 'number' }, // timestamp
            { name: 'weather_data', type: 'string', isOptional: true }, // JSON: { temp, condition, humidity? }
            { name: 'attendance_data', type: 'string', isOptional: true }, // JSON: AttendanceRow[]
            { name: 'material_receipt_data', type: 'string', isOptional: true }, // JSON: MaterialReceiptData or legacy ReceivedItem[]
            { name: 'status', type: 'string' }, // DRAFT | SUBMITTED | SYNCED
            { name: 'log_title', type: 'string', isOptional: true },
            { name: 'progress_notes', type: 'string', isOptional: true }, // JSON: ProgressNote[]
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
        ]
    }),
    tableSchema({
        name: 'log_photos',
        columns: [
            { name: 'daily_log_id', type: 'string' },
            { name: 'local_path', type: 'string', isOptional: true },
            { name: 's3_url', type: 'string', isOptional: true },
            { name: 'gps_lat', type: 'number', isOptional: true },
            { name: 'gps_long', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
             // Note: Often photos don't need update tracking if they are immutable, but 'updated_at' is good for sync just in case
            { name: 'updated_at', type: 'number' },
        ]
    }),

    // -------------------------------------------------------------------------
    // 4. Inventory & Marketplace
    // -------------------------------------------------------------------------
    tableSchema({
        name: 'products',
        columns: [
            { name: 'server_id', type: 'string' }, // Maps to backend ID
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'unit', type: 'string' },
            { name: 'specifications', type: 'string', isOptional: true }, // JSON
            { name: 'price', type: 'number', isOptional: true },
            { name: 'supplier_id', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
        ]
    }),
    tableSchema({
        name: 'cart_items',
        columns: [
            { name: 'product_id', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'project_id', type: 'string' }, // Cart is per project?
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
        ]
    }),

    // Purchase Orders (For receiving materials & tracking)
    // Aligned closer to backend 'PurchaseOrder' + 'RFQ' concept
    tableSchema({
        name: 'purchase_orders',
        columns: [
            { name: 'server_id', type: 'string', isOptional: true }, // Verified ID from backend
            { name: 'project_id', type: 'string' },
            { name: 'supplier_id', type: 'string' },
            { name: 'status', type: 'string' }, // PLACED, CONFIRMED, IN_TRANSIT, DELIVERED
            { name: 'total_amount', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
        ]
    }),

    tableSchema({
        name: 'po_items',
        columns: [
            { name: 'po_id', type: 'string' },
            { name: 'product_id', type: 'string', isOptional: true },
            { name: 'name', type: 'string' }, // Snapshot name
            { name: 'quantity', type: 'number' },
            { name: 'unit_price', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
        ]
    }),

    tableSchema({
        name: 'site_inventory',
        columns: [
            { name: 'project_id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'unit', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
        ]
    }),
    
    // -------------------------------------------------------------------------
    // 5. Sync Tracking
    // -------------------------------------------------------------------------
    // WatermelonDB uses a 'sync' mechanism that often relies on 'updated_at' fields on records.
    // We don't typically need a separate 'sync_changes' table on the CLIENT side for WatermelonDB standard sync,
    // as it tracks 'changes' via the 'status' column (created, updated, deleted) internally if modeled correctly.
    // However, if we need custom logic, we can add it. For now, trusting standard Watermelon sync.
  ]
})
