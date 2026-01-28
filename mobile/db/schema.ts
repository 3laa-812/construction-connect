import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'daily_logs',
      columns: [
        { name: 'project_id', type: 'string' },
        { name: 'user_id', type: 'string' },
        { name: 'log_date', type: 'number' }, // timestamp
        { name: 'weather_data', type: 'string', isOptional: true }, // JSON stringified
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'log_photos',
      columns: [
        { name: 'daily_log_id', type: 'string', isIndexed: true },
        { name: 'local_path', type: 'string', isOptional: true },
        { name: 's3_url', type: 'string', isOptional: true },
        { name: 'gps_lat', type: 'number', isOptional: true },
        { name: 'gps_long', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string' },
        { name: 'name', type: 'string', isOptional: true },
        { name: 'role', type: 'string', isOptional: true },
      ],
    }),
    // Placeholder for other tables if needed later
  ],
})
