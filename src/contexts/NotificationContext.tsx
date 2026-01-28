'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface NotificationContextType {
  isSupported: boolean
  isEnabled: boolean
  requestPermission: () => Promise<boolean>
  subscription: PushSubscription | null
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Check if notifications and service workers are supported
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true)
      
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
          setSwRegistration(registration)
          
          // Check existing subscription
          return registration.pushManager.getSubscription()
        })
        .then((sub) => {
          if (sub) {
            setSubscription(sub)
            setIsEnabled(true)
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })

      // Check current permission
      if (Notification.permission === 'granted') {
        setIsEnabled(true)
      }
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported || !swRegistration) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        const applicationServerKey = vapidKey ? urlBase64ToUint8Array(vapidKey) : undefined
        
        const sub = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })

        setSubscription(sub)
        setIsEnabled(true)

        // Send subscription to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sub),
        })

        return true
      }
      
      return false
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        isSupported,
        isEnabled,
        requestPermission,
        subscription,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}
