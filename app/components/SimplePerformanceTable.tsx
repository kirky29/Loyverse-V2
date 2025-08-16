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

  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>📊 Daily Sales Analytics</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              {data.length} days displayed • {data.filter(d => d.total > 0).length} days with sales • {formatCurrency(data.reduce((s, d) => s + d.total, 0))} total
            </p>
          </div>
          <button 
            onClick={() => setFilterState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            style={{ background: '#111827', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {filterState.showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Simple Filters */}
        {filterState.showFilters && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>From Date</label>
                <input 
                  type="date" 
                  value={filterState.dateFilter.from} 
                  onChange={(e) => setFilterState(prev => ({ ...prev, dateFilter: { ...prev.dateFilter, from: e.target.value } }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>To Date</label>
                <input 
                  type="date" 
                  value={filterState.dateFilter.to} 
                  onChange={(e) => setFilterState(prev => ({ ...prev, dateFilter: { ...prev.dateFilter, to: e.target.value } }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Min Amount</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={filterState.amountFilter.min} 
                  onChange={(e) => setFilterState(prev => ({ ...prev, amountFilter: { ...prev.amountFilter, min: e.target.value } }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Max Amount</label>
                <input 
                  type="number" 
                  placeholder="1000.00"
                  value={filterState.amountFilter.max} 
                  onChange={(e) => setFilterState(prev => ({ ...prev, amountFilter: { ...prev.amountFilter, max: e.target.value } }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Search</label>
                <input 
                  type="text" 
                  placeholder="Search dates, amounts..."
                  value={filterState.textFilter} 
                  onChange={(e) => setFilterState(prev => ({ ...prev, textFilter: e.target.value }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th 
                onClick={() => handleSort('date')} 
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #e2e8f0' 
                }}
              >
                Date {filterState.sortColumn === 'date' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('total')} 
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'right', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #e2e8f0' 
                }}
              >
                Total {filterState.sortColumn === 'total' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('receipts')} 
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'right', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #e2e8f0' 
                }}
              >
                Receipts {filterState.sortColumn === 'receipts' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('average')} 
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'right', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: '#6b7280', 
                  textTransform: 'uppercase', 
                  cursor: 'pointer', 
                  borderBottom: '1px solid #e2e8f0' 
                }}
              >
                Avg Receipt {filterState.sortColumn === 'average' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                Cash
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
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
                    cursor: 'pointer' 
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f9ff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = even ? '#ffffff' : '#f9fafb' }}
                >
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                    {formatDate(day.date)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#059669', fontWeight: 700 }}>
                    {formatCurrency(day.total)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#6b7280' }}>
                    {day.receiptCount || 0}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#6b7280' }}>
                    {formatCurrency(day.averageReceipt || 0)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                    {formatCurrency(day.paymentBreakdown?.cash || 0)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
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
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>No data found</div>
          <div style={{ fontSize: '14px' }}>Try adjusting your filters or date range</div>
        </div>
      )}
    </div>
  )
}
