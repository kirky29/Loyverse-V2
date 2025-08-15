'use client'

import { useState, useEffect } from 'react'
import { LoyverseAccount, DailyTaking } from './types'
import AccountManager from './components/AccountManager'
import DayDetailView from './components/DayDetailView'
import MainDashboard from './components/MainDashboard'

// Account-specific filter state interface
interface AccountFilterState {
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  visibleColumns: {
    date: boolean
    shop: boolean
    cafe: boolean
    combined: boolean
    receipts: boolean
    average: boolean
    status: boolean
    cash: boolean
    card: boolean
  }
  dateFilter: { from: string; to: string }
  amountFilter: { min: string; max: string }
  showFilters: boolean
  showColumnManager: boolean
  recordsToShow: number
}

// Enhanced Performance Table Component
interface PerformanceTableProps {
  dailyTakings: DailyTaking[]
  activeAccount: LoyverseAccount | null
  formatCurrency: (value: number) => string
  filterState: AccountFilterState
  onFilterStateChange: (newState: AccountFilterState) => void
  onDayClick: (dayData: DailyTaking) => void
}

function PerformanceTable({ 
  dailyTakings, 
  activeAccount, 
  formatCurrency, 
  filterState, 
  onFilterStateChange,
  onDayClick
}: PerformanceTableProps) {
  const {
    sortColumn,
    sortDirection,
    visibleColumns,
    dateFilter,
    amountFilter,
    showFilters,
    showColumnManager,
    recordsToShow
  } = filterState

  // Generate complete date range including days with no sales
  const generateCompleteDataset = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - recordsToShow)
    
    const completeData = []
    const dataMap = new Map(dailyTakings.map(item => [item.date, item]))
    
    for (let i = 0; i < recordsToShow; i++) {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() - i)
      const dateString = currentDate.toISOString().split('T')[0]
      
      const existingData = dataMap.get(dateString)
      if (existingData) {
        completeData.push(existingData)
      } else {
        // Create empty day record
        completeData.push({
          date: dateString,
          total: 0,
          receiptCount: 0,
          averageReceipt: 0,
          locationBreakdown: {},
          paymentBreakdown: { cash: 0, card: 0 }
        })
      }
    }
    
    return completeData
  }

  const handleSort = (column: string) => {
    const newSortDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'desc'
    const newSortColumn = sortColumn === column ? column : column
    
    onFilterStateChange({
      ...filterState,
      sortColumn: newSortColumn,
      sortDirection: newSortDirection
    })
  }

  const processedData = () => {
    let data = generateCompleteDataset()
    
    // Apply filters
    if (dateFilter.from) {
      data = data.filter(item => item.date >= dateFilter.from)
    }
    if (dateFilter.to) {
      data = data.filter(item => item.date <= dateFilter.to)
    }
    
    // Apply sorting
    if (sortColumn) {
      data.sort((a, b) => {
        let aVal: number = 0
        let bVal: number = 0
        
        if (sortColumn === 'date') {
          aVal = new Date(a.date).getTime()
          bVal = new Date(b.date).getTime()
        } else if (sortColumn === 'shop') {
          aVal = getShopAmount(a)
          bVal = getShopAmount(b)
        } else if (sortColumn === 'cafe') {
          aVal = getCafeAmount(a)
          bVal = getCafeAmount(b)
        } else if (sortColumn === 'combined') {
          aVal = getCombinedAmount(a)
          bVal = getCombinedAmount(b)
        } else if (sortColumn === 'receipts') {
          aVal = a.receiptCount || 0
          bVal = b.receiptCount || 0
        } else if (sortColumn === 'average') {
          aVal = a.averageReceipt || 0
          bVal = b.averageReceipt || 0
        } else if (sortColumn === 'cash') {
          aVal = a.paymentBreakdown?.cash || 0
          bVal = b.paymentBreakdown?.cash || 0
        } else if (sortColumn === 'card') {
          aVal = a.paymentBreakdown?.card || 0
          bVal = b.paymentBreakdown?.card || 0
        }
        
        if (sortDirection === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
      })
    }
    
    return data
  }

  const getShopAmount = (day: DailyTaking) => {
    if (activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2') {
      const shopId = 'd5a7267b-ca6f-4490-9d66-b5ba46cc563c'
      return day.locationBreakdown?.[shopId] || 0
    } else {
      return day.total
    }
  }

  const getCafeAmount = (day: DailyTaking) => {
    if (activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2') {
      const cafeId = 'e2aa143e-3e91-433e-a6d8-5a5538d429e2'
      return day.locationBreakdown?.[cafeId] || 0
    } else {
      return 0
    }
  }

  const getCombinedAmount = (day: DailyTaking) => {
    if (activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2') {
      return getShopAmount(day) + getCafeAmount(day)
    } else {
      return day.total
    }
  }

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return '↕️'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    onFilterStateChange({
      ...filterState,
      visibleColumns: {
        ...visibleColumns,
        [column]: !visibleColumns[column]
      }
    })
  }

  if (!dailyTakings || dailyTakings.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        color: '#666'
      }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: '0 0 20px 0' }}>
          📅 Daily Sales
        </h3>
        <p>No data available. Switch to an account with data to see performance metrics.</p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: 0 }}>
          📅 Daily Sales
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onFilterStateChange({ ...filterState, showFilters: !showFilters })}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              background: showFilters ? '#007bff' : 'white',
              color: showFilters ? 'white' : '#666',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🔍 Filters
          </button>
          <button
            onClick={() => onFilterStateChange({ ...filterState, showColumnManager: !showColumnManager })}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              background: showColumnManager ? '#007bff' : 'white',
              color: showColumnManager ? 'white' : '#666',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ⚙️ Columns
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '4px' }}>
                Records to Show
              </label>
              <select
                value={recordsToShow}
                onChange={(e) => onFilterStateChange({ ...filterState, recordsToShow: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '4px' }}>
                From Date
              </label>
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) => onFilterStateChange({ 
                  ...filterState, 
                  dateFilter: { ...dateFilter, from: e.target.value } 
                })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '4px' }}>
                To Date
              </label>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) => onFilterStateChange({ 
                  ...filterState, 
                  dateFilter: { ...dateFilter, to: e.target.value } 
                })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <button
                onClick={() => {
                  onFilterStateChange({
                    ...filterState,
                    dateFilter: { from: '', to: '' },
                    amountFilter: { min: '', max: '' }
                  })
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #dc3545',
                  background: '#dc3545',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '20px'
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Manager */}
      {showColumnManager && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            {Object.entries(visibleColumns).map(([column, visible]) => (
              <label key={column} style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => toggleColumn(column as keyof typeof visibleColumns)}
                  style={{ marginRight: '8px' }}
                />
                {column.charAt(0).toUpperCase() + column.slice(1)}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              {visibleColumns.date && (
                <th
                  onClick={() => handleSort('date')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  Date {getSortIcon('date')}
                </th>
              )}
              {visibleColumns.shop && (
                <th
                  onClick={() => handleSort('shop')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  🏪 Shop {getSortIcon('shop')}
                </th>
              )}
              {visibleColumns.cafe && (
                <th
                  onClick={() => handleSort('cafe')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  ☕ Cafe {getSortIcon('cafe')}
                </th>
              )}
              {visibleColumns.combined && (
                <th
                  onClick={() => handleSort('combined')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  🏢 Combined {getSortIcon('combined')}
                </th>
              )}
              {visibleColumns.receipts && (
                <th
                  onClick={() => handleSort('receipts')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  🧾 Receipts {getSortIcon('receipts')}
                </th>
              )}
              {visibleColumns.average && (
                <th
                  onClick={() => handleSort('average')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  📊 Average {getSortIcon('average')}
                </th>
              )}
              {visibleColumns.cash && (
                <th
                  onClick={() => handleSort('cash')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  💵 Cash {getSortIcon('cash')}
                </th>
              )}
              {visibleColumns.card && (
                <th
                  onClick={() => handleSort('card')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #dee2e6',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  💳 Card {getSortIcon('card')}
                </th>
              )}
              {/* Status column removed - redundant with date column */}
            </tr>
          </thead>
          <tbody>
            {processedData().map((day, index) => {
              const isToday = new Date(day.date).toDateString() === new Date().toDateString()
              const isYesterday = new Date(day.date).toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
              
              const shopAmount = getShopAmount(day)
              const cafeAmount = getCafeAmount(day)
              const combinedAmount = getCombinedAmount(day)
              
              return (
                <tr key={day.date} style={{
                  background: isToday ? '#e3f2fd' : (index % 2 === 0 ? '#ffffff' : '#f8f9fa'),
                  borderBottom: '1px solid #dee2e6',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onClick={() => onDayClick(day)}
                onMouseEnter={(e) => {
                  if (!isToday) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isToday) {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                  }
                }}>
                  {visibleColumns.date && (
                    <td style={{
                      padding: '12px 16px',
                      fontWeight: isToday ? '700' : '500',
                      color: isToday ? '#1976d2' : '#333'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px' }}>
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(day.date).getFullYear()}
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.shop && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontWeight: isToday ? '700' : '600',
                      color: shopAmount === 0 ? '#999' : '#1976d2'
                    }}>
                      {formatCurrency(shopAmount)}
                    </td>
                  )}
                  {visibleColumns.cafe && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontWeight: isToday ? '700' : '600',
                      color: cafeAmount === 0 ? '#999' : '#388e3c'
                    }}>
                      {formatCurrency(cafeAmount)}
                    </td>
                  )}
                  {visibleColumns.combined && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontWeight: isToday ? '700' : '600',
                      color: combinedAmount === 0 ? '#999' : '#7b1fa2'
                    }}>
                      {formatCurrency(combinedAmount)}
                    </td>
                  )}
                  {visibleColumns.receipts && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontWeight: isToday ? '700' : '600',
                      color: day.receiptCount === 0 ? '#999' : '#333'
                    }}>
                      {day.receiptCount || 0}
                    </td>
                  )}
                  {visibleColumns.average && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontWeight: isToday ? '700' : '600',
                      color: day.averageReceipt === 0 ? '#999' : '#333'
                    }}>
                      {formatCurrency(day.averageReceipt || 0)}
                    </td>
                  )}
                  {visibleColumns.cash && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontWeight: isToday ? '700' : '600',
                      color: (day.paymentBreakdown?.cash || 0) === 0 ? '#999' : '#333'
                    }}>
                      {formatCurrency(day.paymentBreakdown?.cash || 0)}
                    </td>
                  )}
                  {visibleColumns.card && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontWeight: isToday ? '700' : '600',
                      color: (day.paymentBreakdown?.card || 0) === 0 ? '#999' : '#333'
                    }}>
                      {formatCurrency(day.paymentBreakdown?.card || 0)}
                    </td>
                  )}
                  {/* Status column removed - redundant with date column */}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Info */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#666'
      }}>
        <strong>💡 Quick View:</strong> Showing {processedData().length} days. 
        Click column headers to sort. Use filters and column manager for custom views.
        Days with no sales are included and shown in gray.
      </div>
    </div>
  )
}

export default function Home() {
  const [dailyTakings, setDailyTakings] = useState<DailyTaking[]>([])
  const [loading, setLoading] = useState(true)
  const [switchingAccount, setSwitchingAccount] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts'>('dashboard')
  const [accounts, setAccounts] = useState<LoyverseAccount[]>([])
  const [activeAccount, setActiveAccount] = useState<LoyverseAccount | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<DailyTaking | null>(null)
  const [currentView, setCurrentView] = useState<'main' | 'account' | 'accountManager'>('main')
  
  // Cache system for account data
  const [accountDataCache, setAccountDataCache] = useState<Map<string, {
    data: DailyTaking[]
    timestamp: number
    loading: boolean
  }>>(new Map())

  // Account-specific filter state management
  const [accountFilterStates, setAccountFilterStates] = useState<Map<string, AccountFilterState>>(new Map())

  // Get or create default filter state for an account
  const getAccountFilterState = (accountId: string): AccountFilterState => {
    const existing = accountFilterStates.get(accountId)
    if (existing) return existing
    
    // Try to load from localStorage first
    try {
      const savedFilters = JSON.parse(localStorage.getItem('loyverse-account-filters') || '{}')
      const savedState = savedFilters[accountId]
      if (savedState) {
        setAccountFilterStates(prev => new Map(prev.set(accountId, savedState)))
        return savedState
      }
    } catch (error) {
      console.error('Error loading filter state from localStorage:', error)
    }
    
    // Default filter state
    const defaultState: AccountFilterState = {
      sortColumn: 'date',
      sortDirection: 'desc',
      visibleColumns: {
        date: true,
        shop: true,
        cafe: true,
        combined: true,
        receipts: false,
        average: false,
        status: false,
        cash: false,
        card: false
      },
      dateFilter: { from: '', to: '' },
      amountFilter: { min: '', max: '' },
      showFilters: false,
      showColumnManager: false,
      recordsToShow: 30
    }
    
    // Save the default state
    setAccountFilterStates(prev => new Map(prev.set(accountId, defaultState)))
    return defaultState
  }

  // Update filter state for a specific account
  const updateAccountFilterState = (accountId: string, newState: AccountFilterState) => {
    setAccountFilterStates(prev => new Map(prev.set(accountId, newState)))
    
    // Save to localStorage for persistence
    try {
      const existingFilters = JSON.parse(localStorage.getItem('loyverse-account-filters') || '{}')
      existingFilters[accountId] = newState
      localStorage.setItem('loyverse-account-filters', JSON.stringify(existingFilters))
    } catch (error) {
      console.error('Error saving filter state to localStorage:', error)
    }
  }

  useEffect(() => {
    loadAccounts()
    
    // Load saved filter states from localStorage
    try {
      const savedFilters = JSON.parse(localStorage.getItem('loyverse-account-filters') || '{}')
      const loadedStates = new Map()
      
      Object.entries(savedFilters).forEach(([accountId, filterState]) => {
        loadedStates.set(accountId, filterState as AccountFilterState)
      })
      
      if (loadedStates.size > 0) {
        setAccountFilterStates(loadedStates)
      }
    } catch (error) {
      console.error('Error loading filter states from localStorage:', error)
    }
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing loading to false')
        setLoading(false)
      }
    }, 3000)
    
    return () => clearTimeout(timeout)
  }, [])

  // Prefetch data for all accounts periodically to improve switching speed
  useEffect(() => {
    if (accounts.length <= 1) return // No need to prefetch if only one account
    
    const prefetchInterval = setInterval(() => {
      accounts.forEach(account => {
        if (account.id !== activeAccount?.id) {
          const cachedData = accountDataCache.get(account.id)
          const cacheAge = cachedData ? Date.now() - cachedData.timestamp : Infinity
          
          // Prefetch if no cache or cache is older than 10 minutes
          if (!cachedData || cacheAge > 10 * 60 * 1000) {
            fetchDailyTakingsInBackground(account)
          }
        }
      })
    }, 5 * 60 * 1000) // Prefetch every 5 minutes
    
    return () => clearInterval(prefetchInterval)
  }, [accounts, activeAccount, accountDataCache])

  // Fetch data when the active account changes (do not depend on `loading` to avoid loops)
  useEffect(() => {
    console.log('useEffect triggered - activeAccount changed:', activeAccount?.name)
    if (activeAccount) {
      console.log('Calling fetchDailyTakingsWithCache for:', activeAccount.name)
      fetchDailyTakingsWithCache()
    }
  }, [activeAccount])

  // When there are no accounts, end loading state and show main dashboard
  useEffect(() => {
    if (accounts.length === 0) {
      setLoading(false)
      setCurrentView('main')
    } else if (accounts.length === 1 && !activeAccount) {
      // If only one account, go directly to it
      const singleAccount = accounts[0]
      selectAccountFromMain(singleAccount)
    } else {
      // Multiple accounts - show main dashboard for selection
      setLoading(false)
      setCurrentView('main')
    }
  }, [accounts.length, activeAccount])

  const loadAccounts = () => {
    try {
      const savedAccounts = localStorage.getItem('loyverse-accounts')
      if (savedAccounts) {
        const parsedAccounts = JSON.parse(savedAccounts)
        setAccounts(parsedAccounts)
        
        const firstActive = parsedAccounts.find((acc: LoyverseAccount) => acc.isActive)
        if (firstActive) {
          setActiveAccount(firstActive)
        } else {
          setLoading(false)
        }
      } else {
        // No accounts exist, show welcome screen
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
      setLoading(false)
    }
  }

  const saveAccounts = (newAccounts: LoyverseAccount[]) => {
    try {
      localStorage.setItem('loyverse-accounts', JSON.stringify(newAccounts))
      setAccounts(newAccounts)
    } catch (error) {
      console.error('Error saving accounts:', error)
    }
  }

  const addAccount = (account: Omit<LoyverseAccount, 'id'>) => {
    const newAccount: LoyverseAccount = {
      ...account,
      id: Date.now().toString(),
      isActive: true
    }
    
    const updatedAccounts = accounts.map(acc => ({ ...acc, isActive: false }))
    updatedAccounts.push(newAccount)
    
    saveAccounts(updatedAccounts)
    setActiveAccount(newAccount)
    setActiveTab('dashboard')
  }

  const updateAccount = (id: string, updates: Partial<LoyverseAccount>) => {
    const updatedAccounts = accounts.map(acc => 
      acc.id === id ? { ...acc, ...updates } : acc
    )
    saveAccounts(updatedAccounts)
    
    if (activeAccount?.id === id) {
      setActiveAccount({ ...activeAccount, ...updates })
    }
  }

  const deleteAccount = (id: string) => {
    const updatedAccounts = accounts.filter(acc => acc.id !== id)
    saveAccounts(updatedAccounts)
    
    // Clear filter state for deleted account
    setAccountFilterStates(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
    
    // Remove from localStorage
    try {
      const savedFilters = JSON.parse(localStorage.getItem('loyverse-account-filters') || '{}')
      delete savedFilters[id]
      localStorage.setItem('loyverse-account-filters', JSON.stringify(savedFilters))
    } catch (error) {
      console.error('Error removing filter state from localStorage:', error)
    }
    
    if (activeAccount?.id === id) {
      const newActive = updatedAccounts.find(acc => acc.isActive) || updatedAccounts[0] || null
      setActiveAccount(newActive)
    }
  }

  const selectAccountFromMain = (account: LoyverseAccount) => {
    console.log('selectAccountFromMain called with:', account.name)
    // Clear any selected day when selecting an account
    setSelectedDay(null)
    setCurrentView('account')
    
    // Check if we have cached data for this account
    const cachedData = accountDataCache.get(account.id)
    const cacheAge = cachedData ? Date.now() - cachedData.timestamp : Infinity
    const isCacheValid = cacheAge < 5 * 60 * 1000 // 5 minutes cache
    
    // If we have valid cached data, use it immediately for instant switching
    if (cachedData && isCacheValid && cachedData.data.length > 0) {
      setDailyTakings(cachedData.data)
      setError(null)
      setSwitchingAccount(true) // Show subtle switching indicator
      
      // Still update the account state
      const updatedAccounts = accounts.map(acc => ({
        ...acc,
        isActive: acc.id === account.id
      }))
      saveAccounts(updatedAccounts)
      setActiveAccount(account)
      setActiveTab('dashboard')
      
      // Clear switching indicator after a short delay
      setTimeout(() => setSwitchingAccount(false), 500)
      
      // Refresh data in background if cache is getting stale (older than 2 minutes)
      if (cacheAge > 2 * 60 * 1000) {
        fetchDailyTakingsInBackground(account)
      }
    } else {
      // No cache or stale cache - show loading and fetch
      setSwitchingAccount(true)
      setError(null)
      
      const updatedAccounts = accounts.map(acc => ({
        ...acc,
        isActive: acc.id === account.id
      }))
      saveAccounts(updatedAccounts)
      setActiveAccount(account)
      setActiveTab('dashboard')
    }
  }

  const switchAccount = (account: LoyverseAccount) => {
    // This is for top navigation account switching - stay in account view
    selectAccountFromMain(account)
  }

  const fetchDailyTakingsWithCache = async () => {
    console.log('fetchDailyTakingsWithCache called for:', activeAccount?.name)
    if (!activeAccount) {
      console.log('No activeAccount, returning early')
      return
    }
    
    // Check cache first
    const cachedData = accountDataCache.get(activeAccount.id)
    const cacheAge = cachedData ? Date.now() - cachedData.timestamp : Infinity
    const isCacheValid = cacheAge < 5 * 60 * 1000 // 5 minutes cache
    
    console.log('Cache status:', {
      hasCachedData: !!cachedData,
      cacheAge: Math.round(cacheAge / 1000) + 's',
      isCacheValid,
      dataLength: cachedData?.data?.length || 0
    })
    
    if (cachedData && isCacheValid && cachedData.data.length > 0) {
      console.log('Using cached data for:', activeAccount.name)
      setDailyTakings(cachedData.data)
      setLoading(false)
      setSwitchingAccount(false)
      setError(null)
      
      // If cache is getting stale (older than 2 minutes), refresh in background
      if (cacheAge > 2 * 60 * 1000) {
        fetchDailyTakingsInBackground(activeAccount)
      }
      return
    }
    
    // No valid cache - fetch fresh data
    console.log('No valid cache, fetching fresh data for:', activeAccount.name)
    await fetchDailyTakings()
  }

  const fetchDailyTakings = async (account?: LoyverseAccount) => {
    const targetAccount = account || activeAccount
    if (!targetAccount) return
    
    try {
      // Only show loading for initial load, not account switches
      if (!account) {
      setLoading(true)
      }
      
      // Mark this account as loading in cache
      setAccountDataCache(prev => new Map(prev.set(targetAccount.id, {
        data: prev.get(targetAccount.id)?.data || [],
        timestamp: prev.get(targetAccount.id)?.timestamp || 0,
        loading: true
      })))
      
      const response = await fetch('/api/daily-takings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiToken: targetAccount.apiToken,
          storeId: targetAccount.storeId,
          includeAllStores: targetAccount.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily takings')
      }
      const data = await response.json()
      const dailyTakingsData = Array.isArray(data) ? data : []
      
      // Update cache
      setAccountDataCache(prev => new Map(prev.set(targetAccount.id, {
        data: dailyTakingsData,
        timestamp: Date.now(),
        loading: false
      })))
      
      // Update UI if this is for the current active account
      if (!account || targetAccount.id === activeAccount?.id) {
        setDailyTakings(dailyTakingsData)
        setError(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      
      // Update cache with error state
      setAccountDataCache(prev => new Map(prev.set(targetAccount.id, {
        data: prev.get(targetAccount.id)?.data || [],
        timestamp: prev.get(targetAccount.id)?.timestamp || 0,
        loading: false
      })))
      
      // Update UI if this is for the current active account
      if (!account || targetAccount.id === activeAccount?.id) {
        setError(errorMessage)
      }
    } finally {
      if (!account) {
      setLoading(false)
    }
      setSwitchingAccount(false)
    }
  }

  const fetchDailyTakingsInBackground = async (account: LoyverseAccount) => {
    // Silently update cache in background without affecting UI
    await fetchDailyTakings(account)
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const totalTakings = dailyTakings.reduce((sum, day) => sum + (day.total || 0), 0)
  const averageTakings = dailyTakings.length > 0 ? totalTakings / dailyTakings.length : 0

  // No more full-screen loading - we'll show the dashboard with a loading indicator instead

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            boxShadow: '0 0 30px rgba(255,255,255,0.3)'
          }}>
            <span style={{ fontSize: '50px' }}>⚠️</span>
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '20px', marginBottom: '40px', opacity: 0.9 }}>
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '20px 40px',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // No accounts state OR initial loading (before accounts are loaded)
  if (loading && accounts.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          animation: 'pulse 6s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          borderRadius: '50%',
          animation: 'float 10s ease-in-out infinite'
        }}></div>
        
        <div style={{ textAlign: 'center', maxWidth: '700px', padding: '60px', zIndex: 10, position: 'relative' }}>
          <div style={{
            width: '160px',
            height: '160px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 50px',
            boxShadow: '0 0 50px rgba(255,255,255,0.2)',
            animation: 'pulse 3s ease-in-out infinite'
          }}>
            <span style={{ fontSize: '80px' }}>🏪</span>
          </div>
          <h1 style={{ 
            fontSize: '56px', 
            fontWeight: 'bold', 
            marginBottom: '30px',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            Welcome to Loyverse
          </h1>
          <p style={{ 
            fontSize: '24px', 
            marginBottom: '50px', 
            opacity: 0.95, 
            lineHeight: '1.6',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Connect your first store to start tracking daily takings and gain valuable business insights
          </p>
          <button
            onClick={() => setActiveTab('accounts')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '3px solid rgba(255,255,255,0.4)',
              color: 'white',
              padding: '24px 48px',
              borderRadius: '20px',
              fontSize: '22px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(20px)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
            }}
          >
            Connect Your Store
          </button>
          <p style={{ 
            fontSize: '18px', 
            marginTop: '30px', 
            opacity: 0.8,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            You'll need your Loyverse API token and store ID
          </p>
        </div>
        
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.6; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(180deg); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            50% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        `}</style>
      </div>
    )
  }

  // No accounts state (when loading is complete but no accounts exist)
  if (accounts.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          animation: 'pulse 6s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          borderRadius: '50%',
          animation: 'float 10s ease-in-out infinite'
        }}></div>
        
        <div style={{ textAlign: 'center', maxWidth: '700px', padding: '60px', zIndex: 10, position: 'relative' }}>
          <div style={{
            width: '160px',
            height: '160px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 50px',
            boxShadow: '0 0 50px rgba(255,255,255,0.2)',
            animation: 'pulse 3s ease-in-out infinite'
          }}>
            <span style={{ fontSize: '80px' }}>🏪</span>
          </div>
          <h1 style={{ 
            fontSize: '56px', 
            fontWeight: 'bold', 
            marginBottom: '30px',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            Welcome to Loyverse
          </h1>
          <p style={{ 
            fontSize: '24px', 
            marginBottom: '50px', 
            opacity: 0.95, 
            lineHeight: '1.6',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Connect your first store to start tracking daily takings and gain valuable business insights
          </p>
          <button
            onClick={() => setActiveTab('accounts')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '3px solid rgba(255,255,255,0.4)',
              color: 'white',
              padding: '24px 48px',
              borderRadius: '20px',
              fontSize: '22px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(20px)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.transform = 'translateY(-6px) scale(1.05)'
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
            }}
          >
            Connect Your Store
          </button>
          <p style={{ 
            fontSize: '18px', 
            marginTop: '30px', 
            opacity: 0.8,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            You'll need your Loyverse API token and store ID
          </p>
        </div>
        
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.6; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(180deg); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            50% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        `}</style>
      </div>
    )
  }

  // Account management view (EPOS Style)
  if (activeTab === 'accounts') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Global CSS for animations */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            50% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
        `}</style>
        {/* Header */}
        <header style={{ 
          background: '#ffffff',
          borderBottom: '1px solid #e9ecef',
          padding: '12px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: '#ff6b35',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                boxShadow: '0 4px 8px rgba(255, 107, 53, 0.3)'
              }}>
                <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>L</span>
              </div>
              <div>
                              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                LOYVERSE
              </h1>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Analytics Dashboard</p>
              </div>
            </div>

            {/* Navigation */}
            <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveTab('accounts')}
                style={{
                  background: '#1a7338',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Stores
              </button>
              
              {/* Store Account Buttons */}
              {accounts.length > 0 && (
                <>
                  <div style={{ width: '1px', height: '24px', background: '#dee2e6', margin: '0 8px' }} />
                  {accounts.map((acc) => {
                    const cachedData = accountDataCache.get(acc.id)
                    const hasCache = cachedData && cachedData.data.length > 0
                    const isLoading = cachedData?.loading || false
                    
                    return (
                    <button
                      key={acc.id}
                      onClick={() => switchAccount(acc)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        border: '2px solid',
                        transition: 'all 0.2s ease',
                        background: acc.isActive ? '#6f42c1' : 'white',
                        color: acc.isActive ? 'white' : '#6f42c1',
                        borderColor: '#6f42c1'
                      }}
                    >
                      {acc.name}
                      {acc.isActive && <span style={{ marginLeft: '8px' }}>✓</span>}
                        {!acc.isActive && hasCache && (
                          <span style={{ 
                            marginLeft: '6px', 
                            fontSize: '10px',
                            opacity: 0.7
                          }}>⚡</span>
                        )}
                        {isLoading && (
                          <span style={{ 
                            marginLeft: '6px', 
                            fontSize: '10px',
                            animation: 'spin 1s linear infinite'
                          }}>⟳</span>
                        )}
                    </button>
                    )
                  })}
                </>
              )}
            </nav>

            <div style={{ fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? (
                <>
                  <span style={{ 
                    animation: 'spin 1s linear infinite',
                    fontSize: '12px'
                  }}>⟳</span>
                  <span style={{ color: '#007bff', fontWeight: '500' }}>Fetching Data...</span>
                </>
              ) : (
                new Date().toLocaleDateString()
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ 
          padding: '24px',
          maxWidth: '1400px',
          margin: '0 auto',
          position: 'relative'
        }}>
          
          {/* Switching Indicator */}
          {switchingAccount && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '24px',
              background: 'rgba(111, 66, 193, 0.1)',
              border: '1px solid rgba(111, 66, 193, 0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              color: '#6f42c1',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeInOut 0.5s ease-in-out',
              zIndex: 1000
            }}>
              <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
              Switching account...
            </div>
          )}
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              ← Back to Dashboard
            </button>
            
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#333',
              margin: 0
            }}>
              Store Management
            </h1>
            <p style={{ color: '#666', marginTop: '8px', fontSize: '16px' }}>
              Manage your Loyverse store connections and settings
            </p>
          </div>
          
          <AccountManager
            accounts={accounts}
            onAddAccount={addAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onSwitchAccount={switchAccount}
            activeAccount={activeAccount}
          />
        </main>
      </div>
    )
  }

  // Main dashboard view (EPOS Style)
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Global CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          50% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
      {/* Header */}
      <header style={{ 
        background: '#ffffff',
        borderBottom: '1px solid #e9ecef',
        padding: '12px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Logo */}
          <div 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => {
              setCurrentView('main')
              setSelectedDay(null)
              setActiveTab('dashboard')
            }}
          >
            <div style={{
              width: '50px',
              height: '50px',
              background: '#ff6b35',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              boxShadow: '0 4px 8px rgba(255, 107, 53, 0.3)',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            >
              <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>L</span>
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                LOYVERSE
              </h1>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Analytics Dashboard</p>
            </div>
          </div>

          {/* Navigation - Removed buttons as requested */}
          <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          </nav>

          <div style={{ fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? (
              <>
                <span style={{ 
                  animation: 'spin 1s linear infinite',
                  fontSize: '12px'
                }}>⟳</span>
                <span style={{ color: '#007bff', fontWeight: '500' }}>Fetching Data...</span>
              </>
            ) : (
              new Date().toLocaleDateString()
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>

        {/* Render based on current view */}
        {currentView === 'main' && (
          <MainDashboard 
            accounts={accounts}
            onAccountSelect={selectAccountFromMain}
            onManageAccounts={() => setCurrentView('accountManager')}
            formatCurrency={formatCurrency}
          />
        )}

        {currentView === 'accountManager' && (
          <AccountManager 
            accounts={accounts}
            onAddAccount={(account) => {
              const newAccount = { ...account, id: crypto.randomUUID() }
              const updatedAccounts = [...accounts, newAccount]
              saveAccounts(updatedAccounts)
            }}
            onUpdateAccount={(id, updates) => {
              const updatedAccounts = accounts.map(acc => 
                acc.id === id ? { ...acc, ...updates } : acc
              )
              saveAccounts(updatedAccounts)
            }}
            onDeleteAccount={deleteAccount}
            onSwitchAccount={(account) => {
              selectAccountFromMain(account)
              setCurrentView('account')
            }}
            activeAccount={activeAccount}
          />
        )}

        {currentView === 'account' && activeAccount && (
          <>
            {/* Performance Cards - Unified Design */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Check if this is a multi-store account with location breakdown */}
            {activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && dailyTakings.length > 0 ? (
            <>
            {(() => {
              const shopId = 'd5a7267b-ca6f-4490-9d66-b5ba46cc563c'
              const cafeId = 'e2aa143e-3e91-433e-a6d8-5a5538d429e2'
              const shopTotal = dailyTakings.reduce((sum, day) => sum + (day.locationBreakdown?.[shopId] || 0), 0)
              const cafeTotal = dailyTakings.reduce((sum, day) => sum + (day.locationBreakdown?.[cafeId] || 0), 0)
              const combinedTotal = shopTotal + cafeTotal
              const shopPercentage = combinedTotal > 0 ? (shopTotal / combinedTotal * 100).toFixed(1) : '0'
              const cafePercentage = combinedTotal > 0 ? (cafeTotal / combinedTotal * 100).toFixed(1) : '0'
              
              return (
                <>
                  <div style={{
                    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '20px', marginRight: '8px' }}>🏪</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                        SHOP LOCATION
                      </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                      {formatCurrency(shopTotal)}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {shopPercentage}% of total revenue
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '20px', marginRight: '8px' }}>☕</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                        CAFE LOCATION
                      </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                      {formatCurrency(cafeTotal)}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {cafePercentage}% of total revenue
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '20px', marginRight: '8px' }}>🏢</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                        COMBINED TOTAL
                      </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                      {formatCurrency(combinedTotal)}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      Both locations combined
                    </div>
                  </div>
                </>
              )
            })()}
            </>
        ) : (
            /* Single Store Account - Same Beautiful Design */
            <>
            <div style={{
                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '20px', marginRight: '8px' }}>💰</div>
                <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                  TOTAL REVENUE
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                {formatCurrency(totalTakings)}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                All sales combined
              </div>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
              borderRadius: '12px',
              padding: '20px',
              color: 'white',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '20px', marginRight: '8px' }}>📊</div>
                <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                  DAILY AVERAGE
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                {formatCurrency(averageTakings)}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                Average per day
              </div>
            </div>

          <div style={{
                background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
            borderRadius: '12px',
                padding: '20px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '20px', marginRight: '8px' }}>🏪</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                    STORE PERFORMANCE
                            </div>
                            </div>
                <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                  {dailyTakings.length > 0 ? dailyTakings.length : 0} days
                          </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Data collected
            </div>
            </div>
            </>
          )}
          </div>



            {/* Enhanced Daily Performance Table */}
            {!selectedDay ? (
              <PerformanceTable 
                dailyTakings={dailyTakings} 
                activeAccount={activeAccount}
                formatCurrency={formatCurrency}
                filterState={getAccountFilterState(activeAccount?.id || '')}
                onFilterStateChange={(newState) => updateAccountFilterState(activeAccount?.id || '', newState)}
                onDayClick={(dayData) => setSelectedDay(dayData)}
              />
            ) : (
              <DayDetailView 
                dayData={selectedDay}
                activeAccount={activeAccount}
                formatCurrency={formatCurrency}
                onBack={() => setSelectedDay(null)}
              />
            )}
          </>
        )}

      </main>
    </div>
  )
}
