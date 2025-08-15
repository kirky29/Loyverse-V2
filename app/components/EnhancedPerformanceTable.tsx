'use client'

import React from 'react'
import { DailyTaking, LoyverseAccount } from '../types'

// Predefined date presets
const DATE_PRESETS = [
  { id: 'today', label: 'Today', days: 1 },
  { id: 'yesterday', label: 'Yesterday', days: 1, offset: 1 },
  { id: 'last3days', label: 'Last 3 days', days: 3 },
  { id: 'last7days', label: 'Last 7 days', days: 7 },
  { id: 'last14days', label: 'Last 14 days', days: 14 },
  { id: 'last30days', label: 'Last 30 days', days: 30 },
  { id: 'last60days', label: 'Last 60 days', days: 60 },
  { id: 'last90days', label: 'Last 90 days', days: 90 },
  { id: 'thisweek', label: 'This week', days: -1, type: 'week' },
  { id: 'lastweek', label: 'Last week', days: -1, type: 'lastweek' },
  { id: 'thismonth', label: 'This month', days: -1, type: 'month' },
  { id: 'lastmonth', label: 'Last month', days: -1, type: 'lastmonth' },
  { id: 'custom', label: 'Custom Range', days: -1, type: 'custom' }
]

// Column preset configurations
const COLUMN_PRESETS = {
  essential: {
    name: 'Essential',
    description: 'Key metrics only',
    columns: { date: true, combined: true, receipts: true, average: true, status: false, cash: false, card: false, shop: false, cafe: false }
  },
  financial: {
    name: 'Financial',
    description: 'Payment breakdown focus',
    columns: { date: true, combined: true, cash: true, card: true, receipts: true, average: false, status: false, shop: false, cafe: false }
  },
  detailed: {
    name: 'Detailed',
    description: 'All available columns',
    columns: { date: true, combined: true, cash: true, card: true, receipts: true, average: true, status: true, shop: true, cafe: true }
  },
  locations: {
    name: 'Locations',
    description: 'Location breakdown',
    columns: { date: true, shop: true, cafe: true, combined: true, receipts: false, average: false, status: false, cash: false, card: false }
  }
}

// Enhanced filter state interface
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
  dateFilter: { from: string; to: string; preset: string }
  amountFilter: { 
    min: string; 
    max: string; 
    receiptsMin: string; 
    receiptsMax: string;
    avgReceiptMin: string;
    avgReceiptMax: string;
  }
  textFilter: string
  showFilters: boolean
  showColumnManager: boolean
  showAdvancedFilters: boolean
  recordsToShow: number
  savedColumnPresets: { [key: string]: any }
  activeColumnPreset: string
}

interface EnhancedPerformanceTableProps {
  dailyTakings: DailyTaking[]
  activeAccount: LoyverseAccount | null
  formatCurrency: (value: number) => string
  onDayClick: (dayData: DailyTaking) => void
  onLoadHistoricalData?: () => void
}

export default function EnhancedPerformanceTable({ 
  dailyTakings, 
  activeAccount, 
  formatCurrency, 
  onDayClick,
  onLoadHistoricalData
}: EnhancedPerformanceTableProps) {
  
  // Initialize filter state with enhanced features
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
    dateFilter: { from: '', to: '', preset: 'last30days' },
    amountFilter: { 
      min: '', 
      max: '', 
      receiptsMin: '', 
      receiptsMax: '',
      avgReceiptMin: '',
      avgReceiptMax: ''
    },
    textFilter: '',
    showFilters: false,
    showColumnManager: false,
    showAdvancedFilters: false,
    recordsToShow: 30,
    savedColumnPresets: {},
    activeColumnPreset: 'essential'
  })

  // Utility functions for date handling
  const getDateFromPreset = (preset: string) => {
    const today = new Date()
    const result = { from: '', to: '' }
    
    switch (preset) {
      case 'today':
        result.from = result.to = today.toISOString().split('T')[0]
        break
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        result.from = result.to = yesterday.toISOString().split('T')[0]
        break
      case 'thisweek':
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        result.from = startOfWeek.toISOString().split('T')[0]
        result.to = today.toISOString().split('T')[0]
        break
      case 'lastweek':
        const lastWeekEnd = new Date(today)
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1)
        const lastWeekStart = new Date(lastWeekEnd)
        lastWeekStart.setDate(lastWeekEnd.getDate() - 6)
        result.from = lastWeekStart.toISOString().split('T')[0]
        result.to = lastWeekEnd.toISOString().split('T')[0]
        break
      case 'thismonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        result.from = startOfMonth.toISOString().split('T')[0]
        result.to = today.toISOString().split('T')[0]
        break
      case 'lastmonth':
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        result.from = lastMonthStart.toISOString().split('T')[0]
        result.to = lastMonthEnd.toISOString().split('T')[0]
        break
      default:
        // Handle 'lastXdays' patterns
        const daysMatch = preset.match(/last(\d+)days/)
        if (daysMatch) {
          const days = parseInt(daysMatch[1])
          const startDate = new Date(today)
          startDate.setDate(today.getDate() - days + 1)
          result.from = startDate.toISOString().split('T')[0]
          result.to = today.toISOString().split('T')[0]
        }
        break
    }
    
    return result
  }

  // Apply date preset
  const applyDatePreset = (preset: string) => {
    if (preset === 'custom') {
      setFilterState(prev => ({ ...prev, dateFilter: { ...prev.dateFilter, preset } }))
      return
    }
    
    const dates = getDateFromPreset(preset)
    setFilterState(prev => ({
      ...prev,
      dateFilter: { from: dates.from, to: dates.to, preset }
    }))
  }

  // Apply column preset
  const applyColumnPreset = (presetKey: string) => {
    const preset = COLUMN_PRESETS[presetKey as keyof typeof COLUMN_PRESETS]
    if (preset) {
      setFilterState(prev => ({
        ...prev,
        visibleColumns: { ...preset.columns },
        activeColumnPreset: presetKey
      }))
    }
  }

  const {
    sortColumn,
    sortDirection,
    visibleColumns,
    dateFilter,
    amountFilter,
    textFilter,
    showFilters,
    showColumnManager,
    showAdvancedFilters,
    recordsToShow,
    activeColumnPreset
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
    console.log('Generated complete dataset:', {
      accountName: activeAccount?.name,
      recordsToShow,
      totalDays: data.length,
      daysWithSales: data.filter(d => d.total > 0).length,
      dateRange: data.length > 0 ? `${data[data.length - 1].date} to ${data[0].date}` : 'none'
    })
    
    // Apply date filters
    if (dateFilter.from) {
      const beforeFilter = data.length
      data = data.filter(item => item.date >= dateFilter.from)
      console.log('After date from filter:', beforeFilter, '->', data.length)
    }
    if (dateFilter.to) {
      const beforeFilter = data.length
      data = data.filter(item => item.date <= dateFilter.to)
      console.log('After date to filter:', beforeFilter, '->', data.length)
    }
    
    // Apply text filter
    if (textFilter.trim()) {
      const searchTerm = textFilter.toLowerCase().trim()
      data = data.filter(item => {
        const dateStr = formatDate(item.date).toLowerCase()
        const totalStr = formatCurrency(item.total).toLowerCase()
        const receiptStr = (item.receiptCount || 0).toString()
        return dateStr.includes(searchTerm) || 
               totalStr.includes(searchTerm) || 
               receiptStr.includes(searchTerm)
      })
    }
    
    // Apply amount filters
    if (amountFilter.min) {
      const minAmount = parseFloat(amountFilter.min)
      if (!isNaN(minAmount)) {
        data = data.filter(item => item.total >= minAmount)
      }
    }
    if (amountFilter.max) {
      const maxAmount = parseFloat(amountFilter.max)
      if (!isNaN(maxAmount)) {
        data = data.filter(item => item.total <= maxAmount)
      }
    }

    // Apply receipt count filters
    if (amountFilter.receiptsMin) {
      const minReceipts = parseInt(amountFilter.receiptsMin)
      if (!isNaN(minReceipts)) {
        data = data.filter(item => (item.receiptCount || 0) >= minReceipts)
      }
    }
    if (amountFilter.receiptsMax) {
      const maxReceipts = parseInt(amountFilter.receiptsMax)
      if (!isNaN(maxReceipts)) {
        data = data.filter(item => (item.receiptCount || 0) <= maxReceipts)
      }
    }

    // Apply average receipt filters
    if (amountFilter.avgReceiptMin) {
      const minAvg = parseFloat(amountFilter.avgReceiptMin)
      if (!isNaN(minAvg)) {
        data = data.filter(item => (item.averageReceipt || 0) >= minAvg)
      }
    }
    if (amountFilter.avgReceiptMax) {
      const maxAvg = parseFloat(amountFilter.avgReceiptMax)
      if (!isNaN(maxAvg)) {
        data = data.filter(item => (item.averageReceipt || 0) <= maxAvg)
      }
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
      {/* Enhanced Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        {/* Title and Summary */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📊 Daily Sales Analytics
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <span>{data.length} days displayed</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span>{data.filter(d => d.total > 0).length} days with sales</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span>{formatCurrency(data.reduce((sum, d) => sum + d.total, 0))} total</span>
              {dailyTakings.length <= 40 && onLoadHistoricalData && (
                <>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <button 
                    onClick={onLoadHistoricalData}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '14px',
                      padding: 0,
                      fontWeight: '500'
                    }}
                  >
                    📈 Load historical data
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Active preset indicator */}
          {activeColumnPreset && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #d1fae5',
              color: '#065f46',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ⚡ {COLUMN_PRESETS[activeColumnPreset as keyof typeof COLUMN_PRESETS]?.name || 'Custom'} View
            </div>
          )}
        </div>

        {/* Quick Date Presets */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginRight: '8px' }}>
            Quick filters:
          </span>
          {DATE_PRESETS.slice(0, 8).map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyDatePreset(preset.id)}
              style={{
                background: dateFilter.preset === preset.id ? '#3b82f6' : '#ffffff',
                color: dateFilter.preset === preset.id ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Main Controls */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          {/* Left side controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search dates, amounts..."
                value={textFilter}
                onChange={(e) => setFilterState(prev => ({ ...prev, textFilter: e.target.value }))}
                style={{
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 12px 8px 36px',
                  fontSize: '14px',
                  color: '#374151',
                  width: '200px',
                  outline: 'none'
                }}
              />
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                fontSize: '16px'
              }}>
                🔍
              </div>
            </div>

            <button
              onClick={() => setFilterState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
              style={{
                background: showFilters ? '#3b82f6' : '#ffffff',
                color: showFilters ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: showFilters ? '0 2px 4px rgba(59, 130, 246, 0.2)' : 'none'
              }}
            >
              🔧 Filters {showFilters && '•'}
            </button>

            <button
              onClick={() => setFilterState(prev => ({ ...prev, showColumnManager: !prev.showColumnManager }))}
              style={{
                background: showColumnManager ? '#10b981' : '#ffffff',
                color: showColumnManager ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: showColumnManager ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            >
              📋 Columns {showColumnManager && '•'}
            </button>
          </div>

          {/* Right side controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Export button */}
            <button
              onClick={() => {
                // Export functionality - create CSV
                const csvContent = [
                  ['Date', 'Total', 'Cash', 'Card', 'Receipts', 'Avg Receipt'].join(','),
                  ...data.map(d => [
                    d.date,
                    d.total,
                    d.paymentBreakdown?.cash || 0,
                    d.paymentBreakdown?.card || 0,
                    d.receiptCount || 0,
                    d.averageReceipt || 0
                  ].join(','))
                ].join('\n')
                
                const blob = new Blob([csvContent], { type: 'text/csv' })
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `daily-sales-${new Date().toISOString().split('T')[0]}.csv`
                link.click()
                window.URL.revokeObjectURL(url)
              }}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
              }}
            >
              📥 Export CSV
            </button>

            {/* Clear all filters */}
            <button
              onClick={() => setFilterState(prev => ({
                ...prev,
                dateFilter: { from: '', to: '', preset: 'last30days' },
                amountFilter: { min: '', max: '', receiptsMin: '', receiptsMax: '', avgReceiptMin: '', avgReceiptMax: '' },
                textFilter: ''
              }))}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
              }}
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Filters Panel */}
      {showFilters && (
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%)'
        }}>
          {/* Filter Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔧 Advanced Filters
            </h4>
            
            <button
              onClick={() => setFilterState(prev => ({ ...prev, showAdvancedFilters: !prev.showAdvancedFilters }))}
              style={{
                background: showAdvancedFilters ? '#6366f1' : '#e2e8f0',
                color: showAdvancedFilters ? 'white' : '#6b7280',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {showAdvancedFilters ? '📉 Simple' : '📊 Advanced'}
            </button>
          </div>

          {/* Date Range Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>📅 Date Range</span>
              <div style={{
                background: '#ecfdf5',
                color: '#065f46',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {dateFilter.preset === 'custom' ? 'Custom' : DATE_PRESETS.find(p => p.id === dateFilter.preset)?.label || 'Custom'}
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setFilterState(prev => ({
                    ...prev,
                    dateFilter: { ...prev.dateFilter, from: e.target.value, preset: 'custom' }
                  }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setFilterState(prev => ({
                    ...prev,
                    dateFilter: { ...prev.dateFilter, to: e.target.value, preset: 'custom' }
                  }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Quick Select
                </label>
                <select
                  value={dateFilter.preset}
                  onChange={(e) => applyDatePreset(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {DATE_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Basic Filters */}
          <div style={{ marginBottom: showAdvancedFilters ? '20px' : '0' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>💰 Amount Filters</span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Min Total Amount (£)
                </label>
                <input
                  type="number"
                  value={amountFilter.min}
                  onChange={(e) => setFilterState(prev => ({
                    ...prev,
                    amountFilter: { ...prev.amountFilter, min: e.target.value }
                  }))}
                  placeholder="0.00"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                  Max Total Amount (£)
                </label>
                <input
                  type="number"
                  value={amountFilter.max}
                  onChange={(e) => setFilterState(prev => ({
                    ...prev,
                    amountFilter: { ...prev.amountFilter, max: e.target.value }
                  }))}
                  placeholder="1000.00"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>📊 Advanced Metrics</span>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px'
              }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                    Min Receipts
                  </label>
                  <input
                    type="number"
                    value={amountFilter.receiptsMin}
                    onChange={(e) => setFilterState(prev => ({
                      ...prev,
                      amountFilter: { ...prev.amountFilter, receiptsMin: e.target.value }
                    }))}
                    placeholder="0"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                    Max Receipts
                  </label>
                  <input
                    type="number"
                    value={amountFilter.receiptsMax}
                    onChange={(e) => setFilterState(prev => ({
                      ...prev,
                      amountFilter: { ...prev.amountFilter, receiptsMax: e.target.value }
                    }))}
                    placeholder="100"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                    Min Avg Receipt (£)
                  </label>
                  <input
                    type="number"
                    value={amountFilter.avgReceiptMin}
                    onChange={(e) => setFilterState(prev => ({
                      ...prev,
                      amountFilter: { ...prev.amountFilter, avgReceiptMin: e.target.value }
                    }))}
                    placeholder="0.00"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                    Max Avg Receipt (£)
                  </label>
                  <input
                    type="number"
                    value={amountFilter.avgReceiptMax}
                    onChange={(e) => setFilterState(prev => ({
                      ...prev,
                      amountFilter: { ...prev.amountFilter, avgReceiptMax: e.target.value }
                    }))}
                    placeholder="50.00"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filter Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setFilterState(prev => ({
                ...prev,
                dateFilter: { from: '', to: '', preset: 'last30days' },
                amountFilter: { min: '', max: '', receiptsMin: '', receiptsMax: '', avgReceiptMin: '', avgReceiptMax: '' }
              }))}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🗑️ Clear Filters
            </button>

            <div style={{
              background: '#ecfdf5',
              color: '#065f46',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid #d1fae5'
            }}>
              {data.length} records match your filters
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Column Manager */}
      {showColumnManager && (
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
        }}>
          {/* Column Manager Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 Column Manager
            </h4>
            
            <div style={{
              background: '#ecfdf5',
              color: '#065f46',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              border: '1px solid #d1fae5'
            }}>
              {Object.values(visibleColumns).filter(Boolean).length} of {Object.keys(visibleColumns).length} columns visible
            </div>
          </div>

          {/* Column Presets */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>⚡ Quick Presets</span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {Object.entries(COLUMN_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyColumnPreset(key)}
                  style={{
                    background: activeColumnPreset === key ? '#10b981' : '#ffffff',
                    color: activeColumnPreset === key ? 'white' : '#374151',
                    border: `2px solid ${activeColumnPreset === key ? '#10b981' : '#e2e8f0'}`,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {preset.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    opacity: 0.8
                  }}>
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Individual Column Controls */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>🎛️ Individual Columns</span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {Object.entries(visibleColumns).map(([key, value]) => {
                const isRequired = key === 'date' // Date column is always required
                const columnInfo = {
                  date: { icon: '📅', name: 'Date', desc: 'Transaction date' },
                  shop: { icon: '🏪', name: 'Shop', desc: 'Shop location sales' },
                  cafe: { icon: '☕', name: 'Café', desc: 'Café location sales' },
                  combined: { icon: '💰', name: 'Total', desc: 'Combined total sales' },
                  receipts: { icon: '🧾', name: 'Receipts', desc: 'Number of transactions' },
                  average: { icon: '📊', name: 'Avg Receipt', desc: 'Average transaction value' },
                  status: { icon: '🏷️', name: 'Status', desc: 'Sales performance status' },
                  cash: { icon: '💵', name: 'Cash', desc: 'Cash payments only' },
                  card: { icon: '💳', name: 'Card', desc: 'Card payments only' }
                }[key] || { icon: '📋', name: key, desc: 'Column data' }

                return (
                  <label
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      background: value ? '#f0fdf4' : '#f9fafb',
                      border: `2px solid ${value ? '#d1fae5' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: isRequired ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isRequired ? 0.6 : 1
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={value}
                      disabled={isRequired}
                      onChange={(e) => !isRequired && setFilterState(prev => ({
                        ...prev,
                        visibleColumns: {
                          ...prev.visibleColumns,
                          [key]: e.target.checked
                        },
                        activeColumnPreset: 'custom'
                      }))}
                      style={{
                        cursor: isRequired ? 'not-allowed' : 'pointer',
                        transform: 'scale(1.2)'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '2px'
                      }}>
                        <span>{columnInfo.icon}</span>
                        <span>{columnInfo.name}</span>
                        {isRequired && (
                          <span style={{
                            background: '#fbbf24',
                            color: '#92400e',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            REQUIRED
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        {columnInfo.desc}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Column Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => {
                const allColumns = Object.keys(visibleColumns).reduce((acc, key) => ({
                  ...acc,
                  [key]: key === 'date' // Only keep date column required
                }), {} as typeof visibleColumns)
                setFilterState(prev => ({
                  ...prev,
                  visibleColumns: allColumns,
                  activeColumnPreset: 'custom'
                }))
              }}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📤 Hide All
            </button>

            <button
              onClick={() => {
                const allColumns = Object.keys(visibleColumns).reduce((acc, key) => ({
                  ...acc,
                  [key]: true
                }), {} as typeof visibleColumns)
                setFilterState(prev => ({
                  ...prev,
                  visibleColumns: allColumns,
                  activeColumnPreset: 'detailed'
                }))
              }}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
              }}
            >
              📥 Show All
            </button>

            <div style={{
              background: '#ecfdf5',
              color: '#065f46',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid #d1fae5'
            }}>
              Using: {COLUMN_PRESETS[activeColumnPreset as keyof typeof COLUMN_PRESETS]?.name || 'Custom'} preset
            </div>
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
