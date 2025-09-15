'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button, Badge } from './design-system'

export default function GoogleTasksButton() {
  const { data: session, status } = useSession()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await signIn('google', { callbackUrl: window.location.href })
    } catch (error) {
      console.error('Failed to connect to Google:', error)
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await signOut({ redirect: false })
    } catch (error) {
      console.error('Failed to disconnect from Google:', error)
    }
  }

  if (status === 'loading') {
    return (
      <Button variant="secondary" size="sm" disabled>
        📅 Loading...
      </Button>
    )
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <Badge variant="success" size="md">
          ✅ Google Tasks Connected
        </Badge>
        <Button 
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button 
      variant="primary"
      size="sm"
      onClick={handleConnect}
      disabled={isConnecting}
    >
      📅 {isConnecting ? 'Connecting...' : 'Connect Google Tasks'}
    </Button>
  )
}