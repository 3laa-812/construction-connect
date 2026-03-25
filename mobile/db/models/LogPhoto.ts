import { Model, Relation } from '@nozbe/watermelondb'
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import DailyLog from './DailyLog'

export default class LogPhoto extends Model {
  static table = 'log_photos'

  @relation('daily_logs', 'daily_log_id') dailyLog!: Relation<DailyLog>
  @field('local_path') localPath!: string | null
  @field('s3_url') s3Url!: string | null
  @field('gps_lat') gpsLat!: number | null
  @field('gps_long') gpsLong!: number | null
  @field('photo_type') photoType?: string
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}
