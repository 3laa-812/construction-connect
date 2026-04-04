import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Project extends Model {
  static table = 'projects';

  @field('name') name!: string;
  @field('description') description?: string;
  @field('status') status!: string;
  @field('company_id') companyId!: string;
  @field('budget') budget?: number;
  @date('start_date') startDate?: Date;
  @date('end_date') endDate?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
