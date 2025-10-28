'use client'

import { useEffect, useRef, useState } from 'react'
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID
} from 'agora-rtc-sdk-ng'

interface VideoCallProps {
  channelName: string
  username: string
  uid: number
  onLeave: () => void
}

interface RemoteUser {
  uid: UID
  videoTrack?: IRemoteVideoTrack
  audioTrack?: IRemoteAudioTrack
}

const VideoCall: React.FC<VideoCallProps> = ({ channelName, username, uid, onLeave }) => {
  const [client] = useState<IAgoraRTCClient>(() => 
    AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
  )
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localVideoRef = useRef<HTMLDivElement>(null)

  // Join channel and setup tracks
  useEffect(() => {
    let isMounted = true
    
    const join = async () => {
      try {
        // Check if already connected
        if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
          console.log('Client already connected/connecting, skipping join')
          return
        }

        // Get token from our serverless API
        const response = await fetch('/api/video/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName, username, uid }),
        })

        if (!response.ok) {
          throw new Error('Failed to get video token')
        }

        const { token, appId } = await response.json()

        // Double check mount status before joining
        if (!isMounted) return

        // Join the channel
        await client.join(appId, channelName, token, uid)
        
        if (!isMounted) {
          await client.leave()
          return
        }
        
        setIsJoined(true)

        // Create local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        
        if (!isMounted) {
          audioTrack.close()
          videoTrack.close()
          return
        }
        
        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current)
        }

        // Publish tracks
        await client.publish([audioTrack, videoTrack])

        console.log('Successfully joined channel:', channelName)
      } catch (err: any) {
        console.error('Failed to join channel:', err)
        if (isMounted) {
          setError(err.message || 'Failed to join video call')
        }
      }
    }

    // Setup event listeners
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType)
      console.log('Subscribe success:', user.uid, mediaType)

      setRemoteUsers((prev) => {
        const existing = prev.find((u) => u.uid === user.uid)
        if (existing) {
          return prev.map((u) =>
            u.uid === user.uid
              ? {
                  ...u,
                  [mediaType === 'video' ? 'videoTrack' : 'audioTrack']:
                    mediaType === 'video' ? user.videoTrack : user.audioTrack,
                }
              : u
          )
        }
        return [
          ...prev,
          {
            uid: user.uid,
            [mediaType === 'video' ? 'videoTrack' : 'audioTrack']:
              mediaType === 'video' ? user.videoTrack : user.audioTrack,
          },
        ]
      })

      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play()
      }
    })

    client.on('user-unpublished', (user, mediaType) => {
      console.log('User unpublished:', user.uid, mediaType)
      setRemoteUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid
            ? {
                ...u,
                [mediaType === 'video' ? 'videoTrack' : 'audioTrack']: undefined,
              }
            : u
        )
      )
    })

    client.on('user-left', (user) => {
      console.log('User left:', user.uid)
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
    })

    join()

    // Cleanup
    return () => {
      isMounted = false
      
      const cleanup = async () => {
        if (localVideoTrack) {
          localVideoTrack.stop()
          localVideoTrack.close()
        }
        if (localAudioTrack) {
          localAudioTrack.stop()
          localAudioTrack.close()
        }
        
        if (client.connectionState === 'CONNECTED') {
          try {
            await client.leave()
          } catch (err) {
            console.error('Error leaving channel:', err)
          }
        }
        
        client.removeAllListeners()
      }
      
      cleanup()
    }
  }, [channelName, uid, username, client])

  // Play remote videos when they're added
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        const element = document.getElementById(`remote-video-${user.uid}`)
        if (element && !element.hasChildNodes()) {
          user.videoTrack.play(`remote-video-${user.uid}`)
        }
      }
    })
  }, [remoteUsers])

  // Toggle video
  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled)
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  // Toggle audio
  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled)
      setIsAudioEnabled(!isAudioEnabled)
    }
  }

  // Leave call
  const handleLeave = async () => {
    if (localVideoTrack) {
      localVideoTrack.stop()
      localVideoTrack.close()
    }
    if (localAudioTrack) {
      localAudioTrack.stop()
      localAudioTrack.close()
    }
    await client.leave()
    onLeave()
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Video Call Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={onLeave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Video Call</h2>
          <p className="text-sm text-gray-400">
            {remoteUsers.length + 1} participant{remoteUsers.length !== 0 ? 's' : ''}
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {isJoined ? '🟢 Connected' : '🟡 Connecting...'}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-4 overflow-auto">
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
          <div ref={localVideoRef} className="w-full h-full"></div>
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
            You ({username})
          </div>
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <div className="text-white text-center">
                <div className="text-4xl mb-2">📷</div>
                <div>Camera Off</div>
              </div>
            </div>
          )}
        </div>

        {/* Remote Videos */}
        {remoteUsers.map((user) => (
          <div
            key={user.uid}
            className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video"
          >
            <div id={`remote-video-${user.uid}`} className="w-full h-full"></div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
              User {user.uid}
            </div>
            {!user.videoTrack && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <div className="text-white text-center">
                  <div className="text-4xl mb-2">👤</div>
                  <div>Camera Off</div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Empty state */}
        {remoteUsers.length === 0 && (
          <div className="col-span-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <p className="text-lg">Waiting for others to join...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4">
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full ${
            isAudioEnabled
              ? 'bg-gray-600 hover:bg-gray-700'
              : 'bg-red-600 hover:bg-red-700'
          } text-white transition`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? '🎤' : '🔇'}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${
            isVideoEnabled
              ? 'bg-gray-600 hover:bg-gray-700'
              : 'bg-red-600 hover:bg-red-700'
          } text-white transition`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? '📹' : '📷'}
        </button>

        <button
          onClick={handleLeave}
          className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition"
        >
          Leave Call
        </button>
      </div>
    </div>
  )
}

export default VideoCall
