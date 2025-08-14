'use client'

import { DailyTaking } from '../types'

interface DailyTakingsChartProps {
  data: DailyTaking[]
}

export default function DailyTakingsChart({ data }: DailyTakingsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">No data available</h4>
        <p className="text-gray-600">Chart will display here once daily takings data is available</p>
      </div>
    )
  }

  const validData = data.filter(day => day.total !== null && day.total !== undefined && !isNaN(day.total))
  
  if (validData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">No valid data</h4>
        <p className="text-gray-600">Unable to display chart with current data</p>
      </div>
    )
  }

  const maxValue = Math.max(...validData.map(d => d.total || 0))
  const minValue = Math.min(...validData.map(d => d.total || 0))

  return (
    <div className="h-80">
      {/* Chart Container */}
      <div className="relative h-64 mb-6">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="border-t border-gray-200"
              style={{ top: `${percent}%` }}
            />
          ))}
        </div>
        
        {/* Bars */}
        <div className="relative h-full flex items-end justify-between space-x-2">
          {data.map((day, index) => {
            const total = day.total || 0
            const height = maxValue > 0 ? (total / maxValue) * 100 : 0
            const isToday = new Date(day.date).toDateString() === new Date().toDateString()
            const isYesterday = new Date(day.date).toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
            
            let barColor = 'bg-gray-300 hover:bg-gray-400'
            if (isToday) {
              barColor = 'bg-blue-600 hover:bg-blue-700'
            } else if (isYesterday) {
              barColor = 'bg-green-500 hover:bg-green-600'
            }
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="relative group w-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ease-out ${barColor} shadow-sm hover:shadow-md`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10">
                    <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                      <div className="font-semibold">£{total.toFixed(2)}</div>
                      <div className="text-xs text-gray-300">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1"></div>
                  </div>
                </div>
                
                {/* Date Label */}
                <div className="mt-3 text-center">
                  <div className={`text-xs font-medium ${
                    isToday ? 'text-blue-600' : isYesterday ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short'
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 px-2">
        <span className="font-medium">£{maxValue.toFixed(0)}</span>
        <span>£{(maxValue * 0.75).toFixed(0)}</span>
        <span>£{(maxValue * 0.5).toFixed(0)}</span>
        <span>£{(maxValue * 0.25).toFixed(0)}</span>
        <span className="font-medium">£0</span>
      </div>
      
      {/* Chart Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">£{maxValue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Highest Day</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">£{minValue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Lowest Day</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">£{(maxValue - minValue).toFixed(2)}</div>
            <div className="text-sm text-gray-600">Range</div>
          </div>
        </div>
      </div>
    </div>
  )
}
