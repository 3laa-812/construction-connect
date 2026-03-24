import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class AttendanceCompany extends Model {
  static table = 'attendance_companies'

  @field('company_name') companyName!: string
  @field('last_used_at') lastUsedAt!: number
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}
