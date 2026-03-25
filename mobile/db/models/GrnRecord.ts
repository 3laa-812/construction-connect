import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class GrnRecord extends Model {
  static table = 'grn_records'

  @field('po_local_id') poLocalId!: string
  @field('po_server_id') poServerId?: string
  @field('daily_log_id') dailyLogId?: string
  @field('items_json') itemsJson!: string
  @field('delivery_ticket_photo_id') deliveryTicketPhotoId?: string
  @field('notes') notes?: string
  @field('synced') synced!: number
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}
