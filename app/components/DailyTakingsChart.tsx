'use client'

import { DailyTaking } from '../types'

interface DailyTakingsChartProps {
  data: DailyTaking[]
}

export default function DailyTakingsChart({ data }: DailyTakingsChartProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-2xl font-bold text-slate-900 mb-3">No data available</h4>
        <p className="text-slate-600 text-lg">Connect your store to start tracking daily takings</p>
      </div>
    )
  }

  const validData = data.filter(day => day.total !== null && day.total !== undefined && !isNaN(day.total))
  
  if (validData.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-2xl font-bold text-slate-900 mb-3">No valid data</h4>
        <p className="text-slate-600 text-lg">All data points have zero values</p>
      </div>
    )
  }

  const maxValue = Math.max(...validData.map(d => d.total || 0))
  const minValue = Math.min(...validData.map(d => d.total || 0))

  return (
    <div className="h-96">
      {data.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-slate-900 mb-3">No data available</h4>
          <p className="text-slate-600 text-lg">Connect your store to start tracking daily takings</p>
        </div>
      ) : !validData.length ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-slate-900 mb-3">No valid data</h4>
          <p className="text-slate-600 text-lg">All data points have zero values</p>
        </div>
      ) : (
        <>
          <div className="relative h-96 mb-8">
            {/* Chart bars */}
            <div className="flex items-end justify-between h-full space-x-2">
              {validData.map((day, index) => {
                const isToday = new Date(day.date).toDateString() === new Date().toDateString()
                const isYesterday = new Date(day.date).toDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()
                const height = (day.total / maxValue) * 100
                
                let barColor = 'bg-gradient-to-b from-slate-300 to-slate-400 hover:from-slate-400 hover:to-slate-500'
                if (isToday) {
                  barColor = 'bg-gradient-to-b from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                } else if (isYesterday) {
                  barColor = 'bg-gradient-to-b from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                }
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700">
                        <div className="text-center">
                          <div className="font-bold text-lg mb-1">{formatCurrency(day.total)}</div>
                          <div className="text-sm text-slate-300">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        {/* Tooltip arrow */}
                        <div className="w-3 h-3 bg-slate-900 transform rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-r border-b border-slate-700"></div>
                      </div>
                    </div>
                    
                    {/* Bar */}
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-2xl transition-all duration-500 ease-out ${barColor} shadow-lg hover:shadow-xl`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                    </div>
                    
                    {/* Date label */}
                    <div className="mt-3 text-center">
                      <div className="text-sm font-bold text-slate-900">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short'
                        })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-500 font-bold">
              <span>{formatCurrency(maxValue)}</span>
              <span>{formatCurrency(maxValue * 0.75)}</span>
              <span>{formatCurrency(maxValue * 0.5)}</span>
              <span>{formatCurrency(maxValue * 0.25)}</span>
              <span>$0</span>
            </div>
            
            {/* Grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {[0, 25, 50, 75, 100].map((percent) => (
                <div
                  key={percent}
                  className="absolute w-full border-t border-slate-200 border-opacity-50"
                  style={{ top: `${percent}%` }}
                />
              ))}
            </div>
          </div>

          {/* Chart Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200 border-opacity-50">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-blue-900">Highest Day</h4>
              </div>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(maxValue)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-6 border border-emerald-200 border-opacity-50">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-emerald-900">Lowest Day</h4>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(minValue)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 border border-purple-200 border-opacity-50">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-purple-900">Range</h4>
              </div>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(maxValue - minValue)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
