import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'
import schema from './schema'
import migrations from './migrations'
import { 
  Company, Project, Site, User, RFQ, RFQItem, Bid, PurchaseOrder, Invoice,
  BOQItem, BidItem, POItem, DeliveryNote, GRNItem, Wallet, Transaction 
} from './models'

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  dbName: 'construction_connect_db_v1', // Force fresh DB
  useWebWorker: false,
  useIncrementalIndexedDB: false, // Disable for stability during dev
})

export const database = new Database({
  adapter,
  modelClasses: [
    Company,
    Project,
    Site,
    User,
    RFQ,
    RFQItem,
    Bid,
    PurchaseOrder,
    Invoice,
    BOQItem,
    BidItem,
    POItem,
    DeliveryNote,
    GRNItem,
    Wallet,
    Transaction,
  ],
})
