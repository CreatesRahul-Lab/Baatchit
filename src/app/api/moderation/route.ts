import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// Kick user from room
export async function POST(request: NextRequest) {
  try {
    const { action, room, username, targetUsername, moderator, duration } = await request.json()

    if (!room || !username || !targetUsername || !moderator) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (targetUsername === moderator) {
      return NextResponse.json(
        { error: 'Cannot moderate yourself' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')

    // Get room to check permissions
    const roomData = await db.collection('rooms').findOne({ id: room })
    
    if (!roomData) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Check if moderator has permissions
    const isModerator = 
      roomData.owner === moderator || 
      roomData.moderators?.includes(moderator)

    if (!isModerator) {
      return NextResponse.json(
        { error: 'You do not have moderation permissions' },
        { status: 403 }
      )
    }

    // Perform the moderation action
    switch (action) {
      case 'kick':
        // Remove user from room
        await db.collection('users').deleteOne({ 
          username: targetUsername, 
          room 
        })
        
        return NextResponse.json({ 
          success: true,
          message: `${targetUsername} has been kicked from the room` 
        })

      case 'ban':
        // Add to banned list
        await db.collection('rooms').updateOne(
          { id: room },
          { 
            $addToSet: { bannedUsers: targetUsername } 
          }
        )
        
        // Remove from room
        await db.collection('users').deleteOne({ 
          username: targetUsername, 
          room 
        })
        
        return NextResponse.json({ 
          success: true,
          message: `${targetUsername} has been banned from the room` 
        })

      case 'mute':
        // Set mute until timestamp
        const muteUntil = new Date(Date.now() + (duration || 60) * 60 * 1000) // default 1 hour
        
        await db.collection('users').updateOne(
          { username: targetUsername, room },
          { 
            $set: { 
              isMuted: true,
              mutedUntil: muteUntil
            } 
          }
        )
        
        return NextResponse.json({ 
          success: true,
          message: `${targetUsername} has been muted for ${duration || 1} hour(s)` 
        })

      case 'unmute':
        await db.collection('users').updateOne(
          { username: targetUsername, room },
          { 
            $set: { 
              isMuted: false,
              mutedUntil: null
            } 
          }
        )
        
        return NextResponse.json({ 
          success: true,
          message: `${targetUsername} has been unmuted` 
        })

      case 'unban':
        await db.collection('rooms').updateOne(
          { id: room },
          { 
            $pull: { bannedUsers: targetUsername } 
          }
        )
        
        return NextResponse.json({ 
          success: true,
          message: `${targetUsername} has been unbanned` 
        })

      case 'promote':
        // Add to moderators
        await db.collection('rooms').updateOne(
          { id: room },
          { 
            $addToSet: { moderators: targetUsername } 
          }
        )
        
        await db.collection('users').updateOne(
          { username: targetUsername, room },
          { 
            $set: { role: 'moderator' } 
          }
        )
        
        return NextResponse.json({ 
          success: true,
          message: `${targetUsername} has been promoted to moderator` 
        })

      case 'demote':
        // Remove from moderators
        await db.collection('rooms').updateOne(
          { id: room },
          { 
            $pull: { moderators: targetUsername } 
          }
        )
        
        await db.collection('users').updateOne(
          { username: targetUsername, room },
          { 
            $set: { role: 'user' } 
          }
        )
        
        return NextResponse.json({ 
          success: true,
          message: `${targetUsername} has been demoted to user` 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error performing moderation action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
