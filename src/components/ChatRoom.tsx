'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@/contexts/ChatContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import UserList from './UserList'
import ConnectionStatus from './ConnectionStatus'

const ChatRoom = () => {
  const { currentRoom, username, leaveRoom, onlineUsers, isConnected } = useChat()
  const [showUserList, setShowUserList] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  })

  const handleLeaveRoom = () => {
    leaveRoom()
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-xl font-bold">#{currentRoom}</h2>
              <p className="text-blue-100 text-sm">
                {onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <ConnectionStatus />
            
            {/* Mobile User List Toggle */}
            <button
              onClick={() => setShowUserList(!showUserList)}
              className="lg:hidden bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm transition-colors"
            >
              Users ({onlineUsers.length})
            </button>
            
            {/* Leave Room Button */}
            <button
              onClick={handleLeaveRoom}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex h-96 lg:h-[600px]">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <MessageList />
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <MessageInput />
          </div>
        </div>

        {/* Desktop User List */}
        <div className="hidden lg:block w-64 border-l border-gray-200 bg-white">
          <UserList />
        </div>
      </div>

      {/* Mobile User List Overlay */}
      {showUserList && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold">Online Users</h3>
              <button
                onClick={() => setShowUserList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <UserList />
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatRoom