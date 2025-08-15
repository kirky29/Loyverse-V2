export interface DailyTaking {
  date: string
  total: number
  receiptCount: number
  averageReceipt: number
  locationBreakdown?: { [locationId: string]: number }
  paymentBreakdown?: { cash: number; card: number }
  itemBreakdown?: ItemSalesData[]
}

export interface ItemSalesData {
  item_name: string
  variant_name?: string
  quantity: number
  total_sales: number
  average_price: number
  category?: string
}

export interface LoyverseAccount {
  id: string
  name: string
  apiToken: string
  storeId: string
  isActive: boolean
}

export interface LoyverseReceipt {
  id?: string
  receipt_number: string
  total_money: number
  total?: number // Fallback field
  created_at: string
  updated_at: string
  receipt_date: string
  status?: string
  cancelled_at?: string | null
  store_id: string
  customer_id?: string | null
  employee_id?: string
  subtotal?: number
  total_tax: number
  total_discount: number
  tip: number
  surcharge: number
  source: string
  receipt_type: string
  line_items: LoyverseReceiptItem[]
  payments: LoyversePayment[]
}

export interface LoyverseReceiptItem {
  id: string
  item_id: string
  variant_id: string
  item_name: string
  variant_name?: string | null
  sku: string
  quantity: number
  price: number
  total_money: number
  gross_total_money: number
  cost: number
  cost_total: number
  line_note?: string | null
  line_taxes: any[]
  total_discount: number
  line_discounts: any[]
  line_modifiers: any[]
}

export interface LoyversePayment {
  payment_type_id: string
  name: string
  type: string
  money_amount: number
  paid_at: string
  payment_details?: any
}
