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

  useEffect(() => {
    if (activeAccount) {
      fetchDailyTakings()
    } else if (accounts.length === 0 && !loading) {
      // If no accounts exist and we're not loading, stop loading
      setLoading(false)
    }
  }, [activeAccount, accounts.length, loading])

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
          storeId: activeAccount.storeId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily takings')
      }
      const data = await response.json()
      setDailyTakings(data)
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

  // Account management view
  if (activeTab === 'accounts') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '40px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            ← Back to Dashboard
          </button>
          
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Store Management
          </h1>
          
          <AccountManager
            accounts={accounts}
            onAddAccount={addAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onSwitchAccount={switchAccount}
            activeAccount={activeAccount}
          />
        </div>
      </div>
    )
  }

  // Main dashboard view
  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb' }}>
      

      

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '320px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(30px)',
        borderRight: '1px solid rgba(255,255,255,0.3)',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50,
        boxShadow: '8px 0 40px rgba(0,0,0,0.2)',
        display: 'none'
      }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Logo */}
          <div style={{
            padding: '40px 32px',
            borderBottom: '1px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px',
              boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
              animation: 'pulse 3s ease-in-out infinite'
            }}>
              <span style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>L</span>
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                Loyverse
              </h1>
              <p style={{ fontSize: '16px', color: '#64748b', margin: 0, fontWeight: '500' }}>
                Business Intelligence
              </p>
            </div>
          </div>

          {/* Account Switcher */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '16px'
            }}>
              Active Store
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => switchAccount(account)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '16px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    ...(account.isActive ? {
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                      border: '2px solid #818cf8',
                      color: '#3730a3',
                      boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                      transform: 'scale(1.02)'
                    } : {
                      background: 'transparent',
                      color: '#475569'
                    })
                  }}
                  onMouseOver={(e) => {
                    if (!account.isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!account.isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        marginRight: '12px',
                        ...(account.isActive ? {
                          background: '#6366f1',
                          boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.3)'
                        } : {
                          background: '#cbd5e1'
                        })
                      }} />
                      <span style={{ fontWeight: '600' }}>{account.name}</span>
                    </div>
                    {account.isActive && (
                      <span style={{ fontSize: '16px' }}>✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setActiveTab('accounts')}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '16px',
                color: '#6366f1',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '2px dashed #c7d2fe',
                borderRadius: '16px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'
                e.currentTarget.style.borderColor = '#818cf8'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.2)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'
                e.currentTarget.style.borderColor = '#c7d2fe'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              + Add New Store
            </button>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '24px 32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6366f1',
                  background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                  borderRadius: '12px',
                  border: '1px solid #818cf8',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)'
                }}
              >
                <span style={{ marginRight: '12px', fontSize: '18px' }}>📊</span>
                Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab('accounts')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#475569',
                  background: 'transparent',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <span style={{ marginRight: '12px', fontSize: '18px' }}>⚙️</span>
                Store Settings
              </button>
            </div>
          </nav>

          {/* Account Info */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize: '14px' }}>
                <p style={{ color: '#1e293b', fontWeight: '600', margin: '0 0 4px 0' }}>
                  {activeAccount?.name || 'Unknown Store'}
                </p>
                <p style={{ color: '#64748b', margin: 0, fontSize: '12px' }}>
                  ID: {activeAccount?.storeId?.substring(0, 8) || 'Unknown'}...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 0 }}>
        {/* Top Bar */}
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px'
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                display: 'none',
                padding: '12px',
                borderRadius: '12px',
                color: '#64748b',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              ☰
            </button>
            
            <div style={{ textAlign: 'right', color: '#6b7280', fontSize: '14px' }}>{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Dashboard Content */}
        <main style={{ padding: '40px 32px' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: -0.2, color: '#0f172a', margin: 0 }}>
              Business Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '6px' }}>
              Overview for {activeAccount?.name || 'your store'}
            </p>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Total Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(totalTakings)}</div>
              {activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && dailyTakings.length > 0 && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>Combined from all locations</div>
              )}
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Daily Average</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(averageTakings)}</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Days Tracked</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>{dailyTakings.length}</div>
            </div>
          </div>

          {/* Location Breakdown for Multi-Store Accounts */}
          {activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && dailyTakings.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.1)',
              padding: '32px',
              marginBottom: '40px'
            }}>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 32px 0' }}>
                Location Performance
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                  borderRadius: '24px',
                  padding: '32px',
                  border: '1px solid #818cf8'
                }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#3730a3', margin: '0 0 16px 0' }}>
                    Shop Location
                  </h3>
                  <p style={{ fontSize: '60px', fontWeight: 'bold', color: '#4338ca', margin: '0 0 12px 0' }}>
                    {formatCurrency(dailyTakings.reduce((sum, day) => {
                      const shopId = 'd5a7267b-ca6f-4490-9d66-b5ba46cc563c'
                      return sum + (day.locationBreakdown?.[shopId] || 0)
                    }, 0))}
                  </p>
                  <p style={{ color: '#4338ca', fontWeight: '500', margin: 0 }}>
                    Total revenue from Shop
                  </p>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                  borderRadius: '24px',
                  padding: '32px',
                  border: '1px solid #34d399'
                }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46', margin: '0 0 16px 0' }}>
                    Cafe Location
                  </h3>
                  <p style={{ fontSize: '60px', fontWeight: 'bold', color: '#047857', margin: '0 0 12px 0' }}>
                    {formatCurrency(dailyTakings.reduce((sum, day) => {
                      const cafeId = 'e2aa143e-3e91-433e-a6d8-5a5538d429e2'
                      return sum + (day.locationBreakdown?.[cafeId] || 0)
                    }, 0))}
                  </p>
                  <p style={{ color: '#047857', fontWeight: '500', margin: 0 }}>
                    Total revenue from Cafe
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: '12px' }}>
              Revenue Trends
            </h2>
            <DailyTakingsChart data={dailyTakings} />
          </div>

          {/* Table */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '24px 32px',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px 0' }}>
                Daily Breakdown
              </h2>
              <p style={{ color: '#64748b', margin: 0, fontSize: '18px' }}>
                Detailed view of your daily performance
              </p>
            </div>
            <DailyTakingsTable data={dailyTakings} />
          </div>
        </main>
      </div>

      {/* Mobile responsive styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="margin-left: 320px"] {
            margin-left: 0;
          }
          div[style*="width: 320px"] {
            display: block;
          }
        }
      `}</style>
    </div>
  )
}
