import { Model, Query } from '@nozbe/watermelondb'
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators'
import POItem from './POItem'

export default class PurchaseOrder extends Model {
  static table = 'purchase_orders'

  @field('server_id') serverId!: string
  @field('project_id') projectId!: string
  @field('supplier_id') supplierId!: string
  @field('status') status!: string
  @field('total_amount') totalAmount!: number
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number

  @children('po_items') items!: Query<POItem>
}
