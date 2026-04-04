import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from '../models/schema';

import Project from '../models/Project';
import Site from '../models/Site';
import DailyLog from '../models/DailyLog';
import LogPhoto from '../models/LogPhoto';
import Notification from '../models/Notification';

const adapter = new SQLiteAdapter({
  schema,
  onSetUpError: error => console.error('WatermelonDB setup error:', error),
});

export const database = new Database({
  adapter,
  modelClasses: [Project, Site, DailyLog, LogPhoto, Notification],
});
