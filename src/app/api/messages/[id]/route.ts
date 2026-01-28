import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { text, username } = await request.json()

    if (!text || !username) {
      return NextResponse.json(
        { error: 'Text and username are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    
    // Find the message first to verify ownership
    const message = await db.collection('messages').findOne({ id })
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    if (message.username !== username) {
      return NextResponse.json(
        { error: 'You can only edit your own messages' },
        { status: 403 }
      )
    }

    if (message.deleted) {
      return NextResponse.json(
        { error: 'Cannot edit deleted message' },
        { status: 400 }
      )
    }

    const now = new Date()
    
    // Update message with edit history
    const result = await db.collection('messages').updateOne(
      { id },
      {
        $set: {
          text,
          edited: true,
          editedAt: now
        },
        $push: {
          editHistory: {
            text: message.text,
            editedAt: now
          }
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: {
        ...message,
        text,
        edited: true,
        editedAt: now
      }
    })
  } catch (error) {
    console.error('Error editing message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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
    
    // Find the message first to verify ownership
    const message = await db.collection('messages').findOne({ id })
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    if (message.username !== username) {
      return NextResponse.json(
        { error: 'You can only delete your own messages' },
        { status: 403 }
      )
    }

    const now = new Date()
    
    // Soft delete - mark as deleted but keep in database
    const result = await db.collection('messages').updateOne(
      { id },
      {
        $set: {
          deleted: true,
          deletedAt: now,
          text: '[Message deleted]'
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: {
        ...message,
        text: '[Message deleted]',
        deleted: true,
        deletedAt: now
      }
    })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
