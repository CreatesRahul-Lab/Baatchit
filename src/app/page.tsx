'use client'

import { useState } from 'react'
import JoinRoom from '@/components/JoinRoom'
import ChatRoom from '@/components/ChatRoom'
import { useChat } from '@/contexts/ChatContext'

export default function Home() {
  const { currentRoom, username } = useChat()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🗣️ Baatein
        </h1>
        <p className="text-lg text-gray-600">
          Real-time chat rooms for meaningful conversations
        </p>
      </div>

      {!currentRoom || !username ? (
        <JoinRoom />
      ) : (
        <ChatRoom />
      )}
    </div>
  )
}