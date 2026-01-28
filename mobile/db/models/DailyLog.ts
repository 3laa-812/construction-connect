import { Model } from '@nozbe/watermelondb'
import { field, text, date, json, children } from '@nozbe/watermelondb/decorators'

export default class DailyLog extends Model {
  static table = 'daily_logs'
  static associations = {
    log_photos: { type: 'has_many', foreignKey: 'daily_log_id' },
  }

  @field('project_id') projectId
  @field('user_id') userId
  @date('log_date') logDate
  @json('weather_data', (raw) => raw) weatherData
  @field('status') status
  @date('created_at') createdAt
  @date('updated_at') updatedAt

  @children('log_photos') photos
}
