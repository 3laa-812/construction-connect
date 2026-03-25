import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Product extends Model {
  static table = 'products'

  @field('server_id') serverId!: string
  @field('name') name!: string
  @field('category') category!: string
  @field('unit') unit!: string
  @field('specifications') specifications!: string
  @field('price') price!: number
  @field('supplier_id') supplierId!: string
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}
