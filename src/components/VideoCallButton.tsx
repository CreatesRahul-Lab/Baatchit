'use client'

import { useState, useEffect } from 'react'
import { useChat } from '@/contexts/ChatContext'
import VideoCall from './VideoCall'

const VideoCallButton = () => {
  const { currentRoom, username } = useChat()
  const [isInCall, setIsInCall] = useState(false)
  const [activeCall, setActiveCall] = useState<any>(null)
  const [isStarting, setIsStarting] = useState(false)

  // Check for active calls periodically
  useEffect(() => {
    if (!currentRoom) return

    const checkForActiveCall = async () => {
      try {
        const response = await fetch(`/api/video/call?roomId=${currentRoom}`)
        const data = await response.json()
        
        if (data.call && data.call.status !== 'ended') {
          setActiveCall(data.call)
        } else {
          setActiveCall(null)
        }
      } catch (error) {
        console.error('Error checking for active call:', error)
      }
    }

    checkForActiveCall()
    const interval = setInterval(checkForActiveCall, 3000)

    return () => clearInterval(interval)
  }, [currentRoom])

  const startCall = async () => {
    if (!currentRoom || !username || isStarting) return

    setIsStarting(true)
    try {
      const response = await fetch('/api/video/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: currentRoom, username }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to start video call')
        setIsStarting(false)
        return
      }

      const call = await response.json()
      setActiveCall(call)
      setIsInCall(true)
    } catch (error) {
      console.error('Error starting call:', error)
      alert('Failed to start video call')
    } finally {
      setIsStarting(false)
    }
  }

  const joinCall = async () => {
    if (!activeCall || !username || isStarting) return

    setIsStarting(true)
    try {
      // Update call to add participant
      await fetch('/api/video/call', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: activeCall.id,
          action: 'join',
          username,
        }),
      })

      setIsInCall(true)
    } catch (error) {
      console.error('Error joining call:', error)
      alert('Failed to join video call')
    } finally {
      setIsStarting(false)
    }
  }

  const leaveCall = async () => {
    if (!activeCall || !username) return

    try {
      // Remove participant
      await fetch('/api/video/call', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: activeCall.id,
          action: 'leave',
          username,
        }),
      })

      // Check if we were the last participant and end the call
      if (activeCall.participants.length === 1) {
        await fetch('/api/video/call', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callId: activeCall.id,
            action: 'end',
          }),
        })
      }
    } catch (error) {
      console.error('Error leaving call:', error)
    }

    setIsInCall(false)
    setActiveCall(null)
  }

  // Generate a consistent UID based on username
  const generateUID = (username: string): number => {
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = ((hash << 5) - hash) + username.charCodeAt(i)
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  if (!currentRoom || !username) {
    return null
  }

  // If in call, show the video interface
  if (isInCall && activeCall) {
    return (
      <VideoCall
        channelName={activeCall.channelName}
        username={username}
        uid={generateUID(username)}
        onLeave={leaveCall}
      />
    )
  }

  // Show start/join button
  return (
    <div className="flex items-center gap-2">
      {activeCall && activeCall.status !== 'ended' ? (
        <button
          onClick={joinCall}
          disabled={isStarting}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>📹</span>
          <span>{isStarting ? 'Joining...' : 'Join Video Call'}</span>
          <span className="text-xs bg-green-600 px-2 py-1 rounded">
            {activeCall.participants.length} in call
          </span>
        </button>
      ) : (
        <button
          onClick={startCall}
          disabled={isStarting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>📹</span>
          <span>{isStarting ? 'Starting...' : 'Start Video Call'}</span>
        </button>
      )}
    </div>
  )
}

export default VideoCallButton
