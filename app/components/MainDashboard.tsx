'use client'

import { useState, useEffect } from 'react'
import { LoyverseAccount, DailyTaking } from '../types'

interface MainDashboardProps {
  accounts: LoyverseAccount[]
  onAccountSelect: (account: LoyverseAccount) => void
  onManageAccounts: () => void
  formatCurrency: (amount: number) => string
}

interface AccountSummary {
  account: LoyverseAccount
  todaysTotal: number
  isLoading: boolean
  error: string | null
}

export default function MainDashboard({ 
  accounts, 
  onAccountSelect, 
  onManageAccounts,
  formatCurrency 
}: MainDashboardProps) {
  const [accountSummaries, setAccountSummaries] = useState<AccountSummary[]>([])

  useEffect(() => {
    // Initialize account summaries
    const summaries: AccountSummary[] = accounts.map(account => ({
      account,
      todaysTotal: 0,
      isLoading: true,
      error: null
    }))
    setAccountSummaries(summaries)

    // Fetch today's data for each account
    accounts.forEach((account, index) => {
      fetchTodaysTotal(account, index)
    })
  }, [accounts])

  const fetchTodaysTotal = async (account: LoyverseAccount, index: number) => {
    try {
      const response = await fetch('/api/daily-takings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiToken: account.apiToken,
          storeId: account.storeId,
          includeAllStores: account.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2'
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${account.name}`)
      }

      const dailyTakings: DailyTaking[] = await response.json()
      
      // Find today's data
      const today = new Date().toISOString().split('T')[0]
      const todaysData = dailyTakings.find(day => day.date === today)
      const todaysTotal = todaysData?.total || 0

      // Update the specific account summary
      setAccountSummaries(prev => prev.map((summary, i) => 
        i === index ? { ...summary, todaysTotal, isLoading: false } : summary
      ))
    } catch (error) {
      console.error(`Error fetching data for ${account.name}:`, error)
      setAccountSummaries(prev => prev.map((summary, i) => 
        i === index ? { 
          ...summary, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Failed to load data'
        } : summary
      ))
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        color: 'white'
      }}>
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: 'bold', 
          margin: '0 0 12px 0' 
        }}>
          📊 Loyverse Analytics
        </h1>
        <p style={{ 
          fontSize: '18px', 
          opacity: 0.9, 
          margin: 0 
        }}>
          Select an account to view detailed analytics
        </p>
      </div>

      {/* Account Cards Grid */}
      {accounts.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '24px',
          marginBottom: '32px'
        }}>
          {accountSummaries.map((summary, index) => {
            const isToday = new Date().getDay() !== 0 // Not Sunday
            
            return (
              <div
                key={summary.account.id}
                onClick={() => onAccountSelect(summary.account)}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '2px solid #e1e5e9',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)'
                  e.currentTarget.style.borderColor = '#667eea'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                  e.currentTarget.style.borderColor = '#e1e5e9'
                }}
              >
                {/* Account Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '20px'
                }}>
                  <div>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      color: '#333',
                      margin: '0 0 4px 0'
                    }}>
                      {summary.account.name}
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#666',
                      margin: 0
                    }}>
                      Store ID: {summary.account.storeId.slice(0, 8)}...
                    </p>
                  </div>
                  <div style={{
                    background: summary.account.isActive ? '#4caf50' : '#e1e5e9',
                    color: summary.account.isActive ? 'white' : '#666',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {summary.account.isActive ? 'ACTIVE' : 'READY'}
                  </div>
                </div>

                {/* Today's Total */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#666',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ marginRight: '8px' }}>📅</span>
                    Today's Sales
                  </div>
                  
                  {summary.isLoading ? (
                    <div style={{ 
                      fontSize: '32px', 
                      fontWeight: 'bold', 
                      color: '#999' 
                    }}>
                      Loading...
                    </div>
                  ) : summary.error ? (
                    <div>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: '#dc3545' 
                      }}>
                        Error
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#dc3545',
                        marginTop: '4px'
                      }}>
                        {summary.error}
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      fontSize: '36px', 
                      fontWeight: 'bold', 
                      color: summary.todaysTotal > 0 ? '#4caf50' : '#999'
                    }}>
                      {formatCurrency(summary.todaysTotal)}
                    </div>
                  )}
                </div>

                {/* Status Indicators */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #e1e5e9'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ marginRight: '6px' }}>
                      {summary.todaysTotal > 0 ? '✅' : '⏳'}
                    </span>
                    {summary.todaysTotal > 0 ? 'Sales today' : 'No sales yet'}
                  </div>
                  
                  <div style={{ 
                    fontSize: '20px',
                    color: '#667eea'
                  }}>
                    →
                  </div>
                </div>

                {/* Gradient overlay for visual appeal */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: summary.account.isActive 
                    ? 'linear-gradient(90deg, #4caf50, #2196f3)'
                    : 'linear-gradient(90deg, #667eea, #764ba2)'
                }} />
              </div>
            )
          })}
        </div>
      ) : (
        /* No Accounts State */
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏪</div>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#333',
            marginBottom: '12px'
          }}>
            No Accounts Set Up
          </h3>
          <p style={{ 
            fontSize: '16px', 
            color: '#666',
            marginBottom: '24px'
          }}>
            Add your first Loyverse account to get started with analytics
          </p>
        </div>
      )}

      {/* Manage Accounts Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onManageAccounts}
          style={{
            background: 'linear-gradient(135deg, #20c997, #17a2b8)',
            color: 'white',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(32, 201, 151, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(32, 201, 151, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(32, 201, 151, 0.3)'
          }}
        >
          ⚙️ Manage Accounts
        </button>
      </div>

      {/* Quick Stats Summary */}
      {accounts.length > 0 && (
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h4 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#333',
            marginBottom: '16px'
          }}>
            📊 Today's Overview
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                {accounts.length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Total Accounts</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>
                {formatCurrency(
                  accountSummaries.reduce((sum, summary) => sum + summary.todaysTotal, 0)
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Combined Sales</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196f3' }}>
                {accountSummaries.filter(s => s.todaysTotal > 0).length}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Active Today</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
