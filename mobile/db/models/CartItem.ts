import { Model, Relation } from '@nozbe/watermelondb'
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import Product from './Product'

export default class CartItem extends Model {
  static table = 'cart_items'

  @field('product_id') productId!: string
  @field('quantity') quantity!: number
  @field('project_id') projectId!: string
  @field('product_name') productName?: string
  @field('unit') unit?: string
  @field('unit_price') unitPrice?: number
  @field('supplier_id') supplierId?: string
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
  
  @relation('products', 'product_id') product!: Relation<Product>
}
