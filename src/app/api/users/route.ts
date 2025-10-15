import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { UserDocument } from '@/lib/models/Message'

// GET /api/users?room={roomName}
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const room = searchParams.get('room')

    if (!room) {
      return NextResponse.json({ error: 'Room parameter is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const usersCollection = db.collection<UserDocument>('users')

    // Get users who were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const users = await usersCollection
      .find({
        room,
        lastSeen: { $gte: fiveMinutesAgo }
      })
      .sort({ joinedAt: 1 })
      .toArray()

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/users (Join room / Update presence)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, room } = body

    if (!username || !room) {
      return NextResponse.json(
        { error: 'Username and room are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const usersCollection = db.collection<UserDocument>('users')
    const messagesCollection = db.collection('messages')

    const userId = `${username}-${room}`
    
    // Check if this is a new user joining (not just updating presence)
    const existingUser = await usersCollection.findOne({ id: userId })
    const isNewJoin = !existingUser || 
      (existingUser.lastSeen && new Date().getTime() - new Date(existingUser.lastSeen).getTime() > 5 * 60 * 1000)

    const user: UserDocument = {
      id: userId,
      username,
      room,
      joinedAt: new Date(),
      lastSeen: new Date(),
      isTyping: false
    }

    // Upsert user (insert if not exists, update if exists)
    await usersCollection.updateOne(
      { id: user.id },
      {
        $set: { lastSeen: new Date(), room },
        $setOnInsert: { id: user.id, username, joinedAt: new Date(), isTyping: false }
      },
      { upsert: true }
    )

    // Create system message for user joining (only for new joins)
    if (isNewJoin) {
      const systemMessage = {
        id: `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: 'System',
        text: `${username} joined the room`,
        room,
        timestamp: new Date(),
        type: 'system',
        reactions: []
      }

      await messagesCollection.insertOne(systemMessage)
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/users?username={username}&room={room}
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')
    const room = searchParams.get('room')

    if (!username || !room) {
      return NextResponse.json(
        { error: 'Username and room are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const usersCollection = db.collection<UserDocument>('users')
    const messagesCollection = db.collection('messages')

    // Delete the user
    await usersCollection.deleteOne({ id: `${username}-${room}` })

    // Create system message for user leaving
    const systemMessage = {
      id: `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: 'System',
      text: `${username} left the room`,
      room,
      timestamp: new Date(),
      type: 'system',
      reactions: []
    }

    await messagesCollection.insertOne(systemMessage)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing user:', error)
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 })
  }
}
