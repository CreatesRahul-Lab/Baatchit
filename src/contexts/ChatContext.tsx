'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ChatContextType, User, Message, Room } from '@/lib/types'
import { useMessages, useRoomUsers, useRooms, useTypingUsers } from '@/lib/hooks/useChat'

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: React.ReactNode
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // User and room state
  const [username, setUsername] = useState<string>('')
  const [currentRoom, setCurrentRoom] = useState<string>('')
  const [joinedAt, setJoinedAt] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(true) // Always connected with polling
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Use SWR hooks for data fetching
  const { messages, sendMessage: sendMsg, addReaction: addReact, isError: messagesError } = useMessages(currentRoom || null, joinedAt)
  const { users, updatePresence, leaveRoom: leaveRoomApi } = useRoomUsers(currentRoom || null)
  const { rooms } = useRooms()
  const { typingUsers, updateTypingStatus } = useTypingUsers(currentRoom || null)

  // Handle connection errors
  useEffect(() => {
    if (messagesError) {
      setConnectionError('Failed to connect to server')
      setIsConnected(false)
    } else {
      setConnectionError(null)
      setIsConnected(true)
    }
  }, [messagesError])

  // Update user presence periodically when in a room
  useEffect(() => {
    if (currentRoom && username) {
      // Initial presence update
      updatePresence(username)

      // Set up interval to update presence every 30 seconds
      const presenceInterval = setInterval(() => {
        updatePresence(username)
      }, 30000)

      return () => {
        clearInterval(presenceInterval)
      }
    }
  }, [currentRoom, username, updatePresence])

  // Join room
  const joinRoom = useCallback(
    async (room: string, user: string) => {
      if (!room || !user) return

      try {
        // Set username immediately so UI knows who is joining
        setUsername(user)

        // Register user in the room and get the join timestamp
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, room }),
        })

        if (!res.ok) {
          throw new Error('Failed to join room')
        }

        const userDoc = await res.json()
        // Save join timestamp so we only fetch fresh messages
        if (userDoc?.joinedAt) {
          setJoinedAt(new Date(userDoc.joinedAt))
        } else {
          setJoinedAt(new Date())
        }

        // Only set current room after we have the joinedAt to avoid fetching history
        setCurrentRoom(room)

        setConnectionError(null)
      } catch (error) {
        console.error('Error joining room:', error)
        setConnectionError('Failed to join room')
      }
    },
    []
  )

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (currentRoom && username) {
      try {
        await leaveRoomApi(username)
        
        // Clear typing status
        await updateTypingStatus(username, false)

  setCurrentRoom('')
  setUsername('')
  setJoinedAt(null)
        
        // Redirect to home
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      } catch (error) {
        console.error('Error leaving room:', error)
      }
    }
  }, [currentRoom, username, leaveRoomApi, updateTypingStatus])

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!currentRoom || !username || !text.trim()) return

      try {
        await sendMsg(text, username)
        // Stop typing when message is sent
        await updateTypingStatus(username, false)
      } catch (error) {
        console.error('Error sending message:', error)
        setConnectionError('Failed to send message')
      }
    },
    [currentRoom, username, sendMsg, updateTypingStatus]
  )

  // Typing indicators
  const startTyping = useCallback(async () => {
    if (currentRoom && username) {
      await updateTypingStatus(username, true)
    }
  }, [currentRoom, username, updateTypingStatus])

  const stopTyping = useCallback(async () => {
    if (currentRoom && username) {
      await updateTypingStatus(username, false)
    }
  }, [currentRoom, username, updateTypingStatus])

  // Add reaction
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!currentRoom || !username) return

      try {
        await addReact(messageId, emoji, username)
      } catch (error) {
        console.error('Error adding reaction:', error)
      }
    },
    [currentRoom, username, addReact]
  )

  // Add message (for compatibility)
  const addMessage = useCallback((message: Message) => {
    // This is handled automatically by SWR polling
    console.log('Message added:', message)
  }, [])

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      if (!currentRoom || !username) return

      try {
        const response = await fetch(`/api/messages/${messageId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: newText, username }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to edit message')
        }

        // Trigger re-fetch
        await fetch(`/api/messages?room=${currentRoom}`)
      } catch (error) {
        console.error('Error editing message:', error)
        throw error
      }
    },
    [currentRoom, username]
  )

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!currentRoom || !username) return

      try {
        const response = await fetch(`/api/messages/${messageId}?username=${username}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete message')
        }

        // Trigger re-fetch
        await fetch(`/api/messages?room=${currentRoom}`)
      } catch (error) {
        console.error('Error deleting message:', error)
        throw error
      }
    },
    [currentRoom, username]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRoom && username) {
        // Cleanup user presence
        fetch(`/api/users?username=${username}&room=${currentRoom}`, {
          method: 'DELETE',
          keepalive: true, // Important for cleanup on page unload
        }).catch(console.error)
      }
    }
  }, [currentRoom, username])

  const value: ChatContextType = {
    username,
    setUsername,
    currentRoom,
    setCurrentRoom,
    availableRooms: rooms,
    messages,
    addMessage,
    onlineUsers: users,
    typingUsers: typingUsers.filter(u => u !== username), // Exclude current user
    isConnected,
    connectionError,
    sendMessage,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    addReaction,
    editMessage,
    deleteMessage,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
