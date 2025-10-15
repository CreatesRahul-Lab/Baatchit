import { Server as SocketIOServer } from 'socket.io'
import Filter from 'bad-words'
import clientPromise from './mongodb'

const filter = new Filter()

// In-memory storage
const activeUsers = new Map()
const activeRooms = new Map()

// Database helper functions
async function saveMessage(message: any) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    await db.collection('messages').insertOne({
      ...message,
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Error saving message:', error)
  }
}

async function saveUserSession(userId: string, username: string, room: string, action: 'join' | 'leave') {
  try {
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    await db.collection('user_sessions').insertOne({
      userId,
      username,
      room,
      action,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error saving user session:', error)
  }
}

async function getRecentMessages(room: string, limit: number = 50) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const messages = await db.collection('messages')
      .find({ room })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
    return messages.reverse()
  } catch (error) {
    console.error('Error getting messages:', error)
    return []
  }
}

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9)

const formatUser = (id: string, username: string, room: string) => ({
  id,
  username,
  room,
  joinedAt: new Date(),
  isTyping: false
})

const formatMessage = (username: string, text: string, room: string) => {
  const cleanText = text && typeof text === 'string' ? filter.clean(text) : text || ''
  
  return {
    id: generateId(),
    username,
    text: cleanText,
    room,
    timestamp: new Date(),
    reactions: []
  }
}

const getRoomUsers = (room: string) => {
  return Array.from(activeUsers.values()).filter((user: any) => user.room === room)
}

const updateRoomInfo = (roomName: string) => {
  const users = getRoomUsers(roomName)
  const roomInfo = {
    id: roomName,
    name: roomName,
    userCount: users.length,
    createdAt: activeRooms.get(roomName)?.createdAt || new Date(),
    isActive: users.length > 0
  }
  activeRooms.set(roomName, roomInfo)
  return roomInfo
}

export const initializeSocketHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Join room
    socket.on('joinRoom', async ({ username, room }) => {
      try {
        if (!username || !room) {
          socket.emit('error', 'Username and room are required')
          return
        }

        // Check if username is already taken
        const existingUser = Array.from(activeUsers.values())
          .find((user: any) => user.username.toLowerCase() === username.toLowerCase() && user.room === room)
        
        if (existingUser) {
          socket.emit('error', 'Username already taken in this room')
          return
        }

        const cleanUsername = filter.clean(username.trim())
        const cleanRoom = room.trim().toLowerCase()

        const user = formatUser(socket.id, cleanUsername, cleanRoom)
        activeUsers.set(socket.id, user)

        socket.join(cleanRoom)
        updateRoomInfo(cleanRoom)

        // Load recent chat history
        const recentMessages = await getRecentMessages(cleanRoom, 50)
        recentMessages.forEach(msg => {
          socket.emit('message', msg)
        })

        // Save user join to database
        await saveUserSession(socket.id, cleanUsername, cleanRoom, 'join')

        socket.emit('message', formatMessage('System', `Welcome to room #${cleanRoom}!`, cleanRoom))
        socket.to(cleanRoom).emit('userJoined', user)
        socket.to(cleanRoom).emit('message', formatMessage('System', `${cleanUsername} joined the room`, cleanRoom))

        io.to(cleanRoom).emit('roomUsers', getRoomUsers(cleanRoom))

        const roomList = Array.from(activeRooms.values()).filter((room: any) => room.isActive)
        io.emit('roomList', roomList)
      } catch (error) {
        console.error('Join room error:', error)
        socket.emit('error', 'Failed to join room')
      }
    })

    // Handle messages
    socket.on('sendMessage', async ({ text, room }) => {
      try {
        const user = activeUsers.get(socket.id)
        
        if (!user) {
          socket.emit('error', 'User not found')
          return
        }

        if (!text || !text.trim()) {
          socket.emit('error', 'Message cannot be empty')
          return
        }

        if (text.length > 500) {
          socket.emit('error', 'Message too long (max 500 characters)')
          return
        }

        const message = formatMessage(user.username, text.trim(), room)
        
        // Save message to database
        await saveMessage(message)
        
        io.to(room).emit('message', message)
      } catch (error) {
        console.error('Send message error:', error)
        socket.emit('error', 'Failed to send message')
      }
    })

    // Handle typing
    socket.on('typing', ({ isTyping, room }) => {
      const user = activeUsers.get(socket.id)
      
      if (user) {
        user.isTyping = isTyping
        socket.to(room).emit('userTyping', {
          username: user.username,
          isTyping
        })
      }
    })

    // Handle reactions
    socket.on('addReaction', async ({ messageId, emoji, room }) => {
      try {
        const user = activeUsers.get(socket.id)
        
        if (!user) {
          socket.emit('error', 'User not found')
          return
        }

        io.to(room).emit('messageReaction', {
          messageId,
          emoji,
          username: user.username
        })
      } catch (error) {
        console.error('Reaction error:', error)
        socket.emit('error', 'Failed to add reaction')
      }
    })

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        const user = activeUsers.get(socket.id)
        
        if (user) {
          // Save user leave to database
          await saveUserSession(socket.id, user.username, user.room, 'leave')
          
          activeUsers.delete(socket.id)

          socket.to(user.room).emit('userLeft', {
            username: user.username,
            room: user.room
          })

          socket.to(user.room).emit('message', 
            formatMessage('System', `${user.username} left the room`, user.room)
          )

          io.to(user.room).emit('roomUsers', getRoomUsers(user.room))
          updateRoomInfo(user.room)

          const roomList = Array.from(activeRooms.values()).filter((room: any) => room.isActive)
          io.emit('roomList', roomList)
        }
      } catch (error) {
        console.error('Disconnect error:', error)
      }
      
      console.log('User disconnected:', socket.id)
    })

    // Handle leave room
    socket.on('leaveRoom', () => {
      const user = activeUsers.get(socket.id)
      
      if (user) {
        socket.leave(user.room)
        socket.disconnect()
      }
    })
  })
}