import { Model, Relation } from '@nozbe/watermelondb'
import { field, date, readonly, relation, json } from '@nozbe/watermelondb/decorators'
import Project from './Project'

export default class Site extends Model {
  static table = 'sites'

  @relation('projects', 'project_id') project!: Relation<Project>
  @field('name') name!: string
  @field('latitude') latitude!: number | null
  @field('longitude') longitude!: number | null
  @json('geofence_polygon', (raw) => raw) geofencePolygon: any
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
}
