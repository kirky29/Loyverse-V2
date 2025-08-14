'use client'

import { DailyTaking } from '../types'

interface DailyTakingsChartProps {
  data: DailyTaking[]
}

export default function DailyTakingsChart({ data }: DailyTakingsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-slate-900 mb-3">No data available</h4>
        <p className="text-slate-600">Chart will display here once daily takings data is available</p>
      </div>
    )
  }

  const validData = data.filter(day => day.total !== null && day.total !== undefined && !isNaN(day.total))
  
  if (validData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-slate-900 mb-3">No valid data</h4>
        <p className="text-slate-600">Unable to display chart with current data</p>
      </div>
    )
  }

  const maxValue = Math.max(...validData.map(d => d.total || 0))
  const minValue = Math.min(...validData.map(d => d.total || 0))

  return (
    <div className="h-96">
      {/* Chart Container */}
      <div className="relative h-80 mb-8">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="border-t border-slate-200/50"
              style={{ top: `${percent}%` }}
            />
          ))}
        </div>
        
        {/* Bars */}
        <div className="relative h-full flex items-end justify-between space-x-3">
          {data.map((day, index) => {
            const total = day.total || 0
            const height = maxValue > 0 ? (total / maxValue) * 100 : 0
            const isToday = new Date(day.date).toDateString() === new Date().toDateString()
            const isYesterday = new Date(day.date).toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
            
            let barColor = 'bg-gradient-to-b from-slate-300 to-slate-400 hover:from-slate-400 hover:to-slate-500'
            if (isToday) {
              barColor = 'bg-gradient-to-b from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
            } else if (isYesterday) {
              barColor = 'bg-gradient-to-b from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
            }
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="relative group w-full">
                  <div
                    className={`w-full rounded-t-2xl transition-all duration-500 ease-out ${barColor} shadow-lg hover:shadow-xl`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                    <div className="bg-slate-900 text-white text-sm px-4 py-3 rounded-2xl shadow-2xl whitespace-nowrap border border-slate-700">
                      <div className="font-bold text-lg">£{total.toFixed(2)}</div>
                      <div className="text-xs text-slate-300 mt-1">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-slate-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-r border-b border-slate-700"></div>
                  </div>
                </div>
                
                {/* Date Label */}
                <div className="mt-4 text-center">
                  <div className={`text-sm font-bold ${
                    isToday ? 'text-blue-600' : isYesterday ? 'text-emerald-600' : 'text-slate-600'
                  }`}>
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
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
      <div className="flex justify-between text-sm text-slate-500 px-3">
        <span className="font-bold">£{maxValue.toFixed(0)}</span>
        <span>£{(maxValue * 0.75).toFixed(0)}</span>
        <span>£{(maxValue * 0.5).toFixed(0)}</span>
        <span>£{(maxValue * 0.25).toFixed(0)}</span>
        <span className="font-bold">£0</span>
      </div>
      
      {/* Chart Summary */}
      <div className="mt-8 pt-8 border-t border-slate-200/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200/50">
            <div className="text-3xl font-bold text-blue-600 mb-2">£{maxValue.toFixed(2)}</div>
            <div className="text-sm text-blue-700 font-semibold">Highest Day</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-6 border border-emerald-200/50">
            <div className="text-3xl font-bold text-emerald-600 mb-2">£{minValue.toFixed(2)}</div>
            <div className="text-sm text-emerald-700 font-semibold">Lowest Day</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 border border-purple-200/50">
            <div className="text-3xl font-bold text-purple-600 mb-2">£{(maxValue - minValue).toFixed(2)}</div>
            <div className="text-sm text-purple-700 font-semibold">Revenue Range</div>
          </div>
        </div>
      </div>
    </div>
  )
}
