import useSWR from 'swr'
import { useCallback } from 'react'
import type { Message, User, Room } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Hook to fetch and manage messages
export function useMessages(roomId: string | null) {
  const { data, error, mutate, isLoading } = useSWR<Message[]>(
    roomId ? `/api/messages?room=${roomId}&limit=100` : null,
    fetcher,
    {
      refreshInterval: 2000, // Poll every 2 seconds
      revalidateOnFocus: true,
      dedupingInterval: 1000,
    }
  )

  const sendMessage = useCallback(
    async (text: string, username: string) => {
      if (!roomId || !text.trim() || !username) return

      // Optimistic update
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        username,
        text,
        room: roomId,
        timestamp: new Date(),
        reactions: []
      }

      mutate([...(data || []), optimisticMessage], false)

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, username, room: roomId }),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        // Revalidate to get the actual message from server
        mutate()
      } catch (error) {
        console.error('Error sending message:', error)
        // Revert optimistic update on error
        mutate()
        throw error
      }
    },
    [roomId, data, mutate]
  )

  const addReaction = useCallback(
    async (messageId: string, emoji: string, username: string) => {
      if (!roomId) return

      try {
        const response = await fetch('/api/messages/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, emoji, username, room: roomId }),
        })

        if (!response.ok) {
          throw new Error('Failed to add reaction')
        }

        // Revalidate messages
        mutate()
      } catch (error) {
        console.error('Error adding reaction:', error)
        throw error
      }
    },
    [roomId, mutate]
  )

  return {
    messages: data || [],
    isLoading,
    isError: error,
    sendMessage,
    addReaction,
    mutate
  }
}

// Hook to fetch online users in a room
export function useRoomUsers(roomId: string | null) {
  const { data, error, mutate } = useSWR<User[]>(
    roomId ? `/api/users?room=${roomId}` : null,
    fetcher,
    {
      refreshInterval: 3000, // Poll every 3 seconds
      revalidateOnFocus: true,
    }
  )

  const updatePresence = useCallback(
    async (username: string) => {
      if (!roomId || !username) return

      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, room: roomId }),
        })
        mutate()
      } catch (error) {
        console.error('Error updating presence:', error)
      }
    },
    [roomId, mutate]
  )

  const leaveRoom = useCallback(
    async (username: string) => {
      if (!roomId || !username) return

      try {
        await fetch(`/api/users?username=${username}&room=${roomId}`, {
          method: 'DELETE',
        })
        mutate()
      } catch (error) {
        console.error('Error leaving room:', error)
      }
    },
    [roomId, mutate]
  )

  return {
    users: data || [],
    isError: error,
    updatePresence,
    leaveRoom,
    mutate
  }
}

// Hook to fetch available rooms
export function useRooms() {
  const { data, error, mutate } = useSWR<Room[]>('/api/rooms', fetcher, {
    refreshInterval: 5000, // Poll every 5 seconds
    revalidateOnFocus: true,
  })

  const createRoom = useCallback(
    async (name: string, description?: string) => {
      try {
        const response = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create room')
        }

        mutate()
        return await response.json()
      } catch (error) {
        console.error('Error creating room:', error)
        throw error
      }
    },
    [mutate]
  )

  return {
    rooms: data || [],
    isLoading: !error && !data,
    isError: error,
    createRoom,
    mutate
  }
}

// Hook to get typing users
export function useTypingUsers(roomId: string | null) {
  const { data, error } = useSWR<string[]>(
    roomId ? `/api/typing?room=${roomId}` : null,
    fetcher,
    {
      refreshInterval: 1000, // Poll every 1 second for typing
      revalidateOnFocus: false,
      dedupingInterval: 500,
    }
  )

  const updateTypingStatus = useCallback(
    async (username: string, isTyping: boolean) => {
      if (!roomId || !username) return

      try {
        await fetch('/api/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, room: roomId, isTyping }),
        })
      } catch (error) {
        console.error('Error updating typing status:', error)
      }
    },
    [roomId]
  )

  return {
    typingUsers: data || [],
    isError: error,
    updateTypingStatus
  }
}
