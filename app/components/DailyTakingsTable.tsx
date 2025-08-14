'use client'

import { DailyTaking } from '../types'

interface DailyTakingsTableProps {
  data: DailyTaking[]
}

export default function DailyTakingsTable({ data }: DailyTakingsTableProps) {
  if (data.length === 0) {
    return (
      <div className="px-8 py-16 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-slate-900 mb-3">No data available</h4>
        <p className="text-slate-600">Daily takings data will appear here once available</p>
      </div>
    )
  }

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '£0.00'
    }
    return `£${value.toFixed(2)}`
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200/50">
        <thead>
          <tr>
            <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </th>
            <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              Receipts
            </th>
            <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              Average Receipt
            </th>
            <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/50">
          {data.map((day, index) => {
            const isToday = new Date(day.date).toDateString() === new Date().toDateString()
            const isYesterday = new Date(day.date).toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
            
            let statusColor = 'bg-slate-100 text-slate-700'
            let statusText = 'Normal'
            let statusIcon = null
            
            if (isToday) {
              statusColor = 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200'
              statusText = 'Today'
              statusIcon = (
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              )
            } else if (isYesterday) {
              statusColor = 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200'
              statusText = 'Yesterday'
              statusIcon = (
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )
            }
            
            return (
              <tr key={day.date} className={`${isToday ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50' : 'hover:bg-slate-50/50'} transition-all duration-300`}>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-4 ${isToday ? 'bg-blue-500 shadow-lg' : isYesterday ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-xl font-bold text-slate-900">
                    {formatCurrency(day.total)}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.964 5.964A1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      {day.receiptCount || 0}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-lg font-bold text-slate-900">
                    {formatCurrency(day.averageReceipt)}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <span className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-full ${statusColor}`}>
                    {statusIcon}
                    {statusText}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
