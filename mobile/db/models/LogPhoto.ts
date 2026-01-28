import { Model } from '@nozbe/watermelondb'
import { field, text, date, relation } from '@nozbe/watermelondb/decorators'

export default class LogPhoto extends Model {
  static table = 'log_photos'
  static associations = {
    daily_logs: { type: 'belongs_to', key: 'daily_log_id' },
  }

  @relation('daily_logs', 'daily_log_id') dailyLog
  @text('local_path') localPath
  @text('s3_url') s3Url
  @field('gps_lat') gpsLat
  @field('gps_long') gpsLong
  @date('created_at') createdAt
}
