'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { 
  ChatContextType, 
  User, 
  Message, 
  Room,
  ServerToClientEvents,
  ClientToServerEvents
} from '@/lib/types'

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
  // State management
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const [username, setUsername] = useState<string>('')
  const [currentRoom, setCurrentRoom] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Initialize socket connection
  useEffect(() => {
    let isMounted = true
    let newSocket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
    
    // Initialize Socket.io by calling the API endpoint first
    const initSocket = async () => {
      try {
        await fetch('/api/socket')
      } catch (error) {
        console.error('Failed to initialize socket endpoint:', error)
      }
      
      if (!isMounted) return
      
      newSocket = io('http://localhost:3000', {
        path: '/api/socket',
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000,
        forceNew: true,
      })

      setSocket(newSocket)

      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket connected')
        setIsConnected(true)
        setConnectionError(null)
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error)
        setConnectionError('Failed to connect to server')
        setIsConnected(false)
      })

      // Chat events
      newSocket.on('message', (message: Message) => {
        setMessages(prev => [...prev, message])
      })

      newSocket.on('userJoined', (user: User) => {
        setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), user])
      })

      newSocket.on('userLeft', ({ username: leftUsername }: { username: string }) => {
        setOnlineUsers(prev => prev.filter(u => u.username !== leftUsername))
        setTypingUsers(prev => prev.filter(u => u !== leftUsername))
      })

      newSocket.on('userTyping', ({ username: typingUsername, isTyping }: { username: string; isTyping: boolean }) => {
        setTypingUsers(prev => {
          if (isTyping && !prev.includes(typingUsername)) {
            return [...prev, typingUsername]
          } else if (!isTyping) {
            return prev.filter(u => u !== typingUsername)
          }
          return prev
        })
      })

      newSocket.on('roomUsers', (users: User[]) => {
        setOnlineUsers(users)
      })

      newSocket.on('roomList', (rooms: Room[]) => {
        setAvailableRooms(rooms)
      })

      newSocket.on('messageReaction', ({ messageId, emoji, username: reactUsername }: { messageId: string; emoji: string; username: string }) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || []
            const existingReaction = reactions.find(r => r.emoji === emoji)
            
            if (existingReaction) {
              if (existingReaction.users.includes(reactUsername)) {
                // Remove reaction
                existingReaction.users = existingReaction.users.filter(u => u !== reactUsername)
                existingReaction.count = existingReaction.users.length
                
                if (existingReaction.count === 0) {
                  return {
                    ...msg,
                    reactions: reactions.filter(r => r.emoji !== emoji)
                  }
                }
              } else {
                // Add reaction
                existingReaction.users.push(reactUsername)
                existingReaction.count = existingReaction.users.length
              }
            } else {
              // New reaction
              reactions.push({
                emoji,
                users: [reactUsername],
                count: 1
              })
            }
            
            return { ...msg, reactions: [...reactions] }
          }
          return msg
        }))
      })

      newSocket.on('error', (error: string) => {
        setConnectionError(error)
      })
    }
    
    initSocket()

    return () => {
      isMounted = false
      if (newSocket) {
        newSocket.disconnect()
      }
    }
  }, [])

  // Chat actions
  const joinRoom = useCallback((room: string, user: string) => {
    if (socket && room && user) {
      setCurrentRoom(room)
      setUsername(user)
      setMessages([]) // Clear previous messages
      socket.emit('joinRoom', { username: user, room })
    }
  }, [socket])

  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.emit('leaveRoom')
      setCurrentRoom('')
      setUsername('')
      setMessages([])
      setOnlineUsers([])
      setTypingUsers([])
      // Redirect to homepage instead of disconnecting socket
      // This allows the socket to remain connected for rejoining
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }, [socket])

  const sendMessage = useCallback((text: string) => {
    if (socket && currentRoom && text.trim()) {
      socket.emit('sendMessage', { text, room: currentRoom })
    }
  }, [socket, currentRoom])

  const startTyping = useCallback(() => {
    if (socket && currentRoom) {
      socket.emit('typing', { isTyping: true, room: currentRoom })
    }
  }, [socket, currentRoom])

  const stopTyping = useCallback(() => {
    if (socket && currentRoom) {
      socket.emit('typing', { isTyping: false, room: currentRoom })
    }
  }, [socket, currentRoom])

  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (socket && currentRoom) {
      socket.emit('addReaction', { messageId, emoji, room: currentRoom })
    }
  }, [socket, currentRoom])

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const value: ChatContextType = {
    username,
    setUsername,
    currentRoom,
    setCurrentRoom,
    availableRooms,
    messages,
    addMessage,
    onlineUsers,
    typingUsers,
    isConnected,
    connectionError,
    sendMessage,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    addReaction,
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}