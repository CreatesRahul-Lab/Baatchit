'use client'

import { useState } from 'react'
import { useChat } from '@/contexts/ChatContext'
import ModerationPanel from './ModerationPanel'

const UserList = () => {
  const { onlineUsers, username, typingUsers } = useChat()
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showModPanel, setShowModPanel] = useState(false)

  const formatJoinTime = (joinedAt: Date) => {
    const now = new Date()
    const joined = new Date(joinedAt)
    const diffInMinutes = Math.floor((now.getTime() - joined.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const getUserStatus = (user: any) => {
    if (typingUsers.includes(user.username)) {
      return { text: 'typing...', color: 'text-blue-500' }
    }
    return { text: 'online', color: 'text-green-500' }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
          Online Users ({onlineUsers.length})
        </h3>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-2">
        {onlineUsers.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-sm">No users online</p>
          </div>
        ) : (
          <div className="space-y-1">
            {onlineUsers
              .sort((a, b) => {
                // Sort by: current user first, then typing users, then alphabetically
                if (a.username === username) return -1
                if (b.username === username) return 1
                
                const aTyping = typingUsers.includes(a.username)
                const bTyping = typingUsers.includes(b.username)
                
                if (aTyping && !bTyping) return -1
                if (!aTyping && bTyping) return 1
                
                return a.username.localeCompare(b.username)
              })
              .map((user) => {
                const status = getUserStatus(user)
                const isCurrentUser = user.username === username
                
                return (
                  <div
                    key={user.id}
                    className={`p-3 rounded-lg transition-colors group relative ${
                      isCurrentUser
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                        isCurrentUser ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className={`font-medium text-sm truncate ${
                            isCurrentUser ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {user.username}
                            {isCurrentUser && ' (you)'}
                          </span>
                        </div>
                        
                        {/* Status */}
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            typingUsers.includes(user.username) ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <span className={`text-xs ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        
                        {/* Join time */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Joined {formatJoinTime(user.joinedAt)}
                        </div>
                      </div>

                      {/* Moderation button (only for other users) */}
                      {!isCurrentUser && (
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowModPanel(true)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Moderate user"
                        >
                          <span className="text-gray-600 dark:text-gray-300">⚙️</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Room Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Total messages:</span>
            <span className="font-medium">-</span>
          </div>
          <div className="flex justify-between">
            <span>Room created:</span>
            <span className="font-medium">Today</span>
          </div>
        </div>
      </div>

      {/* Moderation Panel */}
      {showModPanel && selectedUser && (
        <ModerationPanel
          targetUser={selectedUser}
          onClose={() => {
            setShowModPanel(false)
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}

export default UserList