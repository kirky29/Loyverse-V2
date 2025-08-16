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
  showColumnManager: boolean
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
  // UI state outside data filters
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false)
  
  // Initialize filter state
  const [filterState, setFilterState] = React.useState<AccountFilterState>(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 29)
    
    return {
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
      dateFilter: { 
        from: thirtyDaysAgo.toISOString().split('T')[0], 
        to: today.toISOString().split('T')[0], 
        preset: 'last30days' 
      },
      amountFilter: { 
        min: '', 
        max: '', 
        receiptsMin: '', 
        receiptsMax: '',
        avgReceiptMin: '',
        avgReceiptMax: ''
      },
      textFilter: '',
      showColumnManager: false,
      recordsToShow: 30,
      savedColumnPresets: {},
      activeColumnPreset: 'essential'
    }
  })

  const {
    sortColumn,
    sortDirection,
    visibleColumns,
    dateFilter,
    amountFilter,
    textFilter,
    showColumnManager,
    recordsToShow,
    activeColumnPreset
  } = filterState

  // Helpers
  const getDateFromPreset = (preset: string) => {
    const today = new Date()
    const result = { from: '', to: '' }
    
    switch (preset) {
      case 'today': {
        const d = today.toISOString().split('T')[0]
        result.from = d
        result.to = d
        break
      }
      case 'yesterday': {
        const y = new Date(today)
        y.setDate(today.getDate() - 1)
        const d = y.toISOString().split('T')[0]
        result.from = d
        result.to = d
        break
      }
      case 'thisweek': {
        const start = new Date(today)
        start.setDate(today.getDate() - today.getDay())
        result.from = start.toISOString().split('T')[0]
        result.to = today.toISOString().split('T')[0]
        break
      }
      case 'lastweek': {
        const end = new Date(today)
        end.setDate(today.getDate() - today.getDay() - 1)
        const start = new Date(end)
        start.setDate(end.getDate() - 6)
        result.from = start.toISOString().split('T')[0]
        result.to = end.toISOString().split('T')[0]
        break
      }
      case 'thismonth': {
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        result.from = start.toISOString().split('T')[0]
        result.to = today.toISOString().split('T')[0]
        break
      }
      case 'lastmonth': {
        const end = new Date(today.getFullYear(), today.getMonth(), 0)
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        result.from = start.toISOString().split('T')[0]
        result.to = end.toISOString().split('T')[0]
        break
      }
      default: {
        const match = preset.match(/last(\d+)days/)
        if (match) {
          const days = parseInt(match[1])
          const start = new Date(today)
          start.setDate(today.getDate() - days + 1)
          result.from = start.toISOString().split('T')[0]
          result.to = today.toISOString().split('T')[0]
        }
      }
    }
    
    return result
  }

  const applyDatePreset = (preset: string) => {
    if (preset === 'custom') {
      setFilterState(prev => ({ ...prev, dateFilter: { ...prev.dateFilter, preset } }))
      return
    }
    const range = getDateFromPreset(preset)
    setFilterState(prev => ({
      ...prev,
      dateFilter: { from: range.from, to: range.to, preset }
    }))
  }

  const handleSort = (column: string) => {
    const dir = sortColumn === column && sortDirection === 'desc' ? 'asc' : 'desc'
    setFilterState(prev => ({ ...prev, sortColumn: column, sortDirection: dir }))
  }

  const getShopAmount = (d: DailyTaking) => d.locationBreakdown?.['d5a7267b-ca6f-4490-9d66-b5ba46cc563c'] || 0
  const getCafeAmount = (d: DailyTaking) => d.locationBreakdown?.['e2aa143e-3e91-433e-a6d8-5a5538d429e2'] || 0
  const getCombinedAmount = (d: DailyTaking) => d.total || 0

  // Data processing
  const generateCompleteDataset = () => {
    if (dailyTakings.length > 0) return dailyTakings
    const out: DailyTaking[] = []
    const map = new Map(dailyTakings.map(i => [i.date, i]))
    for (let i = 0; i < recordsToShow; i++) {
      const cur = new Date()
      cur.setDate(cur.getDate() - i)
      const ds = cur.toISOString().split('T')[0]
      const exists = map.get(ds)
      out.push(
        exists || {
          date: ds,
          total: 0,
          receiptCount: 0,
          averageReceipt: 0,
          locationBreakdown: {},
          paymentBreakdown: { cash: 0, card: 0 }
        }
      )
    }
    return out
  }

  const processedData = () => {
    let data = generateCompleteDataset()

    // Dates
    if (dateFilter.from) data = data.filter(i => i.date >= dateFilter.from)
    if (dateFilter.to) data = data.filter(i => i.date <= dateFilter.to)

    // Text
    if (textFilter.trim()) {
      const q = textFilter.toLowerCase().trim()
      data = data.filter(i => {
        const ds = new Date(i.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toLowerCase()
        return ds.includes(q) || formatCurrency(i.total).toLowerCase().includes(q) || String(i.receiptCount || 0).includes(q)
      })
    }

    // Amounts
    if (amountFilter.min) data = data.filter(i => i.total >= parseFloat(amountFilter.min))
    if (amountFilter.max) data = data.filter(i => i.total <= parseFloat(amountFilter.max))
    if (amountFilter.receiptsMin) data = data.filter(i => (i.receiptCount || 0) >= parseInt(amountFilter.receiptsMin))
    if (amountFilter.receiptsMax) data = data.filter(i => (i.receiptCount || 0) <= parseInt(amountFilter.receiptsMax))
    if (amountFilter.avgReceiptMin) data = data.filter(i => (i.averageReceipt || 0) >= parseFloat(amountFilter.avgReceiptMin))
    if (amountFilter.avgReceiptMax) data = data.filter(i => (i.averageReceipt || 0) <= parseFloat(amountFilter.avgReceiptMax))

    // Sort
      data.sort((a, b) => {
      const asc = sortDirection === 'asc' ? 1 : -1
      switch (sortColumn) {
        case 'date': return asc * (new Date(a.date).getTime() - new Date(b.date).getTime())
        case 'shop': return asc * (getShopAmount(a) - getShopAmount(b))
        case 'cafe': return asc * (getCafeAmount(a) - getCafeAmount(b))
        case 'combined': return asc * (getCombinedAmount(a) - getCombinedAmount(b))
        case 'receipts': return asc * ((a.receiptCount || 0) - (b.receiptCount || 0))
        case 'average': return asc * ((a.averageReceipt || 0) - (b.averageReceipt || 0))
        case 'cash': return asc * ((a.paymentBreakdown?.cash || 0) - (b.paymentBreakdown?.cash || 0))
        case 'card': return asc * ((a.paymentBreakdown?.card || 0) - (b.paymentBreakdown?.card || 0))
        default: return 0
      }
    })
    
    return data
  }

  const data = processedData()

  // Active chips
  const activeChips: Array<{ key: string; label: string; onClear: () => void }> = []
  if (dateFilter.preset === 'custom') {
    activeChips.push({
      key: 'daterange',
      label: `Range: ${new Date(dateFilter.from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(dateFilter.to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
      onClear: () => applyDatePreset('last30days')
    })
  } else if (dateFilter.preset !== 'last30days') {
    activeChips.push({ key: 'preset', label: DATE_PRESETS.find(p => p.id === dateFilter.preset)?.label || 'Preset', onClear: () => applyDatePreset('last30days') })
  }
  if (amountFilter.min) activeChips.push({ key: 'min', label: `Min £${amountFilter.min}`, onClear: () => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, min: '' } })) })
  if (amountFilter.max) activeChips.push({ key: 'max', label: `Max £${amountFilter.max}`, onClear: () => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, max: '' } })) })
  if (amountFilter.receiptsMin) activeChips.push({ key: 'rmin', label: `Receipts ≥ ${amountFilter.receiptsMin}`, onClear: () => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, receiptsMin: '' } })) })
  if (amountFilter.receiptsMax) activeChips.push({ key: 'rmax', label: `Receipts ≤ ${amountFilter.receiptsMax}`, onClear: () => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, receiptsMax: '' } })) })
  if (amountFilter.avgReceiptMin) activeChips.push({ key: 'amin', label: `Avg ≥ £${amountFilter.avgReceiptMin}`, onClear: () => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, avgReceiptMin: '' } })) })
  if (amountFilter.avgReceiptMax) activeChips.push({ key: 'amax', label: `Avg ≤ £${amountFilter.avgReceiptMax}`, onClear: () => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, avgReceiptMax: '' } })) })
  if (textFilter.trim()) activeChips.push({ key: 'q', label: `Query: ${textFilter}`, onClear: () => setFilterState(p => ({ ...p, textFilter: '' })) })

  const resetAll = () => {
    const today = new Date()
    const thirty = new Date(today)
    thirty.setDate(today.getDate() - 29)
    setFilterState(prev => ({
      ...prev,
      dateFilter: { from: thirty.toISOString().split('T')[0], to: today.toISOString().split('T')[0], preset: 'last30days' },
      amountFilter: { min: '', max: '', receiptsMin: '', receiptsMax: '', avgReceiptMin: '', avgReceiptMax: '' },
      textFilter: ''
    }))
  }

  const formatDate = (ds: string) => new Date(ds).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const getRowStatus = (d: DailyTaking) => {
    const t = d.total || 0
    if (t === 0) return { text: 'No Sales', color: '#6b7280', bg: '#f9fafb' }
    if (t < 100) return { text: 'Low', color: '#dc2626', bg: '#fef2f2' }
    if (t < 500) return { text: 'Medium', color: '#d97706', bg: '#fffbeb' }
    return { text: 'High', color: '#059669', bg: '#ecfdf5' }
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>📊 Daily Sales Analytics</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{data.length} days displayed</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span>{data.filter(d => d.total > 0).length} days with sales</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span>{formatCurrency(data.reduce((s, d) => s + d.total, 0))} total</span>
              {dailyTakings.length <= 40 && onLoadHistoricalData && (
                <>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <button onClick={onLoadHistoricalData} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', fontSize: '14px', padding: 0, fontWeight: 500 }}>📈 Load historical data</button>
                </>
              )}
            </p>
          </div>

          <button onClick={resetAll} style={{ background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>↻ Reset</button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
          {/* Row 1: Time presets */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>🗓 Time Period</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
              {DATE_PRESETS.slice(0, 8).map(p => (
                <button key={p.id} onClick={() => applyDatePreset(p.id)}
                  style={{ background: dateFilter.preset === p.id ? '#3b82f6' : '#f9fafb', color: dateFilter.preset === p.id ? '#fff' : '#374151', border: dateFilter.preset === p.id ? '1px solid #3b82f6' : '1px solid #e5e7eb', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>{p.label}</button>
              ))}
            </div>
        </div>

          {/* Row 2: Search + Actions */}
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>🔎 Search</div>
            <div style={{ position: 'relative' }}>
                <input type="text" placeholder="Search dates, totals, receipts..." value={textFilter} onChange={(e) => setFilterState(p => ({ ...p, textFilter: e.target.value }))}
                  style={{ width: '100%', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px 10px 36px', fontSize: '14px', color: '#374151', outline: 'none' }} />
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>🔍</div>
              </div>
            </div>

            <div style={{ alignSelf: 'end' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}> </div>
              <button onClick={() => setIsFilterModalOpen(true)}
                style={{ background: '#111827', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>⚙️ Filters</button>
          </div>

            <div style={{ alignSelf: 'end' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}> </div>
              <button onClick={() => setFilterState(p => ({ ...p, showColumnManager: !p.showColumnManager }))}
                style={{ background: showColumnManager ? '#10b981' : '#f9fafb', color: showColumnManager ? '#fff' : '#374151', border: showColumnManager ? '1px solid #10b981' : '1px solid #e5e7eb', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{showColumnManager ? '📋 Editing' : '📋 Columns'}</button>
        </div>
      </div>

          {/* Row 3: Active chips */}
          {activeChips.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px dashed #e5e7eb', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {activeChips.map(chip => (
                <span key={chip.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', fontSize: 12, padding: '6px 8px', borderRadius: 999 }}>
                  {chip.label}
                  <button onClick={chip.onClear} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
                </span>
              ))}
              <button onClick={resetAll} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Clear all</button>
          </div>
          )}
              </div>
            </div>
            
      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.35)', zIndex: 50 }} onClick={() => setIsFilterModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, margin: '8vh auto', background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Advanced Filters</div>
              <button onClick={() => setIsFilterModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>✕</button>
              </div>

            <div style={{ padding: 20 }}>
              {/* Date range */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>📅 Custom Date Range</div>
                  <button onClick={() => applyDatePreset('last30days')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Use last 30 days</button>
              </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>From</label>
                    <input type="date" value={dateFilter.from} onChange={(e) => setFilterState(p => ({ ...p, dateFilter: { ...p.dateFilter, from: e.target.value, preset: 'custom' } }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>To</label>
                    <input type="date" value={dateFilter.to} onChange={(e) => setFilterState(p => ({ ...p, dateFilter: { ...p.dateFilter, to: e.target.value, preset: 'custom' } }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
            </div>
          </div>
            </div>
            
              {/* Amounts */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>💰 Amounts</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Min Total (£)</label>
                    <input type="number" step="0.01" placeholder="0.00" value={amountFilter.min} onChange={(e) => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, min: e.target.value } }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Max Total (£)</label>
                    <input type="number" step="0.01" placeholder="1000.00" value={amountFilter.max} onChange={(e) => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, max: e.target.value } }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </div>
            </div>
          </div>

              {/* Metrics */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>📊 Metrics</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
                <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Min Receipts</label>
                    <input type="number" min={0} placeholder="0" value={amountFilter.receiptsMin} onChange={(e) => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, receiptsMin: e.target.value } }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Max Receipts</label>
                    <input type="number" min={0} placeholder="100" value={amountFilter.receiptsMax} onChange={(e) => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, receiptsMax: e.target.value } }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Min Avg (£)</label>
                    <input type="number" step="0.01" placeholder="0.00" value={amountFilter.avgReceiptMin} onChange={(e) => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, avgReceiptMin: e.target.value } }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Max Avg (£)</label>
                    <input type="number" step="0.01" placeholder="50.00" value={amountFilter.avgReceiptMax} onChange={(e) => setFilterState(p => ({ ...p, amountFilter: { ...p.amountFilter, avgReceiptMax: e.target.value } }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }} />
                </div>
              </div>
            </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <button onClick={resetAll} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline' }}>Clear all</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setIsFilterModalOpen(false)} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => setIsFilterModalOpen(false)} style={{ background: '#111827', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Apply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Manager */}
      {showColumnManager && (
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>📋 Column Manager</h4>
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid #d1fae5' }}>
              {Object.values(visibleColumns).filter(Boolean).length} of {Object.keys(visibleColumns).length} columns visible
            </div>
          </div>

          {/* Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              {Object.entries(COLUMN_PRESETS).map(([key, preset]) => (
              <button key={key} onClick={() => setFilterState(p => ({ ...p, visibleColumns: { ...COLUMN_PRESETS[key as keyof typeof COLUMN_PRESETS].columns }, activeColumnPreset: key }))}
                style={{ background: activeColumnPreset === key ? '#10b981' : '#ffffff', color: activeColumnPreset === key ? '#fff' : '#374151', border: `2px solid ${activeColumnPreset === key ? '#10b981' : '#e2e8f0'}`, padding: '12px 16px', borderRadius: 8, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{preset.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{preset.description}</div>
                </button>
              ))}
          </div>

          {/* Individual toggles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              {Object.entries(visibleColumns).map(([key, value]) => {
              const isRequired = key === 'date'
              const meta = {
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
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: value ? '#f0fdf4' : '#f9fafb', border: `2px solid ${value ? '#d1fae5' : '#e5e7eb'}`, borderRadius: 8, cursor: isRequired ? 'not-allowed' : 'pointer', opacity: isRequired ? 0.6 : 1 }}>
                  <input type="checkbox" checked={value} disabled={isRequired} onChange={(e) => !isRequired && setFilterState(p => ({ ...p, visibleColumns: { ...p.visibleColumns, [key]: e.target.checked }, activeColumnPreset: 'custom' }))} style={{ cursor: isRequired ? 'not-allowed' : 'pointer', transform: 'scale(1.2)' }} />
                    <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 2 }}>
                      <span>{meta.icon}</span>
                      <span>{meta.name}</span>
                      {isRequired && (<span style={{ background: '#fbbf24', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>REQUIRED</span>)}
                      </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{meta.desc}</div>
                    </div>
                  </label>
                )
              })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setFilterState(p => ({ ...p, visibleColumns: Object.keys(p.visibleColumns).reduce((acc, k) => ({ ...acc, [k]: k === 'date' }), {} as typeof p.visibleColumns), activeColumnPreset: 'custom' }))} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>📤 Hide All</button>
            <button onClick={() => setFilterState(p => ({ ...p, visibleColumns: Object.keys(p.visibleColumns).reduce((acc, k) => ({ ...acc, [k]: true }), {} as typeof p.visibleColumns), activeColumnPreset: 'detailed' }))} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}>📥 Show All</button>
            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: '1px solid #d1fae5' }}>Using: {COLUMN_PRESETS[activeColumnPreset as keyof typeof COLUMN_PRESETS]?.name || 'Custom'} preset</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {visibleColumns.date && (
                <th onClick={() => handleSort('date')} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 1 }}>Date {sortColumn === 'date' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.shop && activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && (
                <th onClick={() => handleSort('shop')} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}>Shop {sortColumn === 'shop' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.cafe && activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && (
                <th onClick={() => handleSort('cafe')} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}>Cafe {sortColumn === 'cafe' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.combined && (
                <th onClick={() => handleSort('combined')} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}>Total {sortColumn === 'combined' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.cash && (
                <th onClick={() => handleSort('cash')} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}>Cash {sortColumn === 'cash' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.card && (
                <th onClick={() => handleSort('card')} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}>Card {sortColumn === 'card' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.receipts && (
                <th onClick={() => handleSort('receipts')} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}>Receipts {sortColumn === 'receipts' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.average && (
                <th onClick={() => handleSort('average')} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}>Avg Receipt {sortColumn === 'average' && (filterState.sortDirection === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.status && (
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Status</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((day, idx) => {
              const status = getRowStatus(day)
              const even = idx % 2 === 0
              return (
                <tr key={day.date} onClick={() => onDayClick(day)} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f9ff' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = even ? '#ffffff' : '#f9fafb' }}
                  style={{ backgroundColor: even ? '#ffffff' : '#f9fafb', cursor: 'pointer', transition: 'background-color 0.15s ease' }}>
                  {visibleColumns.date && (<td style={{ padding: '12px 16px', fontSize: 14, color: '#1e293b', fontWeight: 500, position: 'sticky', left: 0, background: 'inherit', zIndex: 1 }}>{formatDate(day.date)}</td>)}
                  {visibleColumns.shop && activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && (<td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#059669', fontWeight: 600 }}>{formatCurrency(getShopAmount(day))}</td>)}
                  {visibleColumns.cafe && activeAccount?.storeId === 'e2aa143e-3e91-433e-a6d8-5a5538d429e2' && (<td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#059669', fontWeight: 600 }}>{formatCurrency(getCafeAmount(day))}</td>)}
                  {visibleColumns.combined && (<td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#059669', fontWeight: 700 }}>{formatCurrency(getCombinedAmount(day))}</td>)}
                  {visibleColumns.cash && (<td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#6b7280', fontWeight: 500 }}>{formatCurrency(day.paymentBreakdown?.cash || 0)}</td>)}
                  {visibleColumns.card && (<td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#6b7280', fontWeight: 500 }}>{formatCurrency(day.paymentBreakdown?.card || 0)}</td>)}
                  {visibleColumns.receipts && (<td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#6b7280' }}>{day.receiptCount || 0}</td>)}
                  {visibleColumns.average && (<td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, color: '#6b7280' }}>{formatCurrency(day.averageReceipt || 0)}</td>)}
                  {visibleColumns.status && (
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ background: status.bg, color: status.color, padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 500 }}>{status.text}</span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: 16, marginBottom: 8 }}>No data found</div>
          <div style={{ fontSize: 14 }}>Try adjusting your filters or date range</div>
        </div>
      )}
    </div>
  )
}