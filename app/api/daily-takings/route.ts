import { NextRequest, NextResponse } from 'next/server'
import { DailyTaking, LoyverseReceipt } from '../../types'

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

    return await fetchDailyTakings(apiToken, storeId, false)
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
    const { apiToken, storeId, includeAllStores } = body

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

    return await fetchDailyTakings(apiToken, storeId, includeAllStores)
  } catch (error) {
    console.error('Error fetching daily takings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily takings' },
      { status: 500 }
    )
  }
}

async function fetchDailyTakings(apiToken: string, storeId: string, includeAllStores: boolean = false) {
  try {
    // Get receipts from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0]

    let receipts: LoyverseReceipt[] = []

    if (includeAllStores || storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2') {
      // For multi-store accounts, fetch receipts in batches to avoid limits
      const allReceipts: LoyverseReceipt[] = []
      let cursor = null
      let hasMore = true
      
      while (hasMore && allReceipts.length < 1000) { // Safety limit
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
        
        if (batchReceipts.length === 0) {
          hasMore = false
        } else {
          allReceipts.push(...batchReceipts)
          cursor = data.cursor
          hasMore = !!cursor
        }
      }
      
      receipts = allReceipts
    } else {
      // For single-store accounts, use the simpler approach
      const url = `https://api.loyverse.com/v1.0/receipts?store_id=${storeId}&created_at_min=${fromDate}T00:00:00Z&limit=250`
      
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
      receipts = data.receipts || []
    }

    // Filter out voided/cancelled receipts and aggregate by date
    const dailyTakingsMap = new Map<string, DailyTaking>()
    const locationBreakdown = new Map<string, { [locationId: string]: number }>()

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
    })

    // Convert to array and sort by date (newest first)
    const dailyTakings: DailyTaking[] = Array.from(dailyTakingsMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Add location breakdown to each daily taking
    dailyTakings.forEach(taking => {
      const breakdown = locationBreakdown.get(taking.date)
      if (breakdown) {
        // Add location breakdown as metadata
        ;(taking as any).locationBreakdown = breakdown
      }
    })

    return NextResponse.json(dailyTakings)
  } catch (error) {
    console.error('Error fetching daily takings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily takings' },
      { status: 500 }
    )
  }
}
