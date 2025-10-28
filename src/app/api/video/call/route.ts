import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { VideoCallDocument } from '@/lib/models/VideoCall'

// POST /api/video/call - Start a new video call
export async function POST(req: NextRequest) {
  try {
    const { roomId, username } = await req.json()

    if (!roomId || !username) {
      return NextResponse.json(
        { error: 'Room ID and username are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const videoCallsCollection = db.collection<VideoCallDocument>('video_calls')
    const messagesCollection = db.collection('messages')

    // Check if there's already an active call in this room
    const existingCall = await videoCallsCollection.findOne({
      roomId,
      status: { $in: ['waiting', 'active'] }
    })

    if (existingCall) {
      return NextResponse.json(
        { error: 'A video call is already active in this room', call: existingCall },
        { status: 409 }
      )
    }

    // Create new video call
    const channelName = `${roomId}-${Date.now()}`
    const videoCall: VideoCallDocument = {
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      channelName,
      startedBy: username,
      participants: [username],
      status: 'waiting',
      startedAt: new Date(),
    }

    await videoCallsCollection.insertOne(videoCall)

    // Create system message
    const systemMessage = {
      id: `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username: 'System',
      text: `🎥 ${username} started a video call`,
      room: roomId,
      timestamp: new Date(),
      type: 'system',
      reactions: []
    }

    await messagesCollection.insertOne(systemMessage)

    return NextResponse.json(videoCall, { status: 201 })
  } catch (error) {
    console.error('Error creating video call:', error)
    return NextResponse.json(
      { error: 'Failed to create video call' },
      { status: 500 }
    )
  }
}

// GET /api/video/call?roomId={roomId} - Get active call for a room
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const videoCallsCollection = db.collection<VideoCallDocument>('video_calls')

    const activeCall = await videoCallsCollection.findOne({
      roomId,
      status: { $in: ['waiting', 'active'] }
    })

    if (!activeCall) {
      return NextResponse.json({ call: null })
    }

    return NextResponse.json({ call: activeCall })
  } catch (error) {
    console.error('Error fetching video call:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video call' },
      { status: 500 }
    )
  }
}

// PATCH /api/video/call - Update call status or participants
export async function PATCH(req: NextRequest) {
  try {
    const { callId, action, username } = await req.json()

    if (!callId || !action) {
      return NextResponse.json(
        { error: 'Call ID and action are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const videoCallsCollection = db.collection<VideoCallDocument>('video_calls')

    let update: any = {}

    switch (action) {
      case 'join':
        if (!username) {
          return NextResponse.json({ error: 'Username required for join' }, { status: 400 })
        }
        update = {
          $addToSet: { participants: username },
          $set: { status: 'active' }
        }
        break

      case 'leave':
        if (!username) {
          return NextResponse.json({ error: 'Username required for leave' }, { status: 400 })
        }
        update = {
          $pull: { participants: username }
        }
        break

      case 'end':
        const call = await videoCallsCollection.findOne({ id: callId })
        const duration = call ? Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000) : 0
        
        update = {
          $set: {
            status: 'ended',
            endedAt: new Date(),
            duration
          }
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const result = await videoCallsCollection.findOneAndUpdate(
      { id: callId },
      update,
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating video call:', error)
    return NextResponse.json(
      { error: 'Failed to update video call' },
      { status: 500 }
    )
  }
}
