'use client'

import { useState, useEffect } from 'react'
import { useChat } from '@/contexts/ChatContext'

interface DMListProps {
  onClose: () => void
}

const DMList: React.FC<DMListProps> = ({ onClose }) => {
  const { username, onlineUsers, joinRoom } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [dmRooms, setDmRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDMRooms()
  }, [username])

  const fetchDMRooms = async () => {
    try {
      const response = await fetch(`/api/dm?username=${username}`)
      const data = await response.json()
      setDmRooms(data.rooms || [])
    } catch (error) {
      console.error('Error fetching DMs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartDM = async (otherUsername: string) => {
    try {
      const response = await fetch('/api/dm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user1: username,
          user2: otherUsername,
        }),
      })

      const data = await response.json()
      if (data.room) {
        joinRoom(data.room.id, username)
        onClose()
      }
    } catch (error) {
      console.error('Error starting DM:', error)
      alert('Failed to start direct message')
    }
  }

  const filteredUsers = onlineUsers.filter(
    (user) =>
      user.username !== username &&
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getOtherParticipant = (room: any) => {
    return room.participants?.find((p: string) => p !== username) || ''
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Direct Messages</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Existing DMs */}
          {dmRooms.length > 0 && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Recent Conversations
              </h3>
              <div className="space-y-2">
                {dmRooms.map((room) => {
                  const otherUser = getOtherParticipant(room)
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        joinRoom(room.id, username)
                        onClose()
                      }}
                      className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {otherUser.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {otherUser}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(room.lastActivity).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Online Users */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
              Start New Conversation
            </h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No users found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleStartDM(user.username)}
                    className="w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {user.username}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Online
                          </span>
                        </div>
                      </div>
                      <div className="text-blue-600 dark:text-blue-400">
                        💬
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DMList
