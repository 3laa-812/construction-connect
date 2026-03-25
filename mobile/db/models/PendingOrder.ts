import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class PendingOrder extends Model {
  static table = 'pending_orders'

  @field('payload_json') payloadJson!: string
  @field('synced') synced!: number
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}
