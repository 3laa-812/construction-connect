import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';

export default class DailyLog extends Model {
  static table = 'daily_logs';

  @field('project_id') projectId!: string;
  @field('site_id') siteId?: string;
  @field('user_id') userId!: string;
  @date('log_date') logDate!: Date;
  @json('weather_data', (raw) => raw) weatherData?: any;
  @json('attendance_data', (raw) => raw) attendanceData?: any;
  @json('materials_data', (raw) => raw) materialsData?: any;
  @field('progress_notes') progressNotes?: string;
  @field('status') status!: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
