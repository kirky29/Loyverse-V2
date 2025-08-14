// WORKING VERSION - Multi-account dashboard with location breakdown
// Features: Combined totals + separate Shop/Cafe breakdowns
// Last tested: Working with both Account 1 (Shop+Cafe) and Account 2 (Single store)
'use client'

import { useState, useEffect } from 'react'
import DailyTakingsChart from './components/DailyTakingsChart'
import DailyTakingsTable from './components/DailyTakingsTable'
import AccountManager from './components/AccountManager'
import { DailyTaking } from './types'

interface LoyverseAccount {
  id: string
  name: string
  apiToken: string
  storeId: string
  isActive: boolean
}

export default function Dashboard() {
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
    }, 5000)
    
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

  const totalTakings = dailyTakings.reduce((sum, day) => sum + (day.total || 0), 0)
  const averageTakings = dailyTakings.length > 0 ? totalTakings / dailyTakings.length : 0

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '£0.00'
    }
    return `£${value.toFixed(2)}`
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h2 className="mt-8 text-2xl font-bold text-slate-800">Loading your dashboard</h2>
          <p className="mt-3 text-slate-600">Preparing your business insights...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Something went wrong</h1>
          <p className="text-slate-600 mb-8 text-lg">{error}</p>
          <div className="space-y-4">
            <button
              onClick={fetchDailyTakings}
              className="w-full bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setError(null)
                setActiveTab('accounts')
              }}
              className="w-full bg-slate-200 text-slate-700 px-8 py-4 rounded-2xl hover:bg-slate-300 transition-all duration-300 font-semibold text-lg"
            >
              Manage Accounts
            </button>
          </div>
        </div>
      </div>
    )
  }

  // No account state
  if (!activeAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Welcome to Loyverse</h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed">Connect your first store to start tracking daily takings and gain valuable business insights</p>
          <button
            onClick={() => setActiveTab('accounts')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:-translate-y-2"
          >
            Connect Your Store
          </button>
          <p className="text-sm text-slate-500 mt-6">
            You'll need your Loyverse API token and store ID
          </p>
        </div>
      </div>
    )
  }

  // Accounts management view
  if (activeTab === 'accounts') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold mb-6 group transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Store Management</h1>
            <p className="text-xl text-slate-600">Connect and manage your Loyverse store integrations</p>
          </div>
          
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white bg-opacity-80 backdrop-blur-xl border-r border-slate-200 border-opacity-50 transform transition-all duration-500 ease-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-8 py-10 border-b border-slate-200 border-opacity-50">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <span className="text-white text-2xl font-bold">L</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Loyverse</h1>
              <p className="text-slate-500 font-medium">Business Intelligence</p>
            </div>
          </div>

          {/* Account Switcher */}
          <div className="px-8 py-6 border-b border-slate-200 border-opacity-50">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Active Store
            </label>
            <div className="space-y-3">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => switchAccount(account)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 ${
                    account.isActive
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-900 shadow-lg'
                      : 'hover:bg-slate-50 hover:shadow-md transform hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        account.isActive ? 'bg-blue-500 shadow-lg' : 'bg-slate-300'
                      }`} />
                      <span className="font-semibold truncate">{account.name}</span>
                    </div>
                    {account.isActive && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setActiveTab('accounts')}
              className="w-full mt-4 p-4 text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300 font-semibold text-sm border-2 border-dashed border-blue-200 hover:border-blue-300 hover:shadow-md"
            >
              + Add New Store
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-8 py-6">
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="w-full flex items-center px-4 py-3 text-sm font-semibold text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab('accounts')}
                className="w-full flex items-center px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Store Settings
              </button>
            </div>
          </nav>

          {/* Account Info */}
          <div className="px-8 py-6 border-t border-slate-200 border-opacity-50">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-4 border border-slate-200 border-opacity-50">
              <div className="text-sm">
                <p className="text-slate-900 font-semibold mb-1">{activeAccount.name}</p>
                <p className="text-slate-500">ID: {activeAccount.storeId.substring(0, 8)}...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-80">
        {/* Top Bar */}
        <div className="bg-white bg-opacity-80 backdrop-blur-xl shadow-sm border-b border-slate-200 border-opacity-50">
          <div className="flex items-center justify-between px-6 lg:px-8 py-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">Last updated</p>
                <p className="text-lg font-bold text-slate-900">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <main className="px-6 lg:px-8 py-10">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Business Dashboard</h1>
            <p className="text-xl text-slate-600">Daily takings overview for {activeAccount.name}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 border-opacity-50 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-6">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-4xl font-bold text-slate-900">{formatCurrency(totalTakings)}</p>
                  {activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && dailyTakings.length > 0 && (
                    <p className="text-sm text-slate-500 mt-2">Combined from all locations</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 border-opacity-50 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-6">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Daily Average</p>
                  <p className="text-4xl font-bold text-slate-900">{formatCurrency(averageTakings)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 border-opacity-50 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-6">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Days Tracked</p>
                  <p className="text-4xl font-bold text-slate-900">{dailyTakings.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Breakdown for Multi-Store Accounts */}
          {activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && dailyTakings.length > 0 && (
            <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 border-opacity-50 p-8 mb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Location Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 border border-blue-200 border-opacity-50">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">Shop Location</h3>
                  <p className="text-5xl font-bold text-blue-600 mb-3">
                    {formatCurrency(dailyTakings.reduce((sum, day) => {
                      const shopId = 'd5a7267b-ca6f-4490-9d66-b5ba46cc563c'
                      return sum + (day.locationBreakdown?.[shopId] || 0)
                    }, 0))}
                  </p>
                  <p className="text-blue-700 font-medium">Total revenue from Shop</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-3xl p-8 border border-emerald-200 border-opacity-50">
                  <h3 className="text-xl font-bold text-emerald-900 mb-4">Cafe Location</h3>
                  <p className="text-5xl font-bold text-emerald-600 mb-3">
                    {formatCurrency(dailyTakings.reduce((sum, day) => {
                      const cafeId = 'e2aa143e-3e91-433e-a6d8-5a5538d429e2'
                      return sum + (day.locationBreakdown?.[cafeId] || 0)
                    }, 0))}
                  </p>
                  <p className="text-emerald-700 font-medium">Total revenue from Cafe</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 border-opacity-50 p-8 mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Revenue Trends</h2>
            <DailyTakingsChart data={dailyTakings} />
          </div>

          {/* Table */}
          <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 border-opacity-50 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 border-opacity-50 bg-gradient-to-r from-slate-50 to-blue-50">
              <h2 className="text-2xl font-bold text-slate-900">Daily Breakdown</h2>
              <p className="text-slate-600 mt-1">Detailed view of your daily performance</p>
            </div>
            <DailyTakingsTable data={dailyTakings} />
          </div>
        </main>
      </div>
    </div>
  )
}
