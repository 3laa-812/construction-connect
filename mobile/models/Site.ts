import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';

export default class Site extends Model {
  static table = 'sites';

  @field('name') name!: string;
  @field('project_id') projectId!: string;
  @field('address') address?: string;
  @field('gps_lat') gpsLat?: number;
  @field('gps_long') gpsLong?: number;
  @json('geofence', (raw) => raw) geofence?: any;
  @field('contact_name') contactName?: string;
  @field('contact_phone') contactPhone?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
