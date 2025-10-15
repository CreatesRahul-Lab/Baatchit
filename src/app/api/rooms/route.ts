import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { RoomDocument } from '@/lib/models/Message'

// GET /api/rooms
export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const roomsCollection = db.collection<RoomDocument>('rooms')
    const usersCollection = db.collection('users')

    // Get all rooms
    const rooms = await roomsCollection
      .find({ isActive: true })
      .sort({ lastActivity: -1 })
      .toArray()

    // Update user count for each room
    const roomsWithUserCount = await Promise.all(
      rooms.map(async (room) => {
        const userCount = await usersCollection.countDocuments({
          room: room.name,
          lastSeen: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Active in last 5 minutes
        })

        return {
          ...room,
          userCount
        }
      })
    )

    return NextResponse.json(roomsWithUserCount)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

// POST /api/rooms
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const roomsCollection = db.collection<RoomDocument>('rooms')

    // Check if room already exists
    const existingRoom = await roomsCollection.findOne({ name })

    if (existingRoom) {
      return NextResponse.json({ error: 'Room already exists' }, { status: 409 })
    }

    const room: RoomDocument = {
      id: name,
      name,
      description,
      userCount: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    }

    await roomsCollection.insertOne(room)

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
