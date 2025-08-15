'use client'

import React from 'react'
import { DailyTaking, LoyverseAccount } from '../types'

// Account-specific filter state interface
interface AccountFilterState {
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  visibleColumns: {
    date: boolean
    shop: boolean
    cafe: boolean
    combined: boolean
    receipts: boolean
    average: boolean
    status: boolean
    cash: boolean
    card: boolean
  }
  dateFilter: { from: string; to: string }
  amountFilter: { min: string; max: string }
  showFilters: boolean
  showColumnManager: boolean
  recordsToShow: number
}

interface EnhancedPerformanceTableProps {
  dailyTakings: DailyTaking[]
  activeAccount: LoyverseAccount | null
  formatCurrency: (value: number) => string
  onDayClick: (dayData: DailyTaking) => void
}

export default function EnhancedPerformanceTable({ 
  dailyTakings, 
  activeAccount, 
  formatCurrency, 
  onDayClick
}: EnhancedPerformanceTableProps) {
  
  // Initialize filter state
  const [filterState, setFilterState] = React.useState<AccountFilterState>({
    sortColumn: 'date',
    sortDirection: 'desc',
    visibleColumns: {
      date: true,
      shop: activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2',
      cafe: activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2',
      combined: true,
      receipts: true,
      average: true,
      status: false,
      cash: true,
      card: true
    },
    dateFilter: { from: '', to: '' },
    amountFilter: { min: '', max: '' },
    showFilters: false,
    showColumnManager: false,
    recordsToShow: 30
  })

  const {
    sortColumn,
    sortDirection,
    visibleColumns,
    dateFilter,
    amountFilter,
    showFilters,
    showColumnManager,
    recordsToShow
  } = filterState

  // Generate complete date range including days with no sales
  const generateCompleteDataset = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - recordsToShow)
    
    const completeData = []
    const dataMap = new Map(dailyTakings.map(item => [item.date, item]))
    
    for (let i = 0; i < recordsToShow; i++) {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() - i)
      const dateString = currentDate.toISOString().split('T')[0]
      
      const existingData = dataMap.get(dateString)
      if (existingData) {
        completeData.push(existingData)
      } else {
        // Create empty day record
        completeData.push({
          date: dateString,
          total: 0,
          receiptCount: 0,
          averageReceipt: 0,
          locationBreakdown: {},
          paymentBreakdown: { cash: 0, card: 0 }
        })
      }
    }
    
    return completeData
  }

  const handleSort = (column: string) => {
    const newSortDirection = sortColumn === column && sortDirection === 'desc' ? 'asc' : 'desc'
    
    setFilterState(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: newSortDirection
    }))
  }

  // Helper functions for location-specific amounts
  const getShopAmount = (dayData: DailyTaking) => {
    if (!dayData.locationBreakdown) return 0
    return dayData.locationBreakdown['d5a7267b-ca6f-4490-9d66-b5ba46cc563c'] || 0
  }

  const getCafeAmount = (dayData: DailyTaking) => {
    if (!dayData.locationBreakdown) return 0
    return dayData.locationBreakdown['e2aa143e-3e91-433e-a6d8-5a5538d429e2'] || 0
  }

  const getCombinedAmount = (dayData: DailyTaking) => {
    return dayData.total || 0
  }

  const processedData = () => {
    let data = generateCompleteDataset()
    
    // Apply filters
    if (dateFilter.from) {
      data = data.filter(item => item.date >= dateFilter.from)
    }
    if (dateFilter.to) {
      data = data.filter(item => item.date <= dateFilter.to)
    }
    
    // Apply amount filters
    if (amountFilter.min) {
      const minAmount = parseFloat(amountFilter.min)
      data = data.filter(item => item.total >= minAmount)
    }
    if (amountFilter.max) {
      const maxAmount = parseFloat(amountFilter.max)
      data = data.filter(item => item.total <= maxAmount)
    }
    
    // Apply sorting
    if (sortColumn) {
      data.sort((a, b) => {
        let aVal: number = 0
        let bVal: number = 0
        
        if (sortColumn === 'date') {
          aVal = new Date(a.date).getTime()
          bVal = new Date(b.date).getTime()
        } else if (sortColumn === 'shop') {
          aVal = getShopAmount(a)
          bVal = getShopAmount(b)
        } else if (sortColumn === 'cafe') {
          aVal = getCafeAmount(a)
          bVal = getCafeAmount(b)
        } else if (sortColumn === 'combined') {
          aVal = getCombinedAmount(a)
          bVal = getCombinedAmount(b)
        } else if (sortColumn === 'receipts') {
          aVal = a.receiptCount || 0
          bVal = b.receiptCount || 0
        } else if (sortColumn === 'average') {
          aVal = a.averageReceipt || 0
          bVal = b.averageReceipt || 0
        } else if (sortColumn === 'cash') {
          aVal = a.paymentBreakdown?.cash || 0
          bVal = b.paymentBreakdown?.cash || 0
        } else if (sortColumn === 'card') {
          aVal = a.paymentBreakdown?.card || 0
          bVal = b.paymentBreakdown?.card || 0
        }
        
        if (sortDirection === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
      })
    }
    
    return data
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      })
    }
  }

  const getRowStatus = (dayData: DailyTaking) => {
    const total = dayData.total || 0
    if (total === 0) return { text: 'No Sales', color: '#6b7280', bg: '#f9fafb' }
    if (total < 100) return { text: 'Low', color: '#dc2626', bg: '#fef2f2' }
    if (total < 500) return { text: 'Medium', color: '#d97706', bg: '#fffbeb' }
    return { text: 'High', color: '#059669', bg: '#ecfdf5' }
  }

  const data = processedData()

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0 0 4px 0'
          }}>
            Daily Sales
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0
          }}>
            {data.length} days • Showing last {recordsToShow} days
          </p>
        </div>

        {/* Table Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            style={{
              background: showFilters ? '#3b82f6' : '#f1f5f9',
              color: showFilters ? 'white' : '#475569',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🔍 Filters
          </button>

          <button
            onClick={() => setFilterState(prev => ({ ...prev, showColumnManager: !prev.showColumnManager }))}
            style={{
              background: showColumnManager ? '#3b82f6' : '#f1f5f9',
              color: showColumnManager ? 'white' : '#475569',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⚙️ Columns
          </button>

          <select
            value={recordsToShow}
            onChange={(e) => setFilterState(prev => ({ ...prev, recordsToShow: parseInt(e.target.value) }))}
            style={{
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#fafbfc'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>
                From Date
              </label>
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setFilterState(prev => ({
                  ...prev,
                  dateFilter: { ...prev.dateFilter, from: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>
                To Date
              </label>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setFilterState(prev => ({
                  ...prev,
                  dateFilter: { ...prev.dateFilter, to: e.target.value }
                }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>
                Min Amount (£)
              </label>
              <input
                type="number"
                value={amountFilter.min}
                onChange={(e) => setFilterState(prev => ({
                  ...prev,
                  amountFilter: { ...prev.amountFilter, min: e.target.value }
                }))}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>
                Max Amount (£)
              </label>
              <input
                type="number"
                value={amountFilter.max}
                onChange={(e) => setFilterState(prev => ({
                  ...prev,
                  amountFilter: { ...prev.amountFilter, max: e.target.value }
                }))}
                placeholder="1000.00"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => setFilterState(prev => ({
              ...prev,
              dateFilter: { from: '', to: '' },
              amountFilter: { min: '', max: '' }
            }))}
            style={{
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Column Manager */}
      {showColumnManager && (
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#fafbfc'
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
            Visible Columns
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px'
          }}>
            {Object.entries(visibleColumns).map(([key, value]) => (
              <label key={key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#374151',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setFilterState(prev => ({
                    ...prev,
                    visibleColumns: {
                      ...prev.visibleColumns,
                      [key]: e.target.checked
                    }
                  }))}
                  style={{ cursor: 'pointer' }}
                />
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {visibleColumns.date && (
                <th
                  onClick={() => handleSort('date')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0',
                    position: 'sticky',
                    left: 0,
                    background: '#f8fafc',
                    zIndex: 1
                  }}
                >
                  Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              )}
              
              {visibleColumns.shop && activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && (
                <th
                  onClick={() => handleSort('shop')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  Shop {sortColumn === 'shop' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              )}

              {visibleColumns.cafe && activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && (
                <th
                  onClick={() => handleSort('cafe')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  Cafe {sortColumn === 'cafe' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              )}

              {visibleColumns.combined && (
                <th
                  onClick={() => handleSort('combined')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  Total {sortColumn === 'combined' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              )}

              {visibleColumns.cash && (
                <th
                  onClick={() => handleSort('cash')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  Cash {sortColumn === 'cash' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              )}

              {visibleColumns.card && (
                <th
                  onClick={() => handleSort('card')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  Card {sortColumn === 'card' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              )}

              {visibleColumns.receipts && (
                <th
                  onClick={() => handleSort('receipts')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  Receipts {sortColumn === 'receipts' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              )}

              {visibleColumns.average && (
                <th
                  onClick={() => handleSort('average')}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  Avg Receipt {sortColumn === 'average' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              )}

              {visibleColumns.status && (
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  Status
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((dayData, index) => {
              const status = getRowStatus(dayData)
              const isEvenRow = index % 2 === 0
              
              return (
                <tr 
                  key={dayData.date}
                  onClick={() => onDayClick(dayData)}
                  style={{
                    backgroundColor: isEvenRow ? '#ffffff' : '#f9fafb',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f9ff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isEvenRow ? '#ffffff' : '#f9fafb'
                  }}
                >
                  {visibleColumns.date && (
                    <td style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#1e293b',
                      fontWeight: '500',
                      position: 'sticky',
                      left: 0,
                      background: 'inherit',
                      zIndex: 1
                    }}>
                      {formatDate(dayData.date)}
                    </td>
                  )}

                  {visibleColumns.shop && activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '14px',
                      color: '#059669',
                      fontWeight: '600'
                    }}>
                      {formatCurrency(getShopAmount(dayData))}
                    </td>
                  )}

                  {visibleColumns.cafe && activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '14px',
                      color: '#059669',
                      fontWeight: '600'
                    }}>
                      {formatCurrency(getCafeAmount(dayData))}
                    </td>
                  )}

                  {visibleColumns.combined && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '14px',
                      color: '#059669',
                      fontWeight: '700'
                    }}>
                      {formatCurrency(getCombinedAmount(dayData))}
                    </td>
                  )}

                  {visibleColumns.cash && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '14px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {formatCurrency(dayData.paymentBreakdown?.cash || 0)}
                    </td>
                  )}

                  {visibleColumns.card && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '14px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {formatCurrency(dayData.paymentBreakdown?.card || 0)}
                    </td>
                  )}

                  {visibleColumns.receipts && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      {dayData.receiptCount || 0}
                    </td>
                  )}

                  {visibleColumns.average && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      {formatCurrency(dayData.averageReceipt || 0)}
                    </td>
                  )}

                  {visibleColumns.status && (
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        background: status.bg,
                        color: status.color,
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {status.text}
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* No Data Message */}
      {data.length === 0 && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>No data found</div>
          <div style={{ fontSize: '14px' }}>Try adjusting your filters or date range</div>
        </div>
      )}
    </div>
  )
}
