import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ChatProvider } from '@/contexts/ChatContext'
import Toaster from '@/components/ui/Toaster'
import AuthProvider from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Baatein - Real-Time Chat Rooms',
  description: 'A modern real-time chat application with multiple rooms, user management, and message persistence.',
  keywords: 'chat, real-time, messaging, rooms, socket.io, next.js',
  authors: [{ name: 'Baatein Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ChatProvider>
            <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              {children}
            </main>
            <Toaster />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  )
}