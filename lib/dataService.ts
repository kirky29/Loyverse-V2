// lib/dataService.ts
import { OptimizedCache } from './cache'
import { LoyverseAccount, DailyTaking } from '../app/types'

export class DataService {
  private cache: OptimizedCache

  constructor(userId: string) {
    this.cache = new OptimizedCache(userId)
  }

  // Get data with intelligent caching
  async getData(account: LoyverseAccount, fromDate?: string, daysToLoad?: number): Promise<DailyTaking[]> {
    console.log('🔍 DataService: Getting data for', account.name)
    
    // Try cache first
    const cachedData = await this.cache.getFromAnyCache(account.id, fromDate)
    if (cachedData) {
      console.log('✅ Using cached data')
      return cachedData.data
    }

    console.log('📡 Fetching fresh data from API')
    
    // Fetch from API
    const freshData = await this.fetchFromAPI(account, fromDate, daysToLoad)
    
    // Cache the results
    await this.cache.setInAllCaches(account.id, freshData, fromDate)
    
    return freshData
  }

  // Background refresh (for real-time updates)
  async backgroundRefresh(account: LoyverseAccount, fromDate?: string): Promise<void> {
    try {
      console.log('🔄 Background refresh for', account.name)
      const freshData = await this.fetchFromAPI(account, fromDate)
      await this.cache.setInAllCaches(account.id, freshData, fromDate)
    } catch (error) {
      console.error('Background refresh failed:', error)
    }
  }

  // Fetch from Loyverse API
  private async fetchFromAPI(account: LoyverseAccount, fromDate?: string, daysToLoad?: number): Promise<DailyTaking[]> {
    const requestBody: any = {
      apiToken: account.apiToken,
      storeId: account.storeId,
      includeAllStores: account.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2'
    }
    
    if (fromDate) {
      requestBody.fromDate = fromDate
    }
    if (daysToLoad) {
      requestBody.daysToLoad = daysToLoad
    }
    
    const response = await fetch('/api/daily-takings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error('Failed to fetch daily takings')
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  }

  // Clear cache for account
  async clearAccountCache(accountId: string): Promise<void> {
    await this.cache.clearAccount(accountId)
  }

  // Clear all cache
  async clearAllCache(): Promise<void> {
    await this.cache.clearAll()
  }
}
