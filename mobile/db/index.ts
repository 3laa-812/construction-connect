import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { schema } from './schema'
import DailyLog from './models/DailyLog'
import LogPhoto from './models/LogPhoto'
import User from './models/User'
// import Post from './model/Post' // ⬅️ You'll import your models here

import { Platform } from 'react-native'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

let adapter;

if (Platform.OS === 'web') {
  adapter = new LokiJSAdapter({
    schema,
    // (You might want to comment out this line if you want to switch to a
    // synchronous adapter for debugging capabilities)
    // useWebWorker: false,
    useIncrementalIndexedDB: true,
  })
} else {
  adapter = new SQLiteAdapter({
    schema,
    // (You might want to comment out this line if you want to switch to a
    // synchronous adapter for debugging capabilities)
    // jsi: true, /* Platform.OS === 'ios' */
    // (optional database name or file system path)
    // dbName: 'myapp',
    // (optional, includes a custom migration function for versioning)
    // migrations, 
  })
}

// Then, make a Watermelon database from it!
export const database = new Database({
  adapter,
  modelClasses: [
    DailyLog,
    LogPhoto,
    User,
  ],
})
