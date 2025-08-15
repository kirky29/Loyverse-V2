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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '40px',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        color: 'white'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              margin: '0 0 8px 0' 
            }}>
              ⚙️ Store Connections
            </h1>
            <p style={{ 
              fontSize: '16px', 
              opacity: 0.9, 
              margin: 0 
            }}>
              Connect and manage your Loyverse store integrations
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            Connect New Store
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e1e5e9'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#333',
              margin: 0
            }}>
              {editingAccount ? '✏️ Update Store Connection' : '🔗 Connect New Store'}
            </h3>
            <button
              onClick={handleCancel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f5f5'
                e.currentTarget.style.color = '#333'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = '#666'
              }}
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '24px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#333',
                  marginBottom: '8px'
                }}>
                  🏪 Store Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s ease'
                  }}
                  placeholder="e.g., Main Store, Coffee Shop"
                  required
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#333',
                  marginBottom: '8px'
                }}>
                  🏢 Store ID
                </label>
                <input
                  type="text"
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s ease'
                  }}
                  placeholder="Store ID from Loyverse"
                  required
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#333',
                marginBottom: '8px'
              }}>
                🔑 API Token
              </label>
              <input
                type="password"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s ease'
                }}
                placeholder="Your Loyverse API token"
                required
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: '#f8f9fa',
                  color: '#666',
                  border: '2px solid #e1e5e9',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e9ecef'
                  e.currentTarget.style.borderColor = '#ced4da'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8f9fa'
                  e.currentTarget.style.borderColor = '#e1e5e9'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {editingAccount ? 'Update Connection' : 'Connect Store'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Stores */}
      {accounts.length > 0 ? (
        <div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#333',
            marginBottom: '24px'
          }}>
            🏪 Connected Stores ({accounts.length})
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '20px'
          }}>
            {accounts.map((account) => (
              <div
                key={account.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: account.isActive ? '2px solid #4caf50' : '2px solid #e1e5e9',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!account.isActive) {
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!account.isActive) {
                    e.currentTarget.style.borderColor = '#e1e5e9'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '-1px',
                  right: '-1px',
                  background: account.isActive ? '#4caf50' : '#e1e5e9',
                  color: account.isActive ? 'white' : '#666',
                  padding: '4px 12px',
                  borderRadius: '0 10px 0 10px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {account.isActive ? '✓ ACTIVE' : 'READY'}
                </div>

                {/* Store Info */}
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: '#333',
                    margin: '0 0 8px 0'
                  }}>
                    {account.name}
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#666',
                    margin: 0
                  }}>
                    Store ID: {account.storeId.slice(0, 16)}...
                  </p>
                </div>

                {/* Actions */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {!account.isActive && (
                    <button
                      onClick={() => onSwitchAccount(account)}
                      style={{
                        background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      ✓ Activate
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEdit(account)}
                    style={{
                      background: '#f8f9fa',
                      color: '#666',
                      border: '1px solid #e1e5e9',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e9ecef'
                      e.currentTarget.style.borderColor = '#ced4da'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8f9fa'
                      e.currentTarget.style.borderColor = '#e1e5e9'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${account.name}"?`)) {
                        onDeleteAccount(account.id)
                      }
                    }}
                    style={{
                      background: '#fff5f5',
                      color: '#dc3545',
                      border: '1px solid #f5c6cb',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8d7da'
                      e.currentTarget.style.borderColor = '#f1aeb5'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff5f5'
                      e.currentTarget.style.borderColor = '#f5c6cb'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* No Stores State */
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔗</div>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#333',
            marginBottom: '12px'
          }}>
            No Store Connections
          </h3>
          <p style={{ 
            fontSize: '16px', 
            color: '#666',
            marginBottom: '24px'
          }}>
            Connect your first Loyverse store to get started
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            + Connect Your First Store
          </button>
        </div>
      )}
    </div>
  )
}