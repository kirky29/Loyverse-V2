import { NextRequest, NextResponse } from 'next/server'
import { DailyTaking, LoyverseReceipt } from '../../types'
import { createHash } from 'crypto'
import { gzip } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)

// Optimize response data
function optimizeResponseData(dailyTakings: DailyTaking[]): any {
  return dailyTakings.map(taking => ({
    d: taking.date,
    t: Math.round(taking.total * 100) / 100, // Round to 2 decimal places
    rc: taking.receiptCount,
    ar: taking.averageReceipt ? Math.round(taking.averageReceipt * 100) / 100 : undefined,
    pb: taking.paymentBreakdown,
    lb: (taking as any).locationBreakdown
  }))
}

// Compress response if supported
async function createOptimizedResponse(data: any, headers: Record<string, string> = {}): Promise<NextResponse> {
  const jsonString = JSON.stringify(data)
  
  // Add base headers with proper typing
  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  }

  // For large responses, consider compression
  if (jsonString.length > 1024) {
    try {
      const compressed = await gzipAsync(Buffer.from(jsonString))
      responseHeaders['Content-Encoding'] = 'gzip'
      responseHeaders['Content-Length'] = compressed.length.toString()
      
      return new NextResponse(compressed as BodyInit, {
        status: 200,
        headers: responseHeaders
      })
    } catch (error) {
      console.warn('Compression failed, sending uncompressed:', error)
    }
  }

  return NextResponse.json(data, { headers: responseHeaders })
}

export async function GET(request: NextRequest) {
  // Backward compatibility - use environment variables
  try {
    const apiToken = process.env.LOYVERSE_API_TOKEN
    const storeId = process.env.LOYVERSE_LOCATION_ID

    if (!apiToken) {
      return NextResponse.json(
        { error: 'LOYVERSE_API_TOKEN environment variable is not set' },
        { status: 500 }
      )
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'LOYVERSE_LOCATION_ID environment variable is not set' },
        { status: 500 }
      )
    }

    const result = await fetchDailyTakings(apiToken, storeId, false)
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching daily takings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily takings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      apiToken, 
      storeId, 
      includeAllStores, 
      fromDate, 
      daysToLoad, 
      priority = 'normal',
      page = 1,
      limit = 50,
      enablePagination = false
    } = body

    if (!apiToken) {
      return NextResponse.json(
        { error: 'API token is required' },
        { status: 400 }
      )
    }

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Check for If-None-Match header for ETag caching
    const ifNoneMatch = request.headers.get('if-none-match')
    
    // Generate cache key for ETag (include pagination params)
    const cacheKey = createHash('md5')
      .update(`${storeId}-${fromDate || 'default'}-${daysToLoad || 31}-${includeAllStores}-${page}-${limit}-${enablePagination}`)
      .digest('hex')

    // If client has current version, return 304
    if (ifNoneMatch === cacheKey) {
      return new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': cacheKey,
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400'
        }
      })
    }

    const result = await fetchDailyTakings(apiToken, storeId, includeAllStores, fromDate, daysToLoad, priority, { page, limit, enablePagination })
    
    // Optimize data based on priority level
    const responseData = priority === 'high' ? result.data : optimizeResponseData(result.data)
    
    // Create optimized response with enhanced caching headers
    const headers: Record<string, string> = {
      'ETag': cacheKey,
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      'X-Data-Source': result.source,
      'X-Processing-Time': `${result.processingTime}ms`,
      'X-Total-Receipts': result.totalReceipts.toString(),
      'X-Optimized': priority === 'high' ? 'false' : 'true'
    }
    
    // Add pagination headers if applicable
    if (result.pagination) {
      headers['X-Pagination-Page'] = result.pagination.page.toString()
      headers['X-Pagination-Limit'] = result.pagination.limit.toString()
      headers['X-Pagination-Total'] = result.pagination.total.toString()
      headers['X-Pagination-Has-More'] = result.pagination.hasMore.toString()
    }
    
    return await createOptimizedResponse(responseData, headers)
  } catch (error) {
    console.error('Error fetching daily takings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily takings' },
      { status: 500 }
    )
  }
}

interface PaginationOptions {
  page: number
  limit: number
  enablePagination: boolean
}

interface FetchResult {
  data: DailyTaking[]
  source: string
  processingTime: number
  totalReceipts: number
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

async function fetchDailyTakings(
  apiToken: string, 
  storeId: string, 
  includeAllStores: boolean = false, 
  customFromDate?: string, 
  daysToLoad?: number,
  priority: 'normal' | 'high' = 'normal',
  paginationOptions?: PaginationOptions
): Promise<FetchResult> {
  const startTime = Date.now()
  
  try {
    console.log(`🚀 Fetching data (priority: ${priority}) for store: ${storeId}`)
    
    // Determine date range based on parameters
    let fromDate: string
    
    if (customFromDate) {
      fromDate = customFromDate
    } else if (daysToLoad) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysToLoad)
      fromDate = startDate.toISOString().split('T')[0]
    } else {
      // Default: last 31 days for fast initial load
      const thirtyOneDaysAgo = new Date()
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31)
      fromDate = thirtyOneDaysAgo.toISOString().split('T')[0]
    }

    console.log('📅 Fetching receipts from:', fromDate, 'for store:', storeId)
    console.log('🎯 Priority:', priority, '| DaysToLoad:', daysToLoad)

    let receipts: LoyverseReceipt[] = []

    if (includeAllStores || storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2') {
      // For multi-store accounts, fetch receipts in batches to avoid limits
      const allReceipts: LoyverseReceipt[] = []
      let cursor = null
      let hasMore = true
      
      while (hasMore && allReceipts.length < 10000) { // Safety limit - increased for historical data
        let url = `https://api.loyverse.com/v1.0/receipts?created_at_min=${fromDate}T00:00:00Z&limit=100`
        if (cursor) {
          url += `&cursor=${cursor}`
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Loyverse API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const batchReceipts: LoyverseReceipt[] = data.receipts || []
        
        console.log(`📊 Multi-store progress: ${allReceipts.length} receipts loaded so far...`)
        
        if (batchReceipts.length === 0) {
          hasMore = false
        } else {
          allReceipts.push(...batchReceipts)
          cursor = data.cursor
          hasMore = !!cursor
        }
      }
      
      receipts = allReceipts
      console.log('✅ Multi-store fetch completed. Total receipts:', allReceipts.length, `(from ${fromDate})`)
    } else {
      // For single-store accounts, use pagination to get all data
      const allReceipts: LoyverseReceipt[] = []
      let cursor = null
      let hasMore = true
      
      while (hasMore && allReceipts.length < 15000) { // Safety limit - increased for historical data
        let url = `https://api.loyverse.com/v1.0/receipts?store_id=${storeId}&created_at_min=${fromDate}T00:00:00Z&limit=100`
        if (cursor) {
          url += `&cursor=${cursor}`
        }
        
        console.log('📡 Single-store API call:', url)
        console.log(`📊 Progress: ${allReceipts.length} receipts loaded so far...`)
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Loyverse API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const batchReceipts: LoyverseReceipt[] = data.receipts || []
        
        console.log('Batch fetched:', batchReceipts.length, 'receipts. Cursor:', data.cursor)
        
        if (batchReceipts.length === 0) {
          hasMore = false
        } else {
          allReceipts.push(...batchReceipts)
          cursor = data.cursor
          hasMore = !!cursor
        }
      }
      
      receipts = allReceipts
      console.log('✅ Single-store fetch completed. Total receipts:', allReceipts.length, `(from ${fromDate})`)
    }

    // Filter out voided/cancelled receipts and aggregate by date
    const dailyTakingsMap = new Map<string, DailyTaking>()
    const locationBreakdown = new Map<string, { [locationId: string]: number }>()
    const paymentBreakdown = new Map<string, { cash: number; card: number }>()
    const itemBreakdown = new Map<string, Map<string, { 
      item_name: string
      variant_name?: string
      quantity: number
      total_sales: number
      category?: string
    }>>()

    receipts.forEach(receipt => {
      // Check if receipt is voided or cancelled
      if (receipt.status === 'VOIDED' || receipt.status === 'CANCELLED' || 
          receipt.cancelled_at !== null) {
        return
      }

      // Use receipt_date if available, otherwise fall back to created_at
      const date = receipt.receipt_date ? 
        receipt.receipt_date.split('T')[0] : 
        receipt.created_at.split('T')[0]
      
      const total = receipt.total_money || receipt.total || 0
      const locationId = receipt.store_id

      // Process line items for item breakdown
      if (receipt.line_items && Array.isArray(receipt.line_items)) {
        if (!itemBreakdown.has(date)) {
          itemBreakdown.set(date, new Map())
        }
        const dayItemBreakdown = itemBreakdown.get(date)!
        
        receipt.line_items.forEach(item => {
          const itemKey = `${item.item_name}${item.variant_name ? `_${item.variant_name}` : ''}`
          const existing = dayItemBreakdown.get(itemKey)
          
          if (existing) {
            existing.quantity += item.quantity
            existing.total_sales += item.total_money
          } else {
            // Simple category classification based on item name
            let category = 'Other'
            const itemName = item.item_name.toLowerCase()
            if (itemName.includes('coffee') || itemName.includes('latte') || itemName.includes('cappuccino') || 
                itemName.includes('espresso') || itemName.includes('americano') || itemName.includes('tea') || 
                itemName.includes('drink') || itemName.includes('beverage')) {
              category = 'Beverages'
            } else if (itemName.includes('sandwich') || itemName.includes('burger') || itemName.includes('salad') || 
                      itemName.includes('soup') || itemName.includes('wrap') || itemName.includes('meal')) {
              category = 'Food'
            } else if (itemName.includes('cake') || itemName.includes('pastry') || itemName.includes('muffin') || 
                      itemName.includes('cookie') || itemName.includes('biscuit') || itemName.includes('croissant')) {
              category = 'Pastries'
            } else if (itemName.includes('gift') || itemName.includes('card')) {
              category = 'Gifts'
            }
            
            dayItemBreakdown.set(itemKey, {
              item_name: item.item_name,
              variant_name: item.variant_name || undefined,
              quantity: item.quantity,
              total_sales: item.total_money,
              category
            })
          }
        })
      }

      // Calculate payment method totals for this receipt
      let cashTotal = 0
      let cardTotal = 0
      
      if (receipt.payments && Array.isArray(receipt.payments)) {
        receipt.payments.forEach(payment => {
          const amount = payment.money_amount || 0
          const paymentType = payment.type?.toLowerCase() || ''
          const paymentName = payment.name?.toLowerCase() || ''
          
          // Debug log for first few receipts to understand payment structure
          if (process.env.NODE_ENV === 'development') {
            console.log('Payment data:', { 
              type: payment.type, 
              name: payment.name, 
              amount: payment.money_amount,
              paymentType,
              paymentName
            })
          }
          
          // More comprehensive payment type detection
          if (paymentType === 'cash' || paymentName.includes('cash')) {
            cashTotal += amount
          } else if (
            paymentType === 'card' || 
            paymentType === 'credit_card' || 
            paymentType === 'debit_card' ||
            paymentName.includes('card') ||
            paymentName.includes('visa') ||
            paymentName.includes('mastercard') ||
            paymentName.includes('amex') ||
            paymentName.includes('credit') ||
            paymentName.includes('debit')
          ) {
            cardTotal += amount
          }
        })
      }

      // Fallback: if cash + card doesn't equal total, assume remaining is card
      const paymentTotal = cashTotal + cardTotal
      if (paymentTotal > 0 && paymentTotal < total) {
        const difference = total - paymentTotal
        cardTotal += difference
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Payment fallback applied: ${difference} added to card total for receipt total ${total}`)
        }
      }

      // Aggregate daily totals
      const existing = dailyTakingsMap.get(date)
      if (existing) {
        existing.total += total
        existing.receiptCount += 1
        existing.averageReceipt = existing.total / existing.receiptCount
      } else {
        dailyTakingsMap.set(date, {
          date,
          total,
          receiptCount: 1,
          averageReceipt: total,
        })
      }

      // Track location breakdown
      if (!locationBreakdown.has(date)) {
        locationBreakdown.set(date, {})
      }
      const dayBreakdown = locationBreakdown.get(date)!
      dayBreakdown[locationId] = (dayBreakdown[locationId] || 0) + total

      // Track payment method breakdown
      if (!paymentBreakdown.has(date)) {
        paymentBreakdown.set(date, { cash: 0, card: 0 })
      }
      const dayPaymentBreakdown = paymentBreakdown.get(date)!
      dayPaymentBreakdown.cash += cashTotal
      dayPaymentBreakdown.card += cardTotal
    })

    // Convert to array and sort by date (newest first)
    const dailyTakings: DailyTaking[] = Array.from(dailyTakingsMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log('Final results for store', storeId, ':', {
      totalReceipts: receipts.length,
      daysWithSales: dailyTakings.length,
      dateRange: dailyTakings.length > 0 ? `${dailyTakings[dailyTakings.length - 1].date} to ${dailyTakings[0].date}` : 'none',
      totalRevenue: dailyTakings.reduce((sum, day) => sum + day.total, 0)
    })

    // Add location, payment, and item breakdown to each daily taking
    dailyTakings.forEach(taking => {
      const breakdown = locationBreakdown.get(taking.date)
      if (breakdown) {
        // Add location breakdown as metadata
        ;(taking as any).locationBreakdown = breakdown
      }
      
      const paymentData = paymentBreakdown.get(taking.date)
      if (paymentData) {
        // Add payment breakdown
        taking.paymentBreakdown = paymentData
      }
      
      const itemData = itemBreakdown.get(taking.date)
      if (itemData) {
        // Convert Map to array and calculate average prices
        const itemArray = Array.from(itemData.values()).map(item => ({
          ...item,
          average_price: item.total_sales / item.quantity
        }))
        // Sort by total sales descending
        itemArray.sort((a, b) => b.total_sales - a.total_sales)
        ;(taking as any).itemBreakdown = itemArray
      }
    })

    const processingTime = Date.now() - startTime
    console.log(`✅ Data fetched in ${processingTime}ms`)
    
    // Apply pagination if enabled
    let paginatedData = dailyTakings
    let paginationInfo = undefined
    
    if (paginationOptions?.enablePagination) {
      const { page, limit } = paginationOptions
      const total = dailyTakings.length
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      
      paginatedData = dailyTakings.slice(startIndex, endIndex)
      
      paginationInfo = {
        page,
        limit,
        total,
        hasMore: endIndex < total
      }
      
      console.log(`📄 Pagination applied: page ${page}, showing ${paginatedData.length}/${total} records`)
    }
    
    return {
      data: paginatedData,
      source: 'loyverse-api',
      processingTime,
      totalReceipts: receipts.length,
      pagination: paginationInfo
    }
  } catch (error) {
    console.error('Error fetching daily takings:', error)
    throw error
  }
}
