import { ObjectId } from 'mongodb'

export interface VideoCallDocument {
  _id?: ObjectId
  id: string
  roomId: string // Chat room ID
  channelName: string // Agora channel name
  startedBy: string // Username who started the call
  participants: string[] // Array of usernames in call
  status: 'waiting' | 'active' | 'ended'
  startedAt: Date
  endedAt?: Date
  duration?: number // in seconds
}

export interface VideoCallParticipant {
  username: string
  joinedAt: Date
  leftAt?: Date
  uid: number // Agora user ID (numeric)
}
