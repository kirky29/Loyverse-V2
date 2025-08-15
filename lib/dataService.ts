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
    
    // Step 2: Check if historical data is already cached
    const cachedHistorical = await this.cache.getFromAnyCache(account.id, 'historical-all')
    if (cachedHistorical) {
      console.log('📚 Historical data already cached for', account.name)
      if (onHistoricalData) {
        setTimeout(() => onHistoricalData(cachedHistorical.data), 100)
      }
    } else {
      // Load historical data in background if not cached
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
      }, 200)
    }
    
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
  async forceResync(
    account: LoyverseAccount,
    onProgress?: (progress: number, activity: string) => void
  ): Promise<DailyTaking[]> {
    console.log('🔄 Force resync for', account.name)
    
    // Step 1: Clear cache (10%)
    onProgress?.(10, 'Clearing cached data...')
    await this.cache.clearAccount(account.id)
    
    // Step 2: Start data fetch (20%)
    onProgress?.(20, 'Connecting to Loyverse API...')
    
    // Step 3: Load fresh historical data with progress tracking
    const historicalData = await this.getHistoricalDataWithProgress(account, onProgress)
    
    // Step 4: Complete (100%)
    onProgress?.(100, 'Sync completed successfully!')
    console.log('✅ Force resync completed:', historicalData.length, 'days')
    return historicalData
  }

  // Enhanced getHistoricalData with progress tracking
  private async getHistoricalDataWithProgress(
    account: LoyverseAccount,
    onProgress?: (progress: number, activity: string) => void
  ): Promise<DailyTaking[]> {
    try {
      onProgress?.(30, 'Fetching receipt data...')
      
      // Calculate date range for progress estimation
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 365) // Last year
      const fromDate = startDate.toISOString().split('T')[0]
      
      onProgress?.(40, 'Processing sales receipts...')
      
      const response = await fetch('/api/daily-takings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiToken: account.apiToken,
          storeId: account.storeId,
          includeAllStores: false,
          fromDate,
          daysToLoad: 365,
          priority: 'high'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch daily takings')
      }

      onProgress?.(60, 'Enriching with category data...')
      
      const data = await response.json()
      
      onProgress?.(80, 'Organizing data by date...')
      
      // Handle optimized data format
      let processedData: DailyTaking[]
      if (Array.isArray(data) && data.length > 0 && data[0].d) {
        // Convert optimized format back to full format
        processedData = data.map(item => ({
          date: item.d,
          total: item.t,
          receiptCount: item.rc,
          averageReceipt: item.ar,
          paymentBreakdown: item.pb,
          locationBreakdown: item.lb,
          itemBreakdown: item.ib
        }))
      } else {
        processedData = Array.isArray(data) ? data : []
      }
      
      onProgress?.(90, 'Caching processed data...')
      
      // Cache the fresh data
      if (processedData.length > 0) {
        await this.cache.setInAllCaches(account.id, processedData, fromDate)
      }
      
      return processedData
    } catch (error) {
      onProgress?.(100, 'Error occurred during sync')
      throw error
    }
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
        locationBreakdown: item.lb,
        itemBreakdown: item.ib
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

  // Systematic background loading for multiple accounts
  async systematicBackgroundLoad(
    accounts: LoyverseAccount[],
    onAccountStart?: (account: LoyverseAccount, index: number, total: number) => void,
    onAccountComplete?: (account: LoyverseAccount, data: DailyTaking[], index: number, total: number) => void,
    onAllComplete?: (results: { account: LoyverseAccount; data: DailyTaking[]; error?: string }[]) => void
  ): Promise<void> {
    console.log('🔄 Starting systematic background loading for', accounts.length, 'accounts')
    
    const results: { account: LoyverseAccount; data: DailyTaking[]; error?: string }[] = []
    
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i]
      
      try {
        console.log(`📚 [${i + 1}/${accounts.length}] Loading historical data for`, account.name)
        
        if (onAccountStart) {
          onAccountStart(account, i, accounts.length)
        }
        
        // Load historical data for this account
        const historicalData = await this.getHistoricalData(account)
        
        results.push({ account, data: historicalData })
        
        if (onAccountComplete) {
          onAccountComplete(account, historicalData, i, accounts.length)
        }
        
        console.log(`✅ [${i + 1}/${accounts.length}] Completed loading for`, account.name, ':', historicalData.length, 'days')
        
        // Small delay between accounts to prevent overwhelming the API
        if (i < accounts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
      } catch (error) {
        console.error(`❌ [${i + 1}/${accounts.length}] Failed to load data for`, account.name, ':', error)
        results.push({ 
          account, 
          data: [], 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    console.log('🎉 Systematic background loading completed for all accounts')
    
    if (onAllComplete) {
      onAllComplete(results)
    }
  }
}
