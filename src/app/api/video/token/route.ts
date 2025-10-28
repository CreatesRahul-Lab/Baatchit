import { NextRequest, NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-token'

// POST /api/video/token
// Generates Agora RTC token for video calling (serverless)
export async function POST(req: NextRequest) {
  try {
    const { channelName, username, uid } = await req.json()

    if (!channelName || !username || !uid) {
      return NextResponse.json(
        { error: 'Channel name, username, and uid are required' },
        { status: 400 }
      )
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appId || !appCertificate) {
      return NextResponse.json(
        { error: 'Agora credentials not configured' },
        { status: 500 }
      )
    }

    // Token expires in 24 hours
    const expirationTimeInSeconds = 3600 * 24
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    // Build the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER, // User can publish and subscribe
      privilegeExpiredTs,
      privilegeExpiredTs
    )

    return NextResponse.json({
      token,
      appId,
      channelName,
      uid,
      expiresAt: new Date(privilegeExpiredTs * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Error generating Agora token:', error)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}
