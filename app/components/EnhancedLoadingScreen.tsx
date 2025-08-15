'use client'

import { useEffect, useState } from 'react'

interface LoadingActivity {
  id: string
  message: string
  status: 'pending' | 'active' | 'completed' | 'error'
  timestamp: Date
}

interface EnhancedLoadingScreenProps {
  accountName: string
  progress: number // 0-100
  activities: LoadingActivity[]
  estimatedTimeRemaining?: number // in seconds
}

export default function EnhancedLoadingScreen({ 
  accountName, 
  progress, 
  activities,
  estimatedTimeRemaining 
}: EnhancedLoadingScreenProps) {
  const [dots, setDots] = useState('')

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (status: LoadingActivity['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'active': return '🔄'
      case 'completed': return '✅'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  const getActivityColor = (status: LoadingActivity['status']) => {
    switch (status) {
      case 'pending': return '#64748b'
      case 'active': return '#3b82f6'
      case 'completed': return '#10b981'
      case 'error': return '#ef4444'
      default: return '#64748b'
    }
  }

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${seconds}s remaining`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s remaining`
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px'
    }}>
      {/* Main Loading Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        maxWidth: '600px',
        width: '100%',
        color: '#1f2937'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
          
          <h2 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '24px', 
            fontWeight: '700',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Syncing Data{dots}
          </h2>
          <p style={{ 
            margin: '0', 
            fontSize: '16px', 
            color: '#6b7280',
            fontWeight: '500'
          }}>
            {accountName}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Progress
            </span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
              {Math.round(progress)}%
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '12px',
            background: '#e5e7eb',
            borderRadius: '6px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
              borderRadius: '6px',
              transition: 'width 0.3s ease-in-out',
              position: 'relative'
            }}>
              {/* Animated shimmer effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                animation: 'shimmer 2s infinite'
              }} />
            </div>
          </div>
          
          {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
            <div style={{
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {formatTimeRemaining(estimatedTimeRemaining)}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 Activity Feed
          </h3>
          
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: '#f9fafb'
          }}>
            {activities.slice(-5).reverse().map((activity, index) => (
              <div key={activity.id} style={{
                padding: '12px 16px',
                borderBottom: index < Math.min(activities.length - 1, 4) ? '1px solid #e5e7eb' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.2s',
                background: activity.status === 'active' ? '#eff6ff' : 'transparent'
              }}>
                <span style={{ 
                  fontSize: '16px',
                  animation: activity.status === 'active' ? 'pulse 1.5s infinite' : 'none'
                }}>
                  {getActivityIcon(activity.status)}
                </span>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: getActivityColor(activity.status),
                    marginBottom: '2px'
                  }}>
                    {activity.message}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {activity.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
