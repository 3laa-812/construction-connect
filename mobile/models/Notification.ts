import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Notification extends Model {
  static table = 'notifications';

  @field('user_id') userId!: string;
  @field('title') title!: string;
  @field('message') message!: string;
  @field('type') type!: string;
  @field('is_read') isRead!: boolean;
  @field('reference_id') referenceId?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
