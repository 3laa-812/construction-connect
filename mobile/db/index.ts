import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

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
import AttendanceCompany from './models/AttendanceCompany'

import migrations from './migrations'

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  // dbName: 'construction_connect', 
  // jsi: true, /* Platform.OS === 'ios' */
  onSetUpError: error => {
    console.error("Database failed to load", error)
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
    AttendanceCompany,
  ],
})
