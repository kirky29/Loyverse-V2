'use client'

import { useState, useEffect } from 'react'
import { LoyverseAccount, DailyTaking } from './types'
import AccountManager from './components/AccountManager'
import DayDetailView from './components/DayDetailView'
import SimpleMainDashboard from './components/SimpleMainDashboard'
import EnhancedPerformanceTable from './components/EnhancedPerformanceTable'

type ViewType = 'main' | 'account' | 'accountManager' | 'dayDetail'

export default function SimplePage() {
  // Core state
  const [currentView, setCurrentView] = useState<ViewType>('main')
  const [accounts, setAccounts] = useState<LoyverseAccount[]>([])
  const [activeAccount, setActiveAccount] = useState<LoyverseAccount | null>(null)
  const [dailyTakings, setDailyTakings] = useState<DailyTaking[]>([])
  const [selectedDay, setSelectedDay] = useState<DailyTaking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load accounts on mount
  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = () => {
    try {
      const savedAccounts = localStorage.getItem('loyverse-accounts')
      if (savedAccounts) {
        const parsedAccounts = JSON.parse(savedAccounts)
        setAccounts(parsedAccounts)
        
        // If only one account, don't auto-select it - let user choose
        if (parsedAccounts.length === 0) {
          setCurrentView('main')
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const saveAccounts = (updatedAccounts: LoyverseAccount[]) => {
    try {
      localStorage.setItem('loyverse-accounts', JSON.stringify(updatedAccounts))
      setAccounts(updatedAccounts)
    } catch (error) {
      console.error('Error saving accounts:', error)
    }
  }

  const selectAccount = async (account: LoyverseAccount) => {
    console.log('Selecting account:', account.name)
    
    // Clear previous state
    setSelectedDay(null)
    setError(null)
    setDailyTakings([])
    
    // Set active account
    setActiveAccount(account)
    
    // Update account active status
    const updatedAccounts = accounts.map(acc => ({
      ...acc,
      isActive: acc.id === account.id
    }))
    saveAccounts(updatedAccounts)
    
    // Switch to account view and fetch data
    setCurrentView('account')
    await fetchAccountData(account)
  }

  const fetchAccountData = async (account: LoyverseAccount, fromDate?: string, daysToLoad?: number) => {
    console.log('Fetching data for:', account.name, 'fromDate:', fromDate, 'daysToLoad:', daysToLoad)
    setLoading(true)
    
    try {
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
      const dailyTakingsData = Array.isArray(data) ? data : []
      
      console.log('Data fetched successfully for:', account.name, 'length:', dailyTakingsData.length)
      setDailyTakings(dailyTakingsData)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      console.error('Error fetching data for:', account.name, err)
      setError(errorMessage)
      setDailyTakings([])
    } finally {
      setLoading(false)
    }
  }

  const loadHistoricalData = () => {
    if (activeAccount) {
      // Load all data since October 1st, 2024
      fetchAccountData(activeAccount, '2024-10-01')
    }
  }

  const deleteAccount = (accountId: string) => {
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId)
    saveAccounts(updatedAccounts)
    
    if (activeAccount?.id === accountId) {
      setActiveAccount(null)
      setDailyTakings([])
      setCurrentView('main')
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

          {/* Current Account Info */}
          {activeAccount && (
            <div style={{
              background: '#f1f5f9',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#475569'
            }}>
              📊 {activeAccount.name}
            </div>
          )}

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
            </div>

            {/* Loading State */}
            {loading && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#6b7280'
              }}>
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
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '24px'
                }}>
                  {activeAccount.name} Dashboard
                </h2>
                
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
    </div>
  )
}
