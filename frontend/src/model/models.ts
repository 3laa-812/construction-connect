import { Model, Q } from '@nozbe/watermelondb'
import { field, date, children, relation, lazy } from '@nozbe/watermelondb/decorators'

export class Company extends Model {
  static table = 'companies'

  @field('name') name!: string
  @field('type') type!: string
  @field('commercial_reg_no') commercial_reg_no!: string
  @field('tax_id') tax_id!: string
  @field('wallet_balance') wallet_balance!: number
  @date('created_at') created_at!: number

  @children('projects') projects: any
  @children('users') users: any

  @lazy purchase_orders = this.collections.get('purchase_orders').query(Q.where('supplier_id', this.id))
  @lazy invoices = this.collections.get('invoices').query(Q.where('supplier_id', this.id))
}

export class Project extends Model {
  static table = 'projects'

  @relation('companies', 'company_id') company: any
  @field('name') name!: string
  @field('budget') budget!: number
  @date('start_date') start_date!: number
  @date('end_date') end_date!: number
  @date('created_at') created_at!: number

  @children('sites') sites: any
  @children('rfqs') rfqs: any
}

export class Site extends Model {
  static table = 'sites'

  @relation('projects', 'project_id') project: any
  @field('name') name!: string
  @field('latitude') latitude!: number
  @field('longitude') longitude!: number
  @field('contact_person') contact_person!: string
  @field('contact_phone') contact_phone!: string
}

export class User extends Model {
  static table = 'users'

  @relation('companies', 'company_id') company: any
  @field('email') email!: string
  @field('role') role!: string
  @field('is_active') is_active!: boolean
  @date('created_at') created_at!: number
}

export class RFQ extends Model {
  static table = 'rfqs'

  @relation('projects', 'project_id') project: any
  @field('status') status!: string
  @date('deadline') deadline!: number
  @field('payment_terms') payment_terms!: string
  @date('created_at') created_at!: number

  @children('rfq_items') items: any
  @children('bids') bids: any
}

export class RFQItem extends Model {
  static table = 'rfq_items'

  @relation('rfqs', 'rfq_id') rfq: any
  @field('product_name') product_name!: string
  @field('quantity') quantity!: number
  @field('unit') unit!: string
}

export class Bid extends Model {
  static table = 'bids'

  @relation('rfqs', 'rfq_id') rfq: any
  @field('status') status!: string
  @field('total_price') total_price!: number
  @date('created_at') created_at!: number
}

export class PurchaseOrder extends Model {
  static table = 'purchase_orders'

  @relation('projects', 'project_id') project: any
  @field('status') status!: string
  @field('total_amount') total_amount!: number
  @date('created_at') created_at!: number
}

export class Invoice extends Model {
  static table = 'invoices'

  @relation('companies', 'supplier_id') supplier: any
  @relation('companies', 'buyer_id') buyer: any
  @field('status') status!: string
  @field('total_amount') total_amount!: number
  @date('created_at') created_at!: number
}

export class BOQItem extends Model {
  static table = 'boq_items'

  @relation('projects', 'project_id') project: any
  @field('code') code!: string
  @field('description') description!: string
  @field('quantity') quantity!: number
  @field('unit') unit!: string
  @field('estimated_rate') estimated_rate!: number
  
  @children('rfq_items') rfq_items: any
}

export class BidItem extends Model {
  static table = 'bid_items'

  @relation('bids', 'bid_id') bid: any
  @relation('rfq_items', 'rfq_item_id') rfq_item: any
  @field('unit_price') unit_price!: number
  @field('note') note!: string
}

export class POItem extends Model {
  static table = 'po_items'

  @relation('purchase_orders', 'po_id') purchase_order: any
  @field('item_description') item_description!: string
  @field('ordered_qty') ordered_qty!: number
  @field('unit_price') unit_price!: number

  @children('grn_items') grn_items: any
}

export class DeliveryNote extends Model {
  static table = 'delivery_notes'

  @relation('purchase_orders', 'po_id') purchase_order: any
  @date('delivery_date') delivery_date!: number
  @field('status') status!: string
  @field('received_by') received_by!: string

  @children('grn_items') items: any
}

export class GRNItem extends Model {
  static table = 'grn_items'

  @relation('delivery_notes', 'delivery_note_id') delivery_note: any
  @relation('po_items', 'po_item_id') po_item: any
  @field('delivered_qty') delivered_qty!: number
}

export class Wallet extends Model {
  static table = 'wallets'

  @relation('companies', 'company_id') company: any
  @field('balance') balance!: number
  @field('currency') currency!: string
  @date('created_at') created_at!: number

  @children('transactions') transactions: any
}

export class Transaction extends Model {
  static table = 'transactions'

  @relation('wallets', 'wallet_id') wallet: any
  @field('amount') amount!: number
  @field('type') type!: string
  @field('reference') reference!: string
  @field('description') description!: string
  @field('invoice_id') invoice_id!: string
  @field('po_id') po_id!: string
  @date('created_at') created_at!: number
}
