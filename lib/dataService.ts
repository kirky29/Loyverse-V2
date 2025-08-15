// lib/dataService.ts
import { OptimizedCache } from './cache'
import { LoyverseAccount, DailyTaking } from '../app/types'

export class DataService {
  private cache: OptimizedCache

  constructor(userId: string) {
    this.cache = new OptimizedCache(userId)
  }

  // Generate cache key for ETag
  private generateCacheKey(accountId: string, fromDate?: string, daysToLoad?: number): string {
    const crypto = require('crypto')
    return crypto.createHash('md5')
      .update(`${accountId}-${fromDate || 'default'}-${daysToLoad || 31}`)
      .digest('hex')
  }

  // Progressive data loading - critical data first, then historical
  async getProgressiveData(
    account: LoyverseAccount, 
    onCriticalData?: (data: DailyTaking[]) => void,
    onHistoricalData?: (data: DailyTaking[]) => void
  ): Promise<DailyTaking[]> {
    console.log('🚀 Progressive loading for', account.name)
    
    // Step 1: Load critical data (last 7 days) immediately
    const criticalData = await this.getCriticalData(account)
    if (onCriticalData) {
      onCriticalData(criticalData)
    }
    
    // Step 2: Load ALL historical data in background (since it won't change)
    setTimeout(async () => {
      try {
        console.log('📚 Loading historical data in background for', account.name)
        const historicalData = await this.getHistoricalData(account)
        if (onHistoricalData) {
          onHistoricalData(historicalData)
        }
      } catch (error) {
        console.error('Failed to load historical data:', error)
      }
    }, 200) // Small delay to ensure critical data renders first
    
    return criticalData
  }

  // Get critical data only (last 7 days) - for current day updates
  async getCriticalData(account: LoyverseAccount): Promise<DailyTaking[]> {
    console.log('⚡ Loading critical data (7 days) for', account.name)
    
    // Try cache first for critical data
    const cachedData = await this.cache.getFromAnyCache(account.id, 'critical-7d')
    if (cachedData) {
      console.log('✅ Using cached critical data')
      return cachedData.data
    }

    // Fetch critical data from API
    const criticalData = await this.fetchFromAPI(account, undefined, 7, 'high')
    
    // Cache with special key for critical data
    await this.cache.setInAllCaches(account.id, criticalData, 'critical-7d')
    
    return criticalData
  }

  // Get historical data (all data since Oct 2024) - cached permanently
  async getHistoricalData(account: LoyverseAccount): Promise<DailyTaking[]> {
    console.log('📚 Loading historical data for', account.name)
    
    // Try cache first for historical data
    const cachedData = await this.cache.getFromAnyCache(account.id, 'historical-all')
    if (cachedData) {
      console.log('✅ Using cached historical data')
      return cachedData.data
    }

    // Fetch all historical data from API
    const historicalData = await this.fetchFromAPI(account, '2024-10-01', undefined, 'normal')
    
    // Cache with special key for historical data (longer cache duration)
    await this.cache.setInAllCaches(account.id, historicalData, 'historical-all')
    
    console.log('✅ Historical data loaded and cached:', historicalData.length, 'days')
    return historicalData
  }

  // Force resync all data (clears cache and reloads)
  async forceResync(account: LoyverseAccount): Promise<DailyTaking[]> {
    console.log('🔄 Force resync for', account.name)
    
    // Clear all cache for this account
    await this.cache.clearAccount(account.id)
    
    // Load fresh historical data
    const historicalData = await this.getHistoricalData(account)
    
    console.log('✅ Force resync completed:', historicalData.length, 'days')
    return historicalData
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

  // Background refresh (for real-time updates) - only current day
  async backgroundRefresh(account: LoyverseAccount): Promise<void> {
    try {
      console.log('🔄 Background refresh for current day:', account.name)
      // Only refresh critical data (current day)
      const freshData = await this.fetchFromAPI(account, undefined, 7, 'high')
      await this.cache.setInAllCaches(account.id, freshData, 'critical-7d')
    } catch (error) {
      console.error('Background refresh failed:', error)
    }
  }

  // Fetch from Loyverse API
  private async fetchFromAPI(account: LoyverseAccount, fromDate?: string, daysToLoad?: number, priority: 'normal' | 'high' = 'normal'): Promise<DailyTaking[]> {
    const requestBody: any = {
      apiToken: account.apiToken,
      storeId: account.storeId,
      includeAllStores: account.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2',
      priority
    }
    
    if (fromDate) {
      requestBody.fromDate = fromDate
    }
    if (daysToLoad) {
      requestBody.daysToLoad = daysToLoad
    }
    
    // Add ETag support for caching
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Add ETag from cache if available
    const cachedEntry = await this.cache.getFromAnyCache(account.id, fromDate)
    if (cachedEntry) {
      const cacheKey = this.generateCacheKey(account.id, fromDate, daysToLoad)
      headers['If-None-Match'] = cacheKey
    }

    const response = await fetch('/api/daily-takings', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    })

    // Handle 304 Not Modified - return cached data
    if (response.status === 304) {
      console.log('📦 Using cached data (304 Not Modified)')
      const cachedEntry = await this.cache.getFromAnyCache(account.id, fromDate)
      return cachedEntry?.data || []
    }

    if (!response.ok) {
      throw new Error('Failed to fetch daily takings')
    }

    const data = await response.json()
    
    // Handle optimized data format
    if (Array.isArray(data) && data.length > 0 && data[0].d) {
      // Convert optimized format back to full format
      return data.map(item => ({
        date: item.d,
        total: item.t,
        receiptCount: item.rc,
        averageReceipt: item.ar,
        paymentBreakdown: item.pb,
        locationBreakdown: item.lb
      }))
    }
    
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
