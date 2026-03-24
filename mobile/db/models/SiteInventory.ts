import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class SiteInventory extends Model {
  static table = 'site_inventory'

  @field('project_id') projectId!: string
  @field('name') name!: string
  @field('unit') unit!: string
  @field('quantity') quantity!: number
  @readonly @date('created_at') createdAt!: number
  @date('updated_at') updatedAt!: number
}
