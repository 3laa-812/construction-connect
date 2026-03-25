import { Model, Relation } from '@nozbe/watermelondb'
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import PurchaseOrder from './PurchaseOrder'

export default class POItem extends Model {
  static table = 'po_items'

  @field('po_id') poId!: string
  @field('product_id') productId!: string
  @field('name') name!: string
  @field('quantity') quantity!: number
  @field('received_qty') receivedQty?: number
  @field('unit_price') unitPrice!: number
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number

  @relation('purchase_orders', 'po_id') purchaseOrder!: Relation<PurchaseOrder>
}
