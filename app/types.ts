export interface DailyTaking {
  date: string
  total: number
  receiptCount: number
  averageReceipt: number
}

export interface LoyverseReceipt {
  id: string
  total: number
  created_at: string
  updated_at: string
  status: string
  location_id: string
  customer_id?: string
  employee_id?: string
  subtotal: number
  tax: number
  discount: number
  payment_method: string
  items: LoyverseReceiptItem[]
}

export interface LoyverseReceiptItem {
  id: string
  receipt_id: string
  product_id: string
  quantity: number
  price: number
  total: number
  discount: number
  tax: number
}
