// app/optimized-page.tsx
'use client'

import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { LoyverseAccount, DailyTaking } from './types'
import AuthWrapper from './components/AuthWrapper'
import AccountManager from './components/AccountManager'
import DayDetailView from './components/DayDetailView'
import SimpleMainDashboard from './components/SimpleMainDashboard'
import EnhancedPerformanceTable from './components/EnhancedPerformanceTable'
import { DataService } from '../lib/dataService'
import { AccountService } from '../lib/accountService'

type ViewType = 'main' | 'account' | 'accountManager' | 'dayDetail'

interface OptimizedPageProps {
  user: User
}

function OptimizedPage({ user }: OptimizedPageProps) {
  // Core state
  const [currentView, setCurrentView] = useState<ViewType>('main')
  const [accounts, setAccounts] = useState<LoyverseAccount[]>([])
  const [activeAccount, setActiveAccount] = useState<LoyverseAccount | null>(null)
  const [dailyTakings, setDailyTakings] = useState<DailyTaking[]>([])
  const [selectedDay, setSelectedDay] = useState<DailyTaking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Services
  const [dataService] = useState(() => new DataService(user.uid))
  const [accountService] = useState(() => new AccountService(user.uid))

  // Background refresh interval
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Load accounts on mount
  useEffect(() => {
    loadAccounts()
    
    // Cleanup on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [user.uid])

  // Setup background refresh when account is active
  useEffect(() => {
    if (activeAccount && currentView === 'account') {
      // Refresh every 2 minutes in background
      const interval = setInterval(() => {
        dataService.backgroundRefresh(activeAccount)
      }, 2 * 60 * 1000)
      
      setRefreshInterval(interval)
      
      return () => clearInterval(interval)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [activeAccount, currentView, dataService])

  const loadAccounts = async () => {
    try {
      console.log('🔄 Loading accounts...')
      const loadedAccounts = await accountService.loadAccounts()
      setAccounts(loadedAccounts)
      console.log('✅ Accounts loaded:', loadedAccounts.length)
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const saveAccounts = async (updatedAccounts: LoyverseAccount[]) => {
    try {
      await accountService.saveAccounts(updatedAccounts)
      setAccounts(updatedAccounts)
    } catch (error) {
      console.error('Error saving accounts:', error)
    }
  }

  const selectAccount = async (account: LoyverseAccount) => {
    console.log('🎯 Selecting account:', account.name)
    
    // Clear previous state
    setSelectedDay(null)
    setError(null)
    
    // Set active account
    setActiveAccount(account)
    
    // Update account active status
    const updatedAccounts = accounts.map(acc => ({
      ...acc,
      isActive: acc.id === account.id
    }))
    await saveAccounts(updatedAccounts)
    
    // Switch to account view and fetch data
    setCurrentView('account')
    await fetchAccountData(account)
  }

  const fetchAccountData = async (account: LoyverseAccount, fromDate?: string, daysToLoad?: number) => {
    console.log('📊 Fetching data for:', account.name, { fromDate, daysToLoad })
    setLoading(true)
    
    try {
      const data = await dataService.getData(account, fromDate, daysToLoad)
      setDailyTakings(data)
      setError(null)
      console.log('✅ Data loaded:', data.length, 'days')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      console.error('❌ Error fetching data:', err)
      setError(errorMessage)
      setDailyTakings([])
    } finally {
      setLoading(false)
    }
  }

  const loadHistoricalData = () => {
    if (activeAccount) {
      console.log('📈 Loading historical data since Oct 2024')
      fetchAccountData(activeAccount, '2024-10-01')
    }
  }

  const deleteAccount = async (accountId: string) => {
    try {
      await accountService.deleteAccount(accountId)
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId)
      setAccounts(updatedAccounts)
      
      // Clear cache for deleted account
      await dataService.clearAccountCache(accountId)
      
      if (activeAccount?.id === accountId) {
        setActiveAccount(null)
        setDailyTakings([])
        setCurrentView('main')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value)
  }

  const goHome = () => {
    setCurrentView('main')
    setActiveAccount(null)
    setSelectedDay(null)
    setDailyTakings([])
    setError(null)
  }

  // Clear all cache (for debugging/admin)
  const clearAllCache = async () => {
    try {
      await dataService.clearAllCache()
      console.log('🧹 All cache cleared')
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <div 
            onClick={goHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              L
            </div>
            <div>
              <h1 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0,
                lineHeight: 1
              }}>
                LOYVERSE
              </h1>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Analytics Dashboard</p>
            </div>
          </div>

          {/* Current Account Info + Performance Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeAccount && (
              <div style={{
                background: '#f1f5f9',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📊 {activeAccount.name}</span>
                {refreshInterval && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#10b981',
                    borderRadius: '50%',
                    animation: 'pulse 2s ease-in-out infinite'
                  }} title="Real-time sync active" />
                )}
              </div>
            )}

            {/* Dev tools */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={clearAllCache}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                title="Clear all cache (dev only)"
              >
                🧹
              </button>
            )}
          </div>

          {/* Date */}
          <div style={{ fontSize: '14px', color: '#666' }}>
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {currentView === 'main' && (
          <SimpleMainDashboard 
            accounts={accounts}
            onAccountSelect={selectAccount}
            onManageAccounts={() => setCurrentView('accountManager')}
            formatCurrency={formatCurrency}
          />
        )}

        {currentView === 'accountManager' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <AccountManager 
              accounts={accounts}
              onAddAccount={async (account) => {
                const newAccount = { ...account, id: crypto.randomUUID() }
                const updatedAccounts = [...accounts, newAccount]
                await saveAccounts(updatedAccounts)
              }}
              onUpdateAccount={async (id, updates) => {
                const updatedAccounts = accounts.map(acc => 
                  acc.id === id ? { ...acc, ...updates } : acc
                )
                await saveAccounts(updatedAccounts)
              }}
              onDeleteAccount={deleteAccount}
              onSwitchAccount={selectAccount}
              activeAccount={activeAccount}
            />
          </div>
        )}

        {currentView === 'account' && activeAccount && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            {/* Navigation Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button
                onClick={goHome}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ← Back to Store Selection
              </button>

              <button
                onClick={loadHistoricalData}
                disabled={loading}
                style={{
                  background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                📊 Load All Data (Since Oct 2024)
              </button>

              {/* Cache status indicator */}
              <div style={{
                background: '#ecfdf5',
                color: '#065f46',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ⚡ Smart Cache Active
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#6b7280'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e2e8f0',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading...</div>
                <div style={{ fontSize: '14px' }}>Fetching data for {activeAccount.name}</div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                color: '#dc2626'
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Success State - Show Data */}
            {!loading && !error && dailyTakings.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0
                  }}>
                    {activeAccount.name} Dashboard
                  </h2>
                  
                  {/* Performance indicator */}
                  <div style={{
                    background: '#f0fdf4',
                    color: '#166534',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    🚀 Optimized Performance
                  </div>
                </div>
                
                {/* Simple Performance Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  marginBottom: '32px'
                }}>
                  {/* Total Revenue */}
                  <div style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    borderRadius: '12px',
                    padding: '24px',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                      TOTAL REVENUE
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700' }}>
                      {formatCurrency(dailyTakings.reduce((sum, day) => sum + day.total, 0))}
                    </div>
                  </div>

                  {/* Total Receipts */}
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    padding: '24px',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                      TOTAL RECEIPTS
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700' }}>
                      {dailyTakings.reduce((sum, day) => sum + (day.receiptCount || 0), 0).toLocaleString()}
                    </div>
                  </div>

                  {/* Average Receipt */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '12px',
                    padding: '24px',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                      AVERAGE RECEIPT
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700' }}>
                      {formatCurrency(
                        dailyTakings.reduce((sum, day) => sum + (day.averageReceipt || 0), 0) / 
                        Math.max(dailyTakings.length, 1)
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Performance Table */}
                <EnhancedPerformanceTable 
                  dailyTakings={dailyTakings}
                  activeAccount={activeAccount}
                  formatCurrency={formatCurrency}
                  onDayClick={(day) => {
                    setSelectedDay(day)
                    setCurrentView('dayDetail')
                  }}
                  onLoadHistoricalData={loadHistoricalData}
                />
              </div>
            )}

            {/* No Data State */}
            {!loading && !error && dailyTakings.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>No Data Available</div>
                <div style={{ fontSize: '14px' }}>No sales data found for {activeAccount.name}</div>
              </div>
            )}
          </div>
        )}

        {currentView === 'dayDetail' && selectedDay && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            <DayDetailView 
              dayData={selectedDay}
              activeAccount={activeAccount}
              formatCurrency={formatCurrency}
              onBack={() => setCurrentView('account')}
            />
          </div>
        )}
      </main>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

// Main wrapper component
export default function OptimizedMainPage() {
  return (
    <AuthWrapper>
      {(user) => <OptimizedPage user={user} />}
    </AuthWrapper>
  )
}
