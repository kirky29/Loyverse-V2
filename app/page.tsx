'use client'

import { useState, useEffect } from 'react'
import { LoyverseAccount, DailyTaking } from './types'
import AccountManager from './components/AccountManager'
import DailyTakingsChart from './components/DailyTakingsChart'
import DailyTakingsTable from './components/DailyTakingsTable'

export default function Home() {
  const [dailyTakings, setDailyTakings] = useState<DailyTaking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts'>('dashboard')
  const [accounts, setAccounts] = useState<LoyverseAccount[]>([])
  const [activeAccount, setActiveAccount] = useState<LoyverseAccount | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    loadAccounts()
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing loading to false')
        setLoading(false)
      }
    }, 3000)
    
    return () => clearTimeout(timeout)
  }, [])

  // Fetch data when the active account changes (do not depend on `loading` to avoid loops)
  useEffect(() => {
    if (activeAccount) {
      fetchDailyTakings()
    }
  }, [activeAccount])

  // When there are no accounts, end loading state
  useEffect(() => {
    if (!activeAccount && accounts.length === 0) {
      setLoading(false)
    }
  }, [activeAccount, accounts.length])

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
    
    if (activeAccount?.id === id) {
      const newActive = updatedAccounts.find(acc => acc.isActive) || updatedAccounts[0] || null
      setActiveAccount(newActive)
    }
  }

  const switchAccount = (account: LoyverseAccount) => {
    const updatedAccounts = accounts.map(acc => ({
      ...acc,
      isActive: acc.id === account.id
    }))
    saveAccounts(updatedAccounts)
    setActiveAccount(account)
    setActiveTab('dashboard')
  }

  const fetchDailyTakings = async () => {
    if (!activeAccount) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/daily-takings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiToken: activeAccount.apiToken,
          storeId: activeAccount.storeId,
          includeAllStores: activeAccount.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily takings')
      }
      const data = await response.json()
      setDailyTakings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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

  // Loading state
  if (loading) {
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
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
        
        <div style={{ textAlign: 'center', zIndex: 10, position: 'relative' }}>
          <div style={{
            width: '120px',
            height: '120px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite',
            margin: '0 auto 40px',
            boxShadow: '0 0 30px rgba(255,255,255,0.3)'
          }}></div>
          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            Loading your dashboard
          </h2>
          <p style={{ 
            fontSize: '20px', 
            opacity: 0.9,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Preparing your business insights...
          </p>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
        `}</style>
      </div>
    )
  }

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

  // No accounts state
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
        `}</style>
      </div>
    )
  }

  // Account management view (EPOS Style)
  if (activeTab === 'accounts') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
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
                  {accounts.map((acc) => (
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
                    </button>
                  ))}
                </>
              )}
            </nav>

            <div style={{ fontSize: '14px', color: '#666' }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ 
          padding: '24px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
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
                background: activeTab === 'dashboard' ? '#0056b3' : '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: activeTab === 'dashboard' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              style={{
                background: activeTab === 'accounts' ? '#1a7338' : '#20c997',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: activeTab === 'accounts' ? '600' : '500',
                cursor: 'pointer'
              }}
            >
              ⚙️ Stores
            </button>
            
            {/* Store Account Buttons */}
            {accounts.length > 0 && (
              <>
                <div style={{ width: '1px', height: '24px', background: '#dee2e6', margin: '0 8px' }} />
                {accounts.map((acc) => (
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
                  </button>
                ))}
                <button
                  onClick={() => setActiveTab('accounts')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: '2px dashed #20c997',
                    background: 'white',
                    color: '#20c997'
                  }}
                >
                  + Add Store
                </button>
              </>
            )}
          </nav>

          <div style={{ fontSize: '14px', color: '#666' }}>
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>


        {/* Sales Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', 
            padding: '24px', 
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>💰</div>
              <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                TOTAL REVENUE
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
              {formatCurrency(totalTakings)}
            </div>
            {activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && dailyTakings.length > 0 && (
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Combined from all locations</div>
            )}
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)', 
            padding: '24px', 
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>📊</div>
              <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                DAILY AVERAGE
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>
              {formatCurrency(averageTakings)}
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #fd7e14 0%, #dc6500 100%)', 
            padding: '24px', 
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(253, 126, 20, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>📅</div>
              <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                DAYS TRACKED
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700' }}>
              {dailyTakings.length}
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%)', 
            padding: '24px', 
            borderRadius: '12px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(111, 66, 193, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>🏪</div>
              <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>
                ACTIVE STORE
              </div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>
              {activeAccount?.name || 'No Store Selected'}
            </div>
          </div>
        </div>

        {/* Location Breakdown for Multi-Store Accounts */}
        {activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && dailyTakings.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: '0 0 20px 0' }}>
              Location Performance (Northcote)
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                borderRadius: '12px',
                padding: '24px',
                border: '2px solid #2196f3'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1565c0', margin: '0 0 12px 0' }}>
                  🏪 Shop Location
                </h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#0d47a1', margin: '0 0 8px 0' }}>
                  {formatCurrency(dailyTakings.reduce((sum, day) => {
                    const shopId = 'd5a7267b-ca6f-4490-9d66-b5ba46cc563c'
                    return sum + (day.locationBreakdown?.[shopId] || 0)
                  }, 0))}
                </p>
                <p style={{ color: '#1565c0', fontWeight: '500', margin: 0 }}>
                  Total revenue from Shop
                </p>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                borderRadius: '12px',
                padding: '24px',
                border: '2px solid #4caf50'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32', margin: '0 0 12px 0' }}>
                  ☕ Cafe Location
                </h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1b5e20', margin: '0 0 8px 0' }}>
                  {formatCurrency(dailyTakings.reduce((sum, day) => {
                    const cafeId = 'e2aa143e-3e91-433e-a6d8-5a5538d429e2'
                    return sum + (day.locationBreakdown?.[cafeId] || 0)
                  }, 0))}
                </p>
                <p style={{ color: '#2e7d32', fontWeight: '500', margin: 0 }}>
                  Total revenue from Cafe
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Charts and Table Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Chart */}
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: '0 0 20px 0' }}>
              📈 Revenue Trends
            </h2>
            <DailyTakingsChart data={dailyTakings} />
          </div>

          {/* Table */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderBottom: '1px solid #dee2e6'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', margin: '0 0 8px 0' }}>
                📋 Daily Sales Breakdown
              </h2>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                Detailed view of daily performance for {activeAccount?.name || 'your store'}
              </p>
            </div>
            <DailyTakingsTable data={dailyTakings} />
          </div>
        </div>
      </main>
    </div>
  )
}
