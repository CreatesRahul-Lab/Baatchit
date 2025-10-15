'use client'

import { useChat } from '@/contexts/ChatContext'

const ConnectionStatus = () => {
  const { isConnected, connectionError } = useChat()

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-green-100">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium">Connected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-red-100">
      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
      <span className="text-xs font-medium">
        {connectionError ? 'Connection Error' : 'Connecting...'}
      </span>
    </div>
  )
}

export default ConnectionStatus