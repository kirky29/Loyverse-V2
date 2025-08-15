'use client'

import { DailyTaking, LoyverseAccount } from '../types'

interface DayDetailViewProps {
  dayData: DailyTaking
  activeAccount: LoyverseAccount | null
  formatCurrency: (amount: number) => string
  onBack: () => void
}

export default function DayDetailView({ 
  dayData, 
  activeAccount, 
  formatCurrency, 
  onBack 
}: DayDetailViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isToday = new Date(dayData.date).toDateString() === new Date().toDateString()
  const isYesterday = new Date(dayData.date).toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

  // Get location names for the breakdown
  const getLocationName = (locationId: string) => {
    if (activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2') {
      if (locationId === 'd5a7267b-ca6f-4490-9d66-b5ba46cc563c') return 'Shop'
      if (locationId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2') return 'Cafe'
    }
    return `Location ${locationId.slice(0, 8)}...`
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: 'white'
      }}>
        <div>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '12px',
              fontSize: '14px'
            }}
          >
            ← Back to Dashboard
          </button>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold' }}>
            {formatDate(dayData.date)}
          </h1>
          {isToday && (
            <span style={{
              background: '#2196f3',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              TODAY
            </span>
          )}
          {isYesterday && (
            <span style={{
              background: '#4caf50',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              YESTERDAY
            </span>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
            {formatCurrency(dayData.total)}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Total Sales
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        
        {/* Receipt Stats */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e1e5e9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>🧾</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Receipt Information</h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            {dayData.receiptCount || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            Total Receipts
          </div>
          <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Average Receipt</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#333' }}>
              {formatCurrency(dayData.averageReceipt || 0)}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e1e5e9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>💳</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Payment Methods</h3>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px' }}>💵</span>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>Cash</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                {formatCurrency(dayData.paymentBreakdown?.cash || 0)}
              </span>
            </div>
            <div style={{ 
              height: '8px', 
              background: '#e1e5e9', 
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{
                height: '100%',
                width: dayData.total > 0 ? `${((dayData.paymentBreakdown?.cash || 0) / dayData.total) * 100}%` : '0%',
                background: '#4caf50',
                borderRadius: '4px'
              }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px' }}>💳</span>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>Card</span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                {formatCurrency(dayData.paymentBreakdown?.card || 0)}
              </span>
            </div>
            <div style={{ 
              height: '8px', 
              background: '#e1e5e9', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: dayData.total > 0 ? `${((dayData.paymentBreakdown?.card || 0) / dayData.total) * 100}%` : '0%',
                background: '#2196f3',
                borderRadius: '4px'
              }} />
            </div>
          </div>

          {(dayData.paymentBreakdown?.cash || 0) + (dayData.paymentBreakdown?.card || 0) !== dayData.total && (
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              background: '#fff3cd', 
              borderRadius: '6px',
              fontSize: '12px',
              color: '#856404'
            }}>
              ⚠️ Payment breakdown may not include all payment methods
            </div>
          )}
        </div>

        {/* Location Breakdown */}
        {dayData.locationBreakdown && Object.keys(dayData.locationBreakdown).length > 0 && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px', marginRight: '12px' }}>📍</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Location Breakdown</h3>
            </div>
            
            {Object.entries(dayData.locationBreakdown).map(([locationId, amount], index) => (
              <div key={locationId} style={{ marginBottom: index < Object.keys(dayData.locationBreakdown!).length - 1 ? '16px' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>
                    {getLocationName(locationId)}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div style={{ 
                  height: '8px', 
                  background: '#e1e5e9', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: dayData.total > 0 ? `${(amount / dayData.total) * 100}%` : '0%',
                    background: index === 0 ? '#ff9800' : '#9c27b0',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Breakdown */}
      {(dayData as any).itemBreakdown && (dayData as any).itemBreakdown.length > 0 && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e1e5e9',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>🛍️</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Items Sold</h3>
          </div>
          
          {/* Category Summary */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>Categories</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {(() => {
                const categories = (dayData as any).itemBreakdown.reduce((acc: any, item: any) => {
                  const category = item.category || 'Other'
                  acc[category] = (acc[category] || 0) + item.total_sales
                  return acc
                }, {})
                
                const categoryColors = {
                  'Beverages': '#3b82f6',
                  'Food': '#10b981', 
                  'Pastries': '#f59e0b',
                  'Gifts': '#8b5cf6',
                  'Other': '#64748b'
                }
                
                return Object.entries(categories).map(([category, total]: [string, any]) => (
                  <div key={category} style={{ 
                    padding: '10px', 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                    borderRadius: '8px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#475569', 
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {category}
                    </div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: categoryColors[category as keyof typeof categoryColors] || '#64748b'
                    }}>
                      {formatCurrency(total)}
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* All Items - Grid Layout */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>All Items Sold ({(dayData as any).itemBreakdown.length} items)</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '12px',
              maxHeight: 'none'
            }}>
              {(dayData as any).itemBreakdown.map((item: any, index: number) => (
                <div key={`${item.item_name}_${item.variant_name || 'default'}`} style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Ranking badge */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: index < 3 ? '#fbbf24' : '#64748b',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    #{index + 1}
                  </div>
                  
                  <div style={{ marginRight: '30px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      {item.item_name}
                      {item.variant_name && (
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px', fontWeight: '400' }}>
                          ({item.variant_name})
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                        {formatCurrency(item.total_sales)}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                      <span>Qty: {item.quantity}</span>
                      <span>Avg: {formatCurrency(item.average_price)}</span>
                      <span style={{ fontWeight: '600', color: '#059669' }}>
                        {((item.total_sales / dayData.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Additional Details */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e1e5e9'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '12px' }}>📊</span>
          Sales Summary
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
              {formatCurrency(dayData.total)}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Sales</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
              {dayData.receiptCount || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Receipts</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
              {formatCurrency(dayData.averageReceipt || 0)}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Average Receipt</div>
          </div>
          
          {dayData.paymentBreakdown && (
            <>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50', marginBottom: '4px' }}>
                  {formatCurrency(dayData.paymentBreakdown.cash || 0)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Cash Payments</div>
              </div>
              
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3', marginBottom: '4px' }}>
                  {formatCurrency(dayData.paymentBreakdown.card || 0)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Card Payments</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
