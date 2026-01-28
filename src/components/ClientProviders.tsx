'use client'

import { ReactNode } from 'react'
import { ChatProvider } from '@/contexts/ChatContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import AuthProvider from '@/components/AuthProvider'
import ThemeToggle from '@/components/ThemeToggle'
import Toaster from '@/components/ui/Toaster'

interface ClientProvidersProps {
  children: ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <ChatProvider>
            <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
              <ThemeToggle />
              {children}
            </main>
            <Toaster />
          </ChatProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  )
}
