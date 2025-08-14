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
                  {activeAccount?.name || 'LOYVERSE'}
                </h1>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>EPOS</p>
              </div>
            </div>

            {/* Navigation */}
            <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  cursor: 'pointer'
                }}
              >
                🏠 Dashboard
              </button>
              <button
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                🔍 Find Students
              </button>
              <button
                style={{
                  background: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                📦 Find Products
              </button>
              <button
                style={{
                  background: '#e83e8c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                🛒 Saved Baskets
              </button>
              <button
                style={{
                  background: '#fd7e14',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                📊 Sales Reports
              </button>
              <button
                onClick={() => setActiveTab('accounts')}
                style={{
                  background: '#20c997',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                ⚙️ Admin
              </button>
              <button
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                🚪 Logout
              </button>
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
                {activeAccount?.name || 'LOYVERSE'}
              </h1>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>EPOS</p>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                background: activeTab === 'dashboard' ? '#6c757d' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#5a6268'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = activeTab === 'dashboard' ? '#6c757d' : '#6c757d'
              }}
            >
              🏠 Dashboard
            </button>
            <button
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🔍 Find Students
            </button>
            <button
              style={{
                background: '#6f42c1',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📦 Find Products
            </button>
            <button
              style={{
                background: '#e83e8c',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🛒 Saved Baskets
            </button>
            <button
              style={{
                background: '#fd7e14',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📊 Sales Reports
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              style={{
                background: '#20c997',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ⚙️ Admin
            </button>
            <button
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🚪 Logout
            </button>
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
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
          minHeight: '80vh'
        }}>
          {/* Left Column - Add Items */}
          <div>
            {/* Add Items Header */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#8B4513',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <span style={{ color: 'white', fontSize: '18px' }}>🛒</span>
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                  Add Items
                </h2>
              </div>

              {/* Search Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  color: '#666', 
                  marginBottom: '12px',
                  fontWeight: '500'
                }}>
                  Search Existing Products
                </h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search products by name, code, category, or any words... (e.g., 'Flower Shop')"
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '2px solid #e9ecef',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    style={{
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    📦 Browse All
                  </button>
                </div>
              </div>

              {/* Custom Item Section */}
              <div>
                <h3 style={{ 
                  fontSize: '16px', 
                  color: '#666', 
                  marginBottom: '12px',
                  fontWeight: '500'
                }}>
                  Add Custom Item
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ 
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '4px'
                    }}>
                      Item Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Special Service"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '4px'
                    }}>
                      Price (£) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 10.50"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#333',
                      marginBottom: '4px'
                    }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      defaultValue="1"
                      min="1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ➕ Add to Basket
                  </button>
                  <button
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
                  TOTAL REVENUE
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>
                  {formatCurrency(totalTakings)}
                </div>
              </div>
              <div style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
                  DAILY AVERAGE
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>
                  {formatCurrency(averageTakings)}
                </div>
              </div>
              <div style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
                  DAYS TRACKED
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>
                  {dailyTakings.length}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Basket */}
          <div>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              height: 'fit-content'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#333', 
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                Basket 
                <span style={{ 
                  fontSize: '16px', 
                  color: '#666',
                  fontWeight: 'normal'
                }}>(0)</span>
              </h2>
              
              {/* Total Section */}
              <div style={{
                background: 'linear-gradient(135deg, #ffc107 0%, #ffca28 100%)',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '20px',
                boxShadow: '0 4px 8px rgba(255, 193, 7, 0.3)'
              }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '8px'
                }}>
                  Total
                </div>
                <div style={{ 
                  fontSize: '36px', 
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  £0.00
                </div>
              </div>

              {/* Empty basket message */}
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '12px'
                }}>🛒</div>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Your basket is empty.<br />
                  Add items to get started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
