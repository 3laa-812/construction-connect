import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class LogPhoto extends Model {
  static table = 'log_photos';

  @field('daily_log_id') dailyLogId!: string;
  @field('local_path') localPath?: string;
  @field('s3_url') s3Url?: string;
  @field('gps_lat') gpsLat?: number;
  @field('gps_long') gpsLong?: number;
  @field('uploaded') uploaded!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
