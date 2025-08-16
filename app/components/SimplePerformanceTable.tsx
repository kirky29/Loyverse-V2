'use client'

import React from 'react'
import { DailyTaking, LoyverseAccount } from '../types'

// Basic interface for filter state
interface FilterState {
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  dateFilter: { from: string; to: string; preset: string }
  amountFilter: { min: string; max: string }
  textFilter: string
  showFilters: boolean
}

interface SimplePerformanceTableProps {
  dailyTakings: DailyTaking[]
  activeAccount: LoyverseAccount | null
  formatCurrency: (value: number) => string
  onDayClick: (dayData: DailyTaking) => void
  onLoadHistoricalData?: () => void
}

export default function SimplePerformanceTable({ 
  dailyTakings, 
  activeAccount, 
  formatCurrency, 
  onDayClick,
  onLoadHistoricalData
}: SimplePerformanceTableProps) {
  const [filterState, setFilterState] = React.useState<FilterState>(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 29)
    
    return {
      sortColumn: 'date',
      sortDirection: 'desc',
      dateFilter: { 
        from: thirtyDaysAgo.toISOString().split('T')[0], 
        to: today.toISOString().split('T')[0], 
        preset: 'last30days' 
      },
      amountFilter: { min: '', max: '' },
      textFilter: '',
      showFilters: false
    }
  })

  const handleSort = (column: string) => {
    const newDirection = filterState.sortColumn === column && filterState.sortDirection === 'desc' ? 'asc' : 'desc'
    setFilterState(prev => ({ ...prev, sortColumn: column, sortDirection: newDirection }))
  }

  const processedData = () => {
    let data = dailyTakings

    // Apply filters
    if (filterState.dateFilter.from) {
      data = data.filter(item => item.date >= filterState.dateFilter.from)
    }
    if (filterState.dateFilter.to) {
      data = data.filter(item => item.date <= filterState.dateFilter.to)
    }
    if (filterState.amountFilter.min) {
      data = data.filter(item => item.total >= parseFloat(filterState.amountFilter.min))
    }
    if (filterState.amountFilter.max) {
      data = data.filter(item => item.total <= parseFloat(filterState.amountFilter.max))
    }
    if (filterState.textFilter.trim()) {
      const query = filterState.textFilter.toLowerCase().trim()
      data = data.filter(item => {
        const dateStr = new Date(item.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toLowerCase()
        return dateStr.includes(query) || formatCurrency(item.total).toLowerCase().includes(query)
      })
    }

    // Sort
    data.sort((a, b) => {
      const asc = filterState.sortDirection === 'asc' ? 1 : -1
      switch (filterState.sortColumn) {
        case 'date': return asc * (new Date(a.date).getTime() - new Date(b.date).getTime())
        case 'total': return asc * (a.total - b.total)
        case 'receipts': return asc * ((a.receiptCount || 0) - (b.receiptCount || 0))
        case 'average': return asc * ((a.averageReceipt || 0) - (b.averageReceipt || 0))
        default: return 0
      }
    })
    
    return data
  }

  const data = processedData()
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  // Calculate active filter count
  const activeFilters = [
    filterState.dateFilter.from !== '' ? 1 : 0,
    filterState.dateFilter.to !== '' ? 1 : 0,
    filterState.amountFilter.min !== '' ? 1 : 0,
    filterState.amountFilter.max !== '' ? 1 : 0,
    filterState.textFilter.trim() !== '' ? 1 : 0
  ].reduce((sum, count) => sum + count, 0)

  const resetFilters = () => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 29)
    
    setFilterState(prev => ({
      ...prev,
      dateFilter: { 
        from: thirtyDaysAgo.toISOString().split('T')[0], 
        to: today.toISOString().split('T')[0], 
        preset: 'last30days' 
      },
      amountFilter: { min: '', max: '' },
      textFilter: ''
    }))
  }

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '16px', 
      overflow: 'hidden', 
      border: '1px solid #e5e7eb', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
    }}>
      {/* Header Section */}
      <div style={{ 
        padding: '32px 32px 24px 32px', 
        borderBottom: '1px solid #f1f5f9', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'space-between', 
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Left side - Title and stats */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 700, 
              color: '#0f172a', 
              margin: '0 0 12px 0',
              lineHeight: '1.2'
            }}>
              📊 Sales Analytics
            </h2>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              flexWrap: 'wrap',
              fontSize: '15px',
              color: '#64748b'
            }}>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                background: '#f1f5f9',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 500
              }}>
                📅 {data.length} days
              </span>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                background: '#f1f5f9',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 500
              }}>
                💰 {formatCurrency(data.reduce((s, d) => s + d.total, 0))}
              </span>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                background: '#f1f5f9',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 500
              }}>
                📈 {data.filter(d => d.total > 0).length} active days
              </span>
            </div>
          </div>

          {/* Right side - Actions */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flexShrink: 0
          }}>
            {/* Filter toggle button */}
            <button 
              onClick={() => setFilterState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: filterState.showFilters ? '#3b82f6' : '#ffffff', 
                color: filterState.showFilters ? '#ffffff' : '#374151', 
                border: filterState.showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db', 
                padding: '12px 20px', 
                borderRadius: '12px', 
                fontSize: '14px', 
                fontWeight: 600, 
                cursor: 'pointer',
                boxShadow: filterState.showFilters ? '0 4px 12px rgba(59, 130, 246, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              🔍 Filters
              {activeFilters > 0 && (
                <span style={{
                  background: filterState.showFilters ? '#ffffff' : '#ef4444',
                  color: filterState.showFilters ? '#3b82f6' : '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Reset button */}
            {activeFilters > 0 && (
              <button 
                onClick={resetFilters}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent', 
                  color: '#6b7280', 
                  border: '1px solid #d1d5db', 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ↻ Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {filterState.showFilters && (
        <div style={{ 
          padding: '32px', 
          borderBottom: '1px solid #f1f5f9',
          background: '#ffffff'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '24px',
            maxWidth: '1200px'
          }}>
            {/* Date Range Section */}
            <div style={{ 
              background: '#f8fafc', 
              padding: '24px', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: '#1e293b', 
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📅 Date Range
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    color: '#6b7280', 
                    marginBottom: '8px',
                    fontWeight: 500
                  }}>
                    From Date
                  </label>
                  <input 
                    type="date" 
                    value={filterState.dateFilter.from} 
                    onChange={(e) => setFilterState(prev => ({ 
                      ...prev, 
                      dateFilter: { ...prev.dateFilter, from: e.target.value } 
                    }))}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#ffffff',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    color: '#6b7280', 
                    marginBottom: '8px',
                    fontWeight: 500
                  }}>
                    To Date
                  </label>
                  <input 
                    type="date" 
                    value={filterState.dateFilter.to} 
                    onChange={(e) => setFilterState(prev => ({ 
                      ...prev, 
                      dateFilter: { ...prev.dateFilter, to: e.target.value } 
                    }))}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#ffffff',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>
            </div>

            {/* Amount Range Section */}
            <div style={{ 
              background: '#f8fafc', 
              padding: '24px', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: '#1e293b', 
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💰 Amount Range
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    color: '#6b7280', 
                    marginBottom: '8px',
                    fontWeight: 500
                  }}>
                    Minimum Amount (£)
                  </label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    step="0.01"
                    value={filterState.amountFilter.min} 
                    onChange={(e) => setFilterState(prev => ({ 
                      ...prev, 
                      amountFilter: { ...prev.amountFilter, min: e.target.value } 
                    }))}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#ffffff',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    color: '#6b7280', 
                    marginBottom: '8px',
                    fontWeight: 500
                  }}>
                    Maximum Amount (£)
                  </label>
                  <input 
                    type="number" 
                    placeholder="1000.00"
                    step="0.01"
                    value={filterState.amountFilter.max} 
                    onChange={(e) => setFilterState(prev => ({ 
                      ...prev, 
                      amountFilter: { ...prev.amountFilter, max: e.target.value } 
                    }))}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#ffffff',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div style={{ 
              background: '#f8fafc', 
              padding: '24px', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 600, 
                color: '#1e293b', 
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔍 Search
              </h3>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  color: '#6b7280', 
                  marginBottom: '8px',
                  fontWeight: 500
                }}>
                  Search dates, amounts, or any text
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    placeholder="e.g., Monday, £500, Dec 15..."
                    value={filterState.textFilter} 
                    onChange={(e) => setFilterState(prev => ({ ...prev, textFilter: e.target.value }))}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px 12px 48px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#ffffff',
                      color: '#374151',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af',
                    fontSize: '16px'
                  }}>
                    🔍
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFilters > 0 && (
            <div style={{ 
              marginTop: '24px', 
              padding: '16px 20px', 
              background: '#f0f9ff', 
              border: '1px solid #bae6fd', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontSize: '14px',
                color: '#0369a1',
                fontWeight: 500
              }}>
                <span>📊</span>
                <span>{activeFilters} active filter{activeFilters !== 1 ? 's' : ''}</span>
              </div>
              <button 
                onClick={resetFilters}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#dc2626', 
                  fontSize: '14px', 
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table Section */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th 
                onClick={() => handleSort('date')} 
                style={{ 
                  padding: '16px 24px', 
                  textAlign: 'left', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #e2e8f0',
                  letterSpacing: '0.5px'
                }}
              >
                Date {filterState.sortColumn === 'date' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('total')} 
                style={{ 
                  padding: '16px 24px', 
                  textAlign: 'right', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #e2e8f0',
                  letterSpacing: '0.5px'
                }}
              >
                Total {filterState.sortColumn === 'total' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('receipts')} 
                style={{ 
                  padding: '16px 24px', 
                  textAlign: 'right', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #e2e8f0',
                  letterSpacing: '0.5px'
                }}
              >
                Receipts {filterState.sortColumn === 'receipts' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('average')} 
                style={{ 
                  padding: '16px 24px', 
                  textAlign: 'right', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #e2e8f0',
                  letterSpacing: '0.5px'
                }}
              >
                Avg Receipt {filterState.sortColumn === 'average' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ 
                padding: '16px 24px', 
                textAlign: 'right', 
                fontSize: '13px', 
                fontWeight: 600, 
                color: '#6b7280', 
                textTransform: 'uppercase', 
                borderBottom: '1px solid #e2e8f0',
                letterSpacing: '0.5px'
              }}>
                Cash
              </th>
              <th style={{ 
                padding: '16px 24px', 
                textAlign: 'right', 
                fontSize: '13px', 
                fontWeight: 600, 
                color: '#6b7280', 
                textTransform: 'uppercase', 
                borderBottom: '1px solid #e2e8f0',
                letterSpacing: '0.5px'
              }}>
                Card
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((day, idx) => {
              const even = idx % 2 === 0
              return (
                <tr 
                  key={day.date} 
                  onClick={() => onDayClick(day)} 
                  style={{ 
                    backgroundColor: even ? '#ffffff' : '#f9fafb', 
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f9ff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = even ? '#ffffff' : '#f9fafb' }}
                >
                  <td style={{ 
                    padding: '16px 24px', 
                    fontSize: '15px', 
                    color: '#1e293b', 
                    fontWeight: 500,
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    {formatDate(day.date)}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    textAlign: 'right', 
                    fontSize: '15px', 
                    color: '#059669', 
                    fontWeight: 700,
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    {formatCurrency(day.total)}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    textAlign: 'right', 
                    fontSize: '15px', 
                    color: '#6b7280',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    {day.receiptCount || 0}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    textAlign: 'right', 
                    fontSize: '15px', 
                    color: '#6b7280',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    {formatCurrency(day.averageReceipt || 0)}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    textAlign: 'right', 
                    fontSize: '15px', 
                    color: '#6b7280', 
                    fontWeight: 500,
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    {formatCurrency(day.paymentBreakdown?.cash || 0)}
                  </td>
                  <td style={{ 
                    padding: '16px 24px', 
                    textAlign: 'right', 
                    fontSize: '15px', 
                    color: '#6b7280', 
                    fontWeight: 500,
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    {formatCurrency(day.paymentBreakdown?.card || 0)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div style={{ 
          padding: '80px 32px', 
          textAlign: 'center', 
          color: '#6b7280',
          background: '#f9fafb'
        }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 600,
            marginBottom: '12px',
            color: '#374151'
          }}>
            No data found
          </div>
          <div style={{ 
            fontSize: '15px',
            maxWidth: '400px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}>
            Try adjusting your filters or date range to see more results
          </div>
        </div>
      )}
    </div>
  )
}
