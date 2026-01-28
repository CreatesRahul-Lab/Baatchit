'use client'

import React, { useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'

const NotificationSettings: React.FC = () => {
  const { isSupported, isEnabled, requestPermission } = useNotifications()
  const [isLoading, setIsLoading] = useState(false)

  const handleEnableNotifications = async () => {
    setIsLoading(true)
    const success = await requestPermission()
    setIsLoading(false)
    
    if (success) {
      alert('Notifications enabled successfully!')
    } else {
      alert('Failed to enable notifications. Please check your browser settings.')
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
              Notifications Not Supported
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Your browser doesn't support push notifications.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isEnabled) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-green-600 dark:text-green-400">✓</span>
          <div>
            <h4 className="font-medium text-green-800 dark:text-green-300">
              Notifications Enabled
            </h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              You'll receive notifications for new messages.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">🔔</span>
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-300">
              Enable Notifications
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Get notified when you receive new messages.
            </p>
          </div>
        </div>
        <button
          onClick={handleEnableNotifications}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? 'Enabling...' : 'Enable'}
        </button>
      </div>
    </div>
  )
}

export default NotificationSettings
