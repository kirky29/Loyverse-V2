'use client'

import { useState } from 'react'

interface LoyverseAccount {
  id: string
  name: string
  apiToken: string
  storeId: string
  isActive: boolean
}

interface AccountManagerProps {
  accounts: LoyverseAccount[]
  onAddAccount: (account: Omit<LoyverseAccount, 'id'>) => void
  onUpdateAccount: (id: string, updates: Partial<LoyverseAccount>) => void
  onDeleteAccount: (id: string) => void
  onSwitchAccount: (account: LoyverseAccount) => void
  activeAccount: LoyverseAccount | null
}

export default function AccountManager({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onSwitchAccount,
  activeAccount
}: AccountManagerProps) {
  const [editingAccount, setEditingAccount] = useState<LoyverseAccount | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    apiToken: '',
    storeId: '',
    isActive: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingAccount) {
      onUpdateAccount(editingAccount.id, formData)
      setEditingAccount(null)
    } else {
      onAddAccount(formData)
    }
    
    setFormData({ name: '', apiToken: '', storeId: '', isActive: false })
    setShowAddForm(false)
  }

  const handleEdit = (account: LoyverseAccount) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      apiToken: account.apiToken,
      storeId: account.storeId,
      isActive: account.isActive
    })
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingAccount(null)
    setFormData({ name: '', apiToken: '', storeId: '', isActive: false })
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Store Connections</h2>
          <p className="text-xl text-slate-600">Connect and manage your Loyverse store integrations</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
        >
          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Connect New Store
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 border-opacity-50 p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-slate-900">
              {editingAccount ? 'Update Store Connection' : 'Connect New Store'}
            </h3>
            <button
              onClick={handleCancel}
              className="p-3 text-slate-400 hover:text-slate-600 rounded-2xl hover:bg-slate-100 transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                  Store Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl transition-all duration-200 text-lg"
                  placeholder="e.g., Main Store, Online Shop"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="storeId" className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                  Store ID
                </label>
                <input
                  type="text"
                  id="storeId"
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl transition-all duration-200 text-lg"
                  placeholder="Your Loyverse store ID"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="apiToken" className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                API Token
              </label>
              <input
                type="password"
                id="apiToken"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl transition-all duration-200 text-lg"
                placeholder="Your Loyverse API token"
                required
              />
            </div>
            
            <div className="flex items-center justify-end space-x-6 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 text-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
              >
                {editingAccount ? 'Update Store' : 'Connect Store'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 border-opacity-50 overflow-hidden">
        <div className="px-8 py-8 border-b border-slate-200 border-opacity-50 bg-gradient-to-r from-slate-50 to-blue-50">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Your Store Connections</h3>
          <p className="text-slate-600 text-lg">Manage your connected Loyverse stores</p>
        </div>
        
        {accounts.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-slate-900 mb-3">No stores connected yet</h4>
            <p className="text-slate-600 mb-8 text-lg">Connect your first Loyverse store to start tracking your daily takings</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Connect Your First Store
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 divide-opacity-50">
            {accounts.map((account) => (
              <div key={account.id} className="px-8 py-8 hover:bg-slate-50 hover:bg-opacity-50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className={`w-4 h-4 rounded-full ${account.isActive ? 'bg-blue-500 shadow-lg' : 'bg-slate-300'}`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h4 className="text-xl font-bold text-slate-900">{account.name}</h4>
                        {account.isActive && (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Active
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span className="font-semibold">Store ID:</span> {account.storeId.substring(0, 8)}...
                        </div>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </div>
                          <span className="font-semibold">API Token:</span> {account.apiToken.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {!account.isActive && (
                      <button
                        onClick={() => onSwitchAccount(account)}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Activate
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEdit(account)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white text-sm font-bold rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-3xl p-10 border border-blue-200 border-opacity-50">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">How to Connect a Store</h3>
            <ol className="list-decimal list-inside space-y-3 text-blue-800 text-lg">
              <li>Go to the <a href="https://developer.loyverse.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 font-bold">Loyverse Developer Portal</a></li>
              <li>Create a new app or use an existing one</li>
              <li>Generate an API token</li>
              <li>Find your store ID from the API</li>
              <li>Add the store details above</li>
            </ol>
            <div className="mt-6 p-4 bg-blue-200 bg-opacity-50 rounded-2xl border border-blue-300 border-opacity-50">
              <p className="text-blue-800 font-semibold">
                🔒 <strong>Security Note:</strong> Keep your API tokens secure and never share them publicly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
