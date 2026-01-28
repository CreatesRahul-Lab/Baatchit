'use client'

import { useState } from 'react'
import { useChat } from '@/contexts/ChatContext'

interface ModerationPanelProps {
  targetUser: {
    username: string
    role?: string
    isMuted?: boolean
  }
  onClose: () => void
}

const ModerationPanel: React.FC<ModerationPanelProps> = ({ targetUser, onClose }) => {
  const { currentRoom, username } = useChat()
  const [loading, setLoading] = useState(false)
  const [muteDuration, setMuteDuration] = useState(1)

  const handleAction = async (action: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          room: currentRoom,
          username,
          targetUsername: targetUser.username,
          moderator: username,
          duration: muteDuration,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(data.message)
        onClose()
      } else {
        alert(data.error || 'Action failed')
      }
    } catch (error) {
      console.error('Moderation action failed:', error)
      alert('Failed to perform action')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Moderate User: {targetUser.username}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {/* Kick Button */}
          <button
            onClick={() => handleAction('kick')}
            disabled={loading}
            className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            🚪 Kick from Room
          </button>

          {/* Ban Button */}
          <button
            onClick={() => handleAction('ban')}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            🚫 Ban User
          </button>

          {/* Mute/Unmute */}
          {targetUser.isMuted ? (
            <button
              onClick={() => handleAction('unmute')}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              🔊 Unmute User
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Mute Duration (hours):</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={muteDuration}
                  onChange={(e) => setMuteDuration(parseInt(e.target.value) || 1)}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <button
                onClick={() => handleAction('mute')}
                disabled={loading}
                className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                🔇 Mute User
              </button>
            </div>
          )}

          {/* Promote/Demote */}
          {targetUser.role === 'moderator' ? (
            <button
              onClick={() => handleAction('demote')}
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ⬇️ Demote to User
            </button>
          ) : (
            <button
              onClick={() => handleAction('promote')}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              ⬆️ Promote to Moderator
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          disabled={loading}
          className="w-full mt-4 px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default ModerationPanel
