import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { TypingStatusDocument } from '@/lib/models/Message'

// GET /api/typing?room={roomName}
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const room = searchParams.get('room')

    if (!room) {
      return NextResponse.json({ error: 'Room parameter is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const typingCollection = db.collection<TypingStatusDocument>('typing_status')

    // Get typing statuses updated in the last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000)

    const typingUsers = await typingCollection
      .find({
        room,
        isTyping: true,
        timestamp: { $gte: fiveSecondsAgo }
      })
      .toArray()

    return NextResponse.json(typingUsers.map(t => t.username))
  } catch (error) {
    console.error('Error fetching typing status:', error)
    return NextResponse.json({ error: 'Failed to fetch typing status' }, { status: 500 })
  }
}

// POST /api/typing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, room, isTyping } = body

    if (!username || !room || typeof isTyping !== 'boolean') {
      return NextResponse.json(
        { error: 'Username, room, and isTyping are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const typingCollection = db.collection<TypingStatusDocument>('typing_status')

    if (isTyping) {
      // Update or insert typing status
      await typingCollection.updateOne(
        { username, room },
        {
          $set: {
            isTyping: true,
            timestamp: new Date()
          },
          $setOnInsert: {
            username,
            room
          }
        },
        { upsert: true }
      )
    } else {
      // Remove typing status
      await typingCollection.deleteOne({ username, room })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating typing status:', error)
    return NextResponse.json({ error: 'Failed to update typing status' }, { status: 500 })
  }
}
