'use client'

import { useState, useEffect } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useSession, signIn, signOut } from 'next-auth/react'
import NotificationSettings from './NotificationSettings'

const JoinRoom = () => {
  const { data: session } = useSession()
  const [username, setUsername] = useState('')
  const [roomName, setRoomName] = useState('')
  const [showCustomRoom, setShowCustomRoom] = useState(false)
  
  const { joinRoom, availableRooms, isConnected, connectionError } = useChat()

  // Auto-fill username from Google account
  useEffect(() => {
    if (session?.user?.name && !username) {
      setUsername(session.user.name.replace(/\s+/g, '_'))
    }
  }, [session, username])

  const predefinedRooms = [
    { name: 'general', description: 'General discussion for everyone' },
    { name: 'tech', description: 'Technology and programming talks' },
    { name: 'random', description: 'Random conversations and fun' },
    { name: 'gaming', description: 'Gaming discussions and reviews' },
    { name: 'music', description: 'Share and discuss music' },
  ]

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      alert('Please enter a username')
      return
    }
    
    if (!roomName.trim()) {
      alert('Please select or enter a room name')
      return
    }

    // Validate username (alphanumeric and some special chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
    if (!usernameRegex.test(username)) {
      alert('Username must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores')
      return
    }

    // Validate room name
    const roomRegex = /^[a-zA-Z0-9_-]{3,30}$/
    if (!roomRegex.test(roomName)) {
      alert('Room name must be 3-30 characters long and contain only letters, numbers, hyphens, and underscores')
      return
    }

    joinRoom(roomName.toLowerCase(), username)
  }

  const handlePredefinedRoom = (room: string) => {
    setRoomName(room)
    setShowCustomRoom(false)
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {connectionError ? 'Connection Failed' : 'Connecting to server...'}
          </h3>
          {connectionError && (
            <p className="text-red-500 mt-2">{connectionError}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Join a Chat Room</h2>
        <p className="text-gray-600 dark:text-gray-300">Choose your username and select a room to start chatting</p>
      </div>

      {/* Notification Settings */}
      <div className="mb-6">
        <NotificationSettings />
      </div>

      {/* Google Sign-in Section */}
      {!session ? (
        <div className="mb-6">
          <button
            onClick={() => signIn('google')}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 transition-all font-medium shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue as guest</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            {session.user?.image && (
              <img src={session.user.image} alt="Profile" className="w-10 h-10 rounded-full" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-800">{session.user?.name}</p>
              <p className="text-xs text-gray-600">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-xs text-red-600 hover:text-red-800 underline"
          >
            Sign out
          </button>
        </div>
      )}

      <form onSubmit={handleJoinRoom} className="space-y-4">
        {/* Username Input */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
            maxLength={20}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">3-20 characters, letters, numbers, hyphens, and underscores only</p>
        </div>

        {/* Room Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Room
          </label>
          
          {/* Predefined Rooms */}
          <div className="grid grid-cols-1 gap-2 mb-3">
            {predefinedRooms.map((room) => (
              <button
                key={room.name}
                type="button"
                onClick={() => handlePredefinedRoom(room.name)}
                className={`text-left p-3 rounded-md border transition-colors ${
                  roomName === room.name
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-medium dark:text-gray-200">#{room.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{room.description}</div>
              </button>
            ))}
          </div>

          {/* Custom Room Toggle */}
          <button
            type="button"
            onClick={() => setShowCustomRoom(!showCustomRoom)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showCustomRoom ? 'Hide custom room' : 'Create or join custom room'}
          </button>

          {/* Custom Room Input */}
          {showCustomRoom && (
            <div className="mt-3">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter custom room name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                maxLength={30}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">3-30 characters, letters, numbers, hyphens, and underscores only</p>
            </div>
          )}
        </div>

        {/* Join Button */}
        <button
          type="submit"
          disabled={!username.trim() || !roomName.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Join Room
        </button>
      </form>

      {/* Available Rooms Info */}
      {availableRooms.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Rooms</h3>
          <div className="space-y-1">
            {availableRooms.slice(0, 5).map((room) => (
              <div key={room.id} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">#{room.name}</span>
                <span className="text-gray-400 dark:text-gray-500">{room.userCount} users</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default JoinRoom