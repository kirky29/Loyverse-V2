'use client'

import { DailyTaking } from '../types'

interface DailyTakingsTableProps {
  data: DailyTaking[]
}

export default function DailyTakingsTable({ data }: DailyTakingsTableProps) {
  if (data.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-gray-500">
        <p>No data available</p>
      </div>
    )
  }

  // Safe number formatting function
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '£0.00'
    }
    return `£${value.toFixed(2)}`
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Takings
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Receipts
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Average Receipt
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((day, index) => {
            const isToday = new Date(day.date).toDateString() === new Date().toDateString()
            const isYesterday = new Date(day.date).toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
            
            let statusColor = 'bg-gray-100 text-gray-800'
            let statusText = 'Normal'
            
            if (isToday) {
              statusColor = 'bg-blue-100 text-blue-800'
              statusText = 'Today'
            } else if (isYesterday) {
              statusColor = 'bg-green-100 text-green-800'
              statusText = 'Yesterday'
            }
            
            return (
              <tr key={day.date} className={isToday ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {day.date}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    {formatCurrency(day.total)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {day.receiptCount || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(day.averageReceipt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
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
