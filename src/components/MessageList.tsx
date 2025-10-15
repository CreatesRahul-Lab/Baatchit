'use client'

import { useState } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { Message } from '@/lib/types'
import EmojiPicker from './EmojiPicker'

interface MessageItemProps {
  message: Message
  isOwn: boolean
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  const { addReaction, username } = useChat()
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleReaction = (emoji: string) => {
    addReaction(message.id, emoji)
    setShowEmojiPicker(false)
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const hasUserReacted = (emoji: string) => {
    const reaction = message.reactions?.find(r => r.emoji === emoji)
    return reaction?.users.includes(username) || false
  }

  // Render system messages differently
  if (message.type === 'system') {
    return (
      <div className="mb-3 text-center">
        <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
          <span className="mr-1">ℹ️</span>
          <span>{message.text}</span>
          <span className="ml-2 text-xs text-gray-400">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`mb-4 ${isOwn ? 'text-right' : 'text-left'}`}>
      <div className={`inline-block max-w-xs lg:max-w-md ${
        isOwn 
          ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg' 
          : 'bg-white text-gray-800 rounded-r-lg rounded-tl-lg shadow-sm border'
      } px-4 py-2 relative group`}>
        
        {/* Username and timestamp */}
        {!isOwn && (
          <div className="text-xs font-semibold text-gray-600 mb-1">
            {message.username}
          </div>
        )}
        
        {/* Message text */}
        <div className="break-words">
          {message.text}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs mt-1 ${
          isOwn ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {formatTime(message.timestamp)}
        </div>

        {/* Reaction button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="absolute -bottom-1 -right-1 bg-gray-100 hover:bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          title="Add reaction"
        >
          😊
        </button>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="absolute top-full right-0 mt-1 z-10">
            <EmojiPicker onEmojiSelect={handleReaction} />
          </div>
        )}
      </div>

      {/* Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <div className={`mt-1 space-x-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {message.reactions.map((reaction) => (
            <button
              key={reaction.emoji}
              onClick={() => addReaction(message.id, reaction.emoji)}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs border transition-colors ${
                hasUserReacted(reaction.emoji)
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
              }`}
              title={`Reacted by: ${reaction.users.join(', ')}`}
            >
              <span>{reaction.emoji}</span>
              <span className="ml-1">{reaction.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const MessageList = () => {
  const { messages, username, typingUsers } = useChat()

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p>No messages yet. Start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.username === username}
        />
      ))}
      
      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="text-left">
          <div className="inline-block bg-gray-200 rounded-r-lg rounded-tl-lg px-4 py-2 max-w-xs">
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-xs text-gray-600 ml-2">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} users are typing...`
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageList