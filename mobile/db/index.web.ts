import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import { schema } from './schema'
import User from './models/User'
import Project from './models/Project'
import Site from './models/Site'
import DailyLog from './models/DailyLog'
import LogPhoto from './models/LogPhoto'
import Product from './models/Product'
import CartItem from './models/CartItem'
import PurchaseOrder from './models/PurchaseOrder'
import POItem from './models/POItem'
import SiteInventory from './models/SiteInventory'

import migrations from './migrations' // Import migrations

const adapter = new LokiJSAdapter({
  schema,
  migrations, // Register migrations
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
    Product,
    CartItem,
    PurchaseOrder,
    POItem,
    SiteInventory,
  ],
})
