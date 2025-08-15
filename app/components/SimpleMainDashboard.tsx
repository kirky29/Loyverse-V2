'use client'

import React, { useState, useEffect } from 'react'
import { DataService } from '../../lib/dataService'

interface LoyverseAccount {
  id: string
  name: string
  apiToken: string
  storeId: string
  isActive: boolean
}

interface SimpleMainDashboardProps {
  accounts: LoyverseAccount[]
  onAccountSelect: (account: LoyverseAccount) => void
  onManageAccounts: () => void
  formatCurrency: (value: number) => string
  userId?: string
}

interface TodaysSummary {
  account: LoyverseAccount
  todaysTotal: number
  loading: boolean
  error: string | null
}

export default function SimpleMainDashboard({ 
  accounts, 
  onAccountSelect, 
  onManageAccounts, 
  formatCurrency,
  userId
}: SimpleMainDashboardProps) {
  const [summaries, setSummaries] = useState<TodaysSummary[]>([])
  const [dataService] = useState(() => userId ? new DataService(userId) : null)

  useEffect(() => {
    // Initialize summaries for all accounts
    const initialSummaries = accounts.map(account => ({
      account,
      todaysTotal: 0,
      loading: true,
      error: null
    }))
    setSummaries(initialSummaries)

    // Fetch today's totals for each account
    accounts.forEach(async (account, index) => {
      try {
        if (dataService) {
          // Use optimized DataService for fast loading
          console.log('🚀 Fetching critical data for dashboard:', account.name)
          const criticalData = await dataService.getCriticalData(account)
          
          // Find today's data
          const today = new Date().toISOString().split('T')[0]
          const todayData = criticalData.find(item => item.date === today)
          const todaysTotal = todayData ? todayData.total : 0

          console.log('✅ Today total for', account.name, ':', todaysTotal)

          // Update just this account's summary
          setSummaries(prev => prev.map((summary, idx) => 
            idx === index 
              ? { ...summary, todaysTotal, loading: false, error: null }
              : summary
          ))
        } else {
          // Fallback to direct API call for backward compatibility
          console.log('📡 Fetching data directly for:', account.name)
          const response = await fetch('/api/daily-takings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              apiToken: account.apiToken,
              storeId: account.storeId,
              includeAllStores: account.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2',
              priority: 'high',
              daysToLoad: 7
            })
          })

          if (!response.ok) {
            throw new Error('Failed to fetch data')
          }

          const data = await response.json()
          const today = new Date().toISOString().split('T')[0]
          const todayData = data.find((item: any) => item.date === today)
          const todaysTotal = todayData ? todayData.total : 0

          console.log('✅ Today total for', account.name, ':', todaysTotal)

          // Update just this account's summary
          setSummaries(prev => prev.map((summary, idx) => 
            idx === index 
              ? { ...summary, todaysTotal, loading: false, error: null }
              : summary
          ))
        }
      } catch (error) {
        console.error('❌ Error fetching data for', account.name, ':', error)
        setSummaries(prev => prev.map((summary, idx) => 
          idx === index 
            ? { ...summary, loading: false, error: 'Failed to load' }
            : summary
        ))
      }
    })
  }, [accounts, dataService])

  const handleAccountClick = (account: LoyverseAccount) => {
    console.log('Simple dashboard - account clicked:', account.name)
    onAccountSelect(account)
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '12px',
          margin: 0
        }}>
          Select Your Store
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: 0
        }}>
          Choose a store to view its dashboard and analytics
        </p>
      </div>

      {/* Account Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {summaries.map((summary, index) => (
          <div
            key={summary.account.id}
            onClick={() => handleAccountClick(summary.account)}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              border: '2px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {/* Store Icon */}
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              fontSize: '24px'
            }}>
              🏪
            </div>

            {/* Store Name */}
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '8px',
              margin: 0
            }}>
              {summary.account.name}
            </h3>

            {/* Today's Total */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '4px',
                margin: 0
              }}>
                Today's Sales
              </p>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: summary.loading ? '#6b7280' : summary.error ? '#ef4444' : '#059669'
              }}>
                {summary.loading ? (
                  <span style={{ fontSize: '16px' }}>Loading...</span>
                ) : summary.error ? (
                  <span style={{ fontSize: '16px' }}>{summary.error}</span>
                ) : (
                  formatCurrency(summary.todaysTotal)
                )}
              </div>
            </div>

            {/* Click indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              <span>View Dashboard</span>
              <span style={{ marginLeft: '8px' }}>→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Manage Accounts Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onManageAccounts}
          style={{
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e5e7eb'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6'
          }}
        >
          ⚙️ Manage Store Connections
        </button>
      </div>
    </div>
  )
}
