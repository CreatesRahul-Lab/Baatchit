export interface User {
  id: string
  username: string
  room: string
  joinedAt: Date
  isTyping?: boolean
  role?: 'admin' | 'moderator' | 'user'
  isBanned?: boolean
  isMuted?: boolean
  mutedUntil?: Date
}

export interface Message {
  id: string
  username: string
  text: string
  room: string
  timestamp: Date
  reactions?: Reaction[]
  type?: 'user' | 'system' // System messages for join/leave events
  edited?: boolean
  editedAt?: Date
  deleted?: boolean
  deletedAt?: Date
  editHistory?: Array<{
    text: string
    editedAt: Date
  }>
}

export interface Reaction {
  emoji: string
  users: string[]
  count: number
}

export interface Room {
  id: string
  name: string
  description?: string
  userCount: number
  createdAt: Date
  isActive: boolean
  isDM?: boolean
  participants?: string[] // For DM rooms: list of usernames
  owner?: string // Room owner username
  moderators?: string[] // List of moderator usernames
  bannedUsers?: string[] // List of banned usernames
}

export interface ChatContextType {
  // User state
  username: string
  setUsername: (username: string) => void
  
  // Room state
  currentRoom: string
  setCurrentRoom: (room: string) => void
  availableRooms: Room[]
  
  // Messages state
  messages: Message[]
  addMessage: (message: Message) => void
  
  // Users state
  onlineUsers: User[]
  typingUsers: string[]
  
  // Connection state
  isConnected: boolean
  connectionError: string | null
  
  // Socket actions
  sendMessage: (text: string) => void
  joinRoom: (room: string, username: string) => void
  leaveRoom: () => void
  startTyping: () => void
  stopTyping: () => void
  addReaction: (messageId: string, emoji: string) => void
  editMessage: (messageId: string, newText: string) => void
  deleteMessage: (messageId: string) => void
}

export interface ServerToClientEvents {
  message: (message: Message) => void
  userJoined: (user: User) => void
  userLeft: (user: { username: string; room: string }) => void
  userTyping: (data: { username: string; isTyping: boolean }) => void
  roomUsers: (users: User[]) => void
  roomList: (rooms: Room[]) => void
  messageReaction: (data: { messageId: string; emoji: string; username: string }) => void
  error: (error: string) => void
}

export interface ClientToServerEvents {
  joinRoom: (data: { username: string; room: string }) => void
  leaveRoom: () => void
  sendMessage: (data: { text: string; room: string }) => void
  typing: (data: { isTyping: boolean; room: string }) => void
  addReaction: (data: { messageId: string; emoji: string; room: string }) => void
}

export interface SocketData {
  username: string
  room: string
}

// Next.js API types
import { NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { Server as NetServer, Socket } from 'net'

export interface NextApiResponseServerIO extends NextApiResponse {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}