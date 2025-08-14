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
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<LoyverseAccount | null>(null)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Loyverse Accounts</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Account
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingAccount ? 'Edit Account' : 'Add New Account'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Main Store, Online Shop"
                required
              />
            </div>
            
            <div>
              <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <input
                type="password"
                id="apiToken"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your Loyverse API token"
                required
              />
            </div>
            
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-gray-700 mb-1">
                Store ID
              </label>
              <input
                type="text"
                id="storeId"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your Loyverse store ID"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingAccount ? 'Update Account' : 'Add Account'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Accounts</h3>
        </div>
        
        {accounts.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <p>No accounts configured yet. Add your first Loyverse account to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <div key={account.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{account.name}</h4>
                      <p className="text-sm text-gray-500">
                        Store ID: {account.storeId.substring(0, 8)}...
                      </p>
                      <p className="text-sm text-gray-500">
                        API Token: {account.apiToken.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!account.isActive && (
                      <button
                        onClick={() => onSwitchAccount(account)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                    
                    {account.isActive && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Active
                      </span>
                    )}
                    
                    <button
                      onClick={() => handleEdit(account)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                    >
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
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Add an Account</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Go to the <a href="https://developer.loyverse.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Loyverse Developer Portal</a></li>
          <li>Create a new app or use an existing one</li>
          <li>Generate an API token</li>
          <li>Find your store ID from the API</li>
          <li>Add the account details above</li>
        </ol>
      </div>
    </div>
  )
}
