import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class PurchaseOrder extends Model {
  static table = 'purchase_orders'

  @field('project_id') projectId!: string
  @field('supplier_id') supplierId!: string
  @field('status') status!: string
  @field('total_amount') totalAmount: number | null
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}
