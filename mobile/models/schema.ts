import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'company_id', type: 'string' },
        { name: 'budget', type: 'number', isOptional: true },
        { name: 'start_date', type: 'number', isOptional: true },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'gps_lat', type: 'number', isOptional: true },
        { name: 'gps_long', type: 'number', isOptional: true },
        { name: 'geofence', type: 'string', isOptional: true },
        { name: 'contact_name', type: 'string', isOptional: true },
        { name: 'contact_phone', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'daily_logs',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'user_id', type: 'string' },
        { name: 'log_date', type: 'number' },
        { name: 'weather_data', type: 'string', isOptional: true },
        { name: 'attendance_data', type: 'string', isOptional: true },
        { name: 'materials_data', type: 'string', isOptional: true },
        { name: 'progress_notes', type: 'string', isOptional: true },
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
        { name: 'uploaded', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'message', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'is_read', type: 'boolean' },
        { name: 'reference_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
