import { Model, Relation, Query } from '@nozbe/watermelondb'
import { field, date, readonly, relation, children, json } from '@nozbe/watermelondb/decorators'
import Project from './Project'
import User from './User'
import LogPhoto from './LogPhoto'

export default class DailyLog extends Model {
  static table = 'daily_logs'

  @relation('projects', 'project_id') project!: Relation<Project>
  @relation('users', 'user_id') user!: Relation<User>
  @date('log_date') logDate!: number
  @json('weather_data', (raw) => raw) weatherData: any
  @json('attendance_data', (raw) => raw) attendanceData: any
  @json('material_receipt_data', (raw) => raw) materialReceiptData: any
  @field('status') status!: 'DRAFT' | 'SUBMITTED' | 'SYNCED' | string
  @field('log_title') logTitle?: string
  @field('progress_notes') progressNotes?: string
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number

  @children('log_photos') photos!: Query<LogPhoto>

  async addPhoto(localPath: string, gpsLat?: number, gpsLong?: number) {
    return this.database.write(async () => {
      await this.collections.get<LogPhoto>('log_photos').create((photo) => {
        photo.dailyLog.set(this)
        photo.localPath = localPath
        photo.gpsLat = gpsLat ?? null
        photo.gpsLong = gpsLong ?? null
      })
    })
  }
}
