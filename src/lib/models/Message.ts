import { ObjectId } from 'mongodb'

export interface MessageDocument {
  _id?: ObjectId
  id: string
  username: string
  text: string
  room: string
  timestamp: Date
  type?: 'user' | 'system' // System messages for join/leave events
  reactions?: Array<{
    emoji: string
    users: string[]
    count: number
  }>
  edited?: boolean
  editedAt?: Date
  deleted?: boolean
  deletedAt?: Date
  editHistory?: Array<{
    text: string
    editedAt: Date
  }>
}

export interface UserDocument {
  _id?: ObjectId
  id: string
  username: string
  room: string
  joinedAt: Date
  lastSeen: Date
  isTyping?: boolean
}

export interface RoomDocument {
  _id?: ObjectId
  id: string
  name: string
  description?: string
  userCount: number
  createdAt: Date
  isActive: boolean
  lastActivity: Date
  isDM?: boolean
  participants?: string[] // For DM rooms: list of usernames
}

export interface TypingStatusDocument {
  _id?: ObjectId
  username: string
  room: string
  isTyping: boolean
  timestamp: Date
}
