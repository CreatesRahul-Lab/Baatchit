import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { MessageDocument } from '@/lib/models/Message'

// GET /api/messages?room={roomName}&limit={number}&before={timestamp}
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const room = searchParams.get('room')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')

    if (!room) {
      return NextResponse.json({ error: 'Room parameter is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const messagesCollection = db.collection<MessageDocument>('messages')

    // Build query
    const query: any = { room }
    if (before) {
      query.timestamp = { $lt: new Date(before) }
    }

    // Fetch messages
    const messages = await messagesCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()

    // Reverse to get chronological order
    const sortedMessages = messages.reverse()

    return NextResponse.json(sortedMessages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, username, room } = body

    if (!text || !username || !room) {
      return NextResponse.json(
        { error: 'Text, username, and room are required' },
        { status: 400 }
      )
    }

    // Basic profanity filter
    const Filter = require('bad-words')
    const filter = new Filter()
    const filteredText = filter.clean(text)

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const messagesCollection = db.collection<MessageDocument>('messages')

    const message: MessageDocument = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      text: filteredText,
      room,
      timestamp: new Date(),
      type: 'user', // Explicitly mark as user message
      reactions: []
    }

    await messagesCollection.insertOne(message)

    // Update room's last activity
    const roomsCollection = db.collection('rooms')
    await roomsCollection.updateOne(
      { name: room },
      { 
        $set: { lastActivity: new Date() },
        $setOnInsert: { 
          id: room,
          name: room,
          createdAt: new Date(),
          isActive: true,
          userCount: 0
        }
      },
      { upsert: true }
    )

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}

// DELETE /api/messages?id={messageId}
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('id')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const messagesCollection = db.collection<MessageDocument>('messages')

    const result = await messagesCollection.deleteOne({ id: messageId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
