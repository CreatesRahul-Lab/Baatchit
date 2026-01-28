'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { Message } from '@/lib/types'
import EmojiPicker from './EmojiPicker'

interface MessageItemProps {
  message: Message
  isOwn: boolean
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  const { addReaction, username, editMessage, deleteMessage } = useChat()
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const pickerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    
    if (showEmojiPicker || showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker, showMenu])

  const handleReaction = (emoji: string) => {
    addReaction(message.id, emoji)
    setShowEmojiPicker(false)
  }

  const handleEdit = async () => {
    if (!editText.trim() || editText === message.text) {
      setIsEditing(false)
      return
    }

    try {
      await editMessage(message.id, editText.trim())
      setIsEditing(false)
      setShowMenu(false)
    } catch (error) {
      alert('Failed to edit message')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return
    }

    try {
      await deleteMessage(message.id)
      setShowMenu(false)
    } catch (error) {
      alert('Failed to delete message')
    }
  }

  const handleCancelEdit = () => {
    setEditText(message.text)
    setIsEditing(false)
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
        <div className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full">
          <span className="mr-1">ℹ️</span>
          <span>{message.text}</span>
          <span className="ml-2 text-xs text-gray-400">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`mb-4 ${isOwn ? 'text-right' : 'text-left'} px-2`}>
      <div className={`inline-block max-w-xs lg:max-w-md ${
        isOwn 
          ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-l-lg rounded-tr-lg' 
          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-r-lg rounded-tl-lg shadow-sm border dark:border-gray-600'
      } px-4 py-2 relative group`}>
        
        {/* Username and timestamp */}
        {!isOwn && (
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            {message.username}
          </div>
        )}
        
        {/* Message text or edit input */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="break-words">
            {message.text}
            {message.edited && (
              <span className={`text-xs ml-2 ${isOwn ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                (edited)
              </span>
            )}
            {message.deleted && (
              <span className="text-xs italic opacity-75">
                {message.text}
              </span>
            )}
          </div>
        )}
        
        {/* Timestamp */}
        <div className={`text-xs mt-1 ${
          isOwn ? 'text-blue-100 dark:text-blue-200' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatTime(message.timestamp)}
        </div>

        {/* Action buttons for own messages */}
        {isOwn && !message.deleted && !isEditing && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full w-6 h-6 flex items-center justify-center text-gray-700 dark:text-gray-200"
              title="More options"
            >
              ⋮
            </button>
          </div>
        )}

        {/* Dropdown menu */}
        {showMenu && isOwn && (
          <div 
            ref={menuRef}
            className="absolute top-6 right-0 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg shadow-lg z-50 py-1 min-w-[120px]"
          >
            <button
              onClick={() => {
                setIsEditing(true)
                setShowMenu(false)
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
            >
              ✏️ Edit
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600 dark:text-red-400"
            >
              🗑️ Delete
            </button>
          </div>
        )}

        {/* Reaction button */}
        {!isEditing && !message.deleted && (
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute -bottom-1 -right-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            title="Add reaction"
          >
            😊
          </button>
        )}

      </div>
      
      {/* Emoji picker - positioned outside message bubble to avoid clipping */}
      {showEmojiPicker && (
        <div 
          ref={pickerRef}
          className={`relative mt-1 z-50 ${isOwn ? 'text-right' : 'text-left'}`}
        >
          <div className={`inline-block ${isOwn ? 'mr-2' : 'ml-2'}`}>
            <EmojiPicker onEmojiSelect={handleReaction} />
          </div>
        </div>
      )}

      {/* Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <div className={`mt-1 space-x-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {message.reactions.map((reaction) => (
            <button
              key={reaction.emoji}
              onClick={() => addReaction(message.id, reaction.emoji)}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs border transition-colors ${
                hasUserReacted(reaction.emoji)
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
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
          <div className="inline-block bg-gray-200 dark:bg-gray-700 rounded-r-lg rounded-tl-lg px-4 py-2 max-w-xs">
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300 ml-2">
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