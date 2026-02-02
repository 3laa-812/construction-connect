import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Material extends Model {
  static table = 'materials'

  @field('name') name!: string
  @field('category') category!: string
  @field('unit') unit!: string
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}
