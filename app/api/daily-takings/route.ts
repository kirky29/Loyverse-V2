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

    return await fetchDailyTakings(apiToken, storeId)
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
    const { apiToken, storeId } = body

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

    return await fetchDailyTakings(apiToken, storeId)
  } catch (error) {
    console.error('Error fetching daily takings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily takings' },
      { status: 500 }
    )
  }
}

async function fetchDailyTakings(apiToken: string, storeId: string) {
  try {
    // Get receipts from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0]

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
    const receipts: LoyverseReceipt[] = data.receipts || []

    // Filter out voided/cancelled receipts and aggregate by date
    const dailyTakingsMap = new Map<string, DailyTaking>()

    receipts.forEach(receipt => {
      // Check if receipt is voided or cancelled (handle both possible field names)
      if (receipt.status === 'VOIDED' || receipt.status === 'CANCELLED' || 
          receipt.cancelled_at !== null) {
        return
      }

      // Use receipt_date if available, otherwise fall back to created_at
      const date = receipt.receipt_date ? 
        receipt.receipt_date.split('T')[0] : 
        receipt.created_at.split('T')[0]
      
      const existing = dailyTakingsMap.get(date)

      if (existing) {
        existing.total += receipt.total_money || receipt.total || 0
        existing.receiptCount += 1
        existing.averageReceipt = existing.total / existing.receiptCount
      } else {
        dailyTakingsMap.set(date, {
          date,
          total: receipt.total_money || receipt.total || 0,
          receiptCount: 1,
          averageReceipt: receipt.total_money || receipt.total || 0,
        })
      }
    })

    // Convert to array and sort by date (newest first)
    const dailyTakings: DailyTaking[] = Array.from(dailyTakingsMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json(dailyTakings)
  } catch (error) {
    console.error('Error fetching daily takings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily takings' },
      { status: 500 }
    )
  }
}
