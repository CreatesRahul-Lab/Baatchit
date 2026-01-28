import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// Create or get existing DM room
export async function POST(request: NextRequest) {
  try {
    const { user1, user2 } = await request.json()

    if (!user1 || !user2) {
      return NextResponse.json(
        { error: 'Both usernames are required' },
        { status: 400 }
      )
    }

    if (user1 === user2) {
      return NextResponse.json(
        { error: 'Cannot create DM with yourself' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')

    // Sort usernames to ensure consistent room ID
    const participants = [user1, user2].sort()
    const roomId = `dm_${participants[0]}_${participants[1]}`
    const roomName = `${participants[0]} & ${participants[1]}`

    // Check if DM room already exists
    let room = await db.collection('rooms').findOne({ id: roomId })

    if (!room) {
      // Create new DM room
      const newRoom = {
        id: roomId,
        name: roomName,
        description: 'Direct Message',
        userCount: 0,
        createdAt: new Date(),
        isActive: true,
        lastActivity: new Date(),
        isDM: true,
        participants: participants,
      }

      const result = await db.collection('rooms').insertOne(newRoom)
      room = { ...newRoom, _id: result.insertedId }
    } else {
      // Update lastActivity
      await db.collection('rooms').updateOne(
        { id: roomId },
        { $set: { lastActivity: new Date() } }
      )
    }

    if (!room) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve room' },
        { status: 500 }
      )
    }

    return NextResponse.json({ room: {
      id: room.id,
      name: room.name,
      description: room.description,
      userCount: room.userCount,
      createdAt: room.createdAt,
      isActive: room.isActive,
      isDM: room.isDM,
      participants: room.participants,
    }})
  } catch (error) {
    console.error('Error creating DM:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get all DM rooms for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')

    // Find all DM rooms where user is a participant
    const rooms = await db
      .collection('rooms')
      .find({
        isDM: true,
        participants: username,
      })
      .sort({ lastActivity: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({ 
      rooms: rooms.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        userCount: room.userCount,
        createdAt: room.createdAt,
        isActive: room.isActive,
        isDM: room.isDM,
        participants: room.participants,
        lastActivity: room.lastActivity,
      }))
    })
  } catch (error) {
    console.error('Error fetching DMs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
