import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// POST /api/messages/reactions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messageId, emoji, username, room } = body

    if (!messageId || !emoji || !username || !room) {
      return NextResponse.json(
        { error: 'MessageId, emoji, username, and room are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME || 'baatein-chat')
    const messagesCollection = db.collection('messages')

    // Find the message
    const message = await messagesCollection.findOne({ id: messageId, room })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const reactions = message.reactions || []
    const existingReaction = reactions.find((r: any) => r.emoji === emoji)

    if (existingReaction) {
      // Toggle reaction
      if (existingReaction.users.includes(username)) {
        // Remove user from reaction
        existingReaction.users = existingReaction.users.filter((u: string) => u !== username)
        existingReaction.count = existingReaction.users.length

        // Remove reaction if no users left
        if (existingReaction.count === 0) {
          const updatedReactions = reactions.filter((r: any) => r.emoji !== emoji)
          await messagesCollection.updateOne(
            { id: messageId },
            { $set: { reactions: updatedReactions } }
          )
        } else {
          await messagesCollection.updateOne(
            { id: messageId, 'reactions.emoji': emoji },
            { $set: { 'reactions.$': existingReaction } }
          )
        }
      } else {
        // Add user to reaction
        existingReaction.users.push(username)
        existingReaction.count = existingReaction.users.length
        await messagesCollection.updateOne(
          { id: messageId, 'reactions.emoji': emoji },
          { $set: { 'reactions.$': existingReaction } }
        )
      }
    } else {
      // Add new reaction
      const newReaction = {
        emoji,
        users: [username],
        count: 1
      }
      await messagesCollection.updateOne(
        { id: messageId },
        { $push: { reactions: newReaction } as any }
      )
    }

    // Fetch updated message
    const updatedMessage = await messagesCollection.findOne({ id: messageId })

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error('Error adding reaction:', error)
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
  }
}
