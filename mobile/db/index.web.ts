import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import { schema } from './schema'
import User from './models/User'
import Project from './models/Project'
import Site from './models/Site'
import DailyLog from './models/DailyLog'
import LogPhoto from './models/LogPhoto'
import Material from './models/Material'
import PurchaseOrder from './models/PurchaseOrder'

const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onSetUpError: (error) => {
    console.error("LokiJS failed to load", error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Project,
    Site,
    DailyLog,
    LogPhoto,
    Material,
    PurchaseOrder,
  ],
})
