const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const { MongoClient } = require('mongodb')
const Filter = require('bad-words')

const app = express()
const server = http.createServer(app)

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(cors())
app.use(express.json())

// Initialize profanity filter
const filter = new Filter()

// MongoDB connection
let db
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/baatein-chat'

MongoClient.connect(mongoUrl)
  .then(client => {
    console.log('Connected to MongoDB')
    db = client.db('baatein-chat')
  })
  .catch(error => {
    console.error('MongoDB connection error:', error)
  })

// In-memory storage for active users and rooms
const activeUsers = new Map()
const activeRooms = new Map()

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9)

const formatUser = (id, username, room) => ({
  id,
  username,
  room,
  joinedAt: new Date(),
  isTyping: false
})

const formatMessage = (username, text, room) => {
  // Ensure text is a string and not null/undefined
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

const getRoomUsers = (room) => {
  return Array.from(activeUsers.values()).filter(user => user.room === room)
}

const updateRoomInfo = (roomName) => {
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

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join room
  socket.on('joinRoom', async ({ username, room }) => {
    try {
      // Validate input
      if (!username || !room) {
        socket.emit('error', 'Username and room are required')
        return
      }

      // Check if username is already taken in the room
      const existingUser = Array.from(activeUsers.values())
        .find(user => user.username.toLowerCase() === username.toLowerCase() && user.room === room)
      
      if (existingUser) {
        socket.emit('error', 'Username already taken in this room')
        return
      }

      // Clean inputs
      const cleanUsername = filter.clean(username.trim())
      const cleanRoom = room.trim().toLowerCase()

      // Create user object
      const user = formatUser(socket.id, cleanUsername, cleanRoom)
      activeUsers.set(socket.id, user)

      // Join socket room
      socket.join(cleanRoom)

      // Update room info
      updateRoomInfo(cleanRoom)

      // Send welcome message to user
      socket.emit('message', formatMessage('System', `Welcome to room #${cleanRoom}!`, cleanRoom))

      // Broadcast to room that user joined
      socket.to(cleanRoom).emit('userJoined', user)
      socket.to(cleanRoom).emit('message', formatMessage('System', `${cleanUsername} joined the room`, cleanRoom))

      // Send room users to all users in room
      io.to(cleanRoom).emit('roomUsers', getRoomUsers(cleanRoom))

      // Send updated room list to all users
      const roomList = Array.from(activeRooms.values()).filter(room => room.isActive)
      io.emit('roomList', roomList)

      // Save user join to database
      if (db) {
        await db.collection('user_sessions').insertOne({
          userId: socket.id,
          username: cleanUsername,
          room: cleanRoom,
          joinedAt: new Date(),
          action: 'join'
        })
      }

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

      // Create and broadcast message
      const message = formatMessage(user.username, text.trim(), room)
      io.to(room).emit('message', message)

      // Save message to database
      if (db) {
        await db.collection('messages').insertOne(message)
      }

    } catch (error) {
      console.error('Send message error:', error)
      socket.emit('error', 'Failed to send message')
    }
  })

  // Handle typing indicators
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

  // Handle message reactions
  socket.on('addReaction', async ({ messageId, emoji, room }) => {
    try {
      const user = activeUsers.get(socket.id)
      
      if (!user) {
        socket.emit('error', 'User not found')
        return
      }

      // Broadcast reaction to room
      io.to(room).emit('messageReaction', {
        messageId,
        emoji,
        username: user.username
      })

      // Update message in database
      if (db) {
        const message = await db.collection('messages').findOne({ id: messageId })
        if (message) {
          const reactions = message.reactions || []
          const existingReaction = reactions.find(r => r.emoji === emoji)
          
          if (existingReaction) {
            if (existingReaction.users.includes(user.username)) {
              // Remove reaction
              existingReaction.users = existingReaction.users.filter(u => u !== user.username)
              existingReaction.count = existingReaction.users.length
              
              if (existingReaction.count === 0) {
                message.reactions = reactions.filter(r => r.emoji !== emoji)
              }
            } else {
              // Add reaction
              existingReaction.users.push(user.username)
              existingReaction.count = existingReaction.users.length
            }
          } else {
            // New reaction
            reactions.push({
              emoji,
              users: [user.username],
              count: 1
            })
          }
          
          await db.collection('messages').updateOne(
            { id: messageId },
            { $set: { reactions: message.reactions } }
          )
        }
      }

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
        // Remove user from active users
        activeUsers.delete(socket.id)

        // Notify room that user left
        socket.to(user.room).emit('userLeft', {
          username: user.username,
          room: user.room
        })

        socket.to(user.room).emit('message', 
          formatMessage('System', `${user.username} left the room`, user.room)
        )

        // Update room users
        io.to(user.room).emit('roomUsers', getRoomUsers(user.room))

        // Update room info
        updateRoomInfo(user.room)

        // Send updated room list
        const roomList = Array.from(activeRooms.values()).filter(room => room.isActive)
        io.emit('roomList', roomList)

        // Save user leave to database
        if (db) {
          await db.collection('user_sessions').insertOne({
            userId: socket.id,
            username: user.username,
            room: user.room,
            leftAt: new Date(),
            action: 'leave'
          })
        }
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

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    activeUsers: activeUsers.size,
    activeRooms: activeRooms.size
  })
})

app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(activeRooms.values()).filter(room => room.isActive)
  res.json(roomList)
})

app.get('/api/messages/:room', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' })
    }

    const { room } = req.params
    const limit = parseInt(req.query.limit) || 50
    
    const messages = await db.collection('messages')
      .find({ room })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
    
    res.json(messages.reverse())
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`)
  console.log(`💾 MongoDB: ${mongoUrl}`)
})