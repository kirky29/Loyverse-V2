import { NextRequest, NextResponse } from 'next/server'
import { DailyTaking, LoyverseReceipt } from '../../types'

export async function GET(request: NextRequest) {
  try {
    const apiToken = process.env.LOYVERSE_API_TOKEN
    const locationId = process.env.LOYVERSE_LOCATION_ID

    if (!apiToken) {
      return NextResponse.json(
        { error: 'LOYVERSE_API_TOKEN environment variable is not set' },
        { status: 500 }
      )
    }

    if (!locationId) {
      return NextResponse.json(
        { error: 'LOYVERSE_LOCATION_ID environment variable is not set' },
        { status: 500 }
      )
    }

    // Get receipts from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0]

    const url = `https://api.loyverse.com/v1.0/receipts?location_id=${locationId}&created_at_min=${fromDate}T00:00:00Z&limit=250`

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
      if (receipt.status === 'VOIDED' || receipt.status === 'CANCELLED') {
        return
      }

      const date = receipt.created_at.split('T')[0]
      const existing = dailyTakingsMap.get(date)

      if (existing) {
        existing.total += receipt.total
        existing.receiptCount += 1
        existing.averageReceipt = existing.total / existing.receiptCount
      } else {
        dailyTakingsMap.set(date, {
          date,
          total: receipt.total,
          receiptCount: 1,
          averageReceipt: receipt.total,
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
