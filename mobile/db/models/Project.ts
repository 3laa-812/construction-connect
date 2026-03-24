import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators'
import Site from './Site'
import DailyLog from './DailyLog'
import type { Query } from '@nozbe/watermelondb'

export default class Project extends Model {
  static table = 'projects'

  @field('name') name!: string
  @field('company_id') companyId!: string
  @field('server_id') serverId!: string | null
  @field('status') status!: string
  @date('start_date') startDate!: number | null
  @date('end_date') endDate!: number | null
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number

  @children('sites') sites!: Query<Site>
  @children('daily_logs') dailyLogs!: Query<DailyLog>
}
