'use client'

import { DailyTaking } from '../types'

interface DailyTakingsChartProps {
  data: DailyTaking[]
}

export default function DailyTakingsChart({ data }: DailyTakingsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No data available to display</p>
      </div>
    )
  }

  // Safe number calculations with null checks
  const validData = data.filter(day => day.total !== null && day.total !== undefined && !isNaN(day.total))
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No valid data available to display</p>
      </div>
    )
  }

  const maxValue = Math.max(...validData.map(d => d.total || 0))
  const minValue = Math.min(...validData.map(d => d.total || 0))

  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-48 space-x-1">
        {data.map((day, index) => {
          const total = day.total || 0
          const height = maxValue > 0 ? (total / maxValue) * 100 : 0
          const isToday = new Date(day.date).toDateString() === new Date().toDateString()
          
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <div className="relative group">
                <div
                  className={`w-full rounded-t transition-all duration-200 ${
                    isToday ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  £{total.toFixed(2)}
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-2 text-center">
                {new Date(day.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>${maxValue.toFixed(0)}</span>
        <span>${(maxValue / 2).toFixed(0)}</span>
        <span>${minValue.toFixed(0)}</span>
      </div>
    </div>
  )
}
