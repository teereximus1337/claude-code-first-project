'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import styles from '../page.module.css'

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
      <div className={styles.googleTasksButton}>
        <span className={styles.googleIcon}>📅</span>
        Loading...
      </div>
    )
  }

  if (session) {
    return (
      <div className={styles.googleTasksContainer}>
        <div className={styles.googleTasksConnected}>
          <span className={styles.googleIcon}>✅</span>
          <span>Google Tasks Connected</span>
        </div>
        <button 
          className={styles.googleTasksDisconnect}
          onClick={handleDisconnect}
          title="Disconnect Google Tasks"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button 
      className={styles.googleTasksButton}
      onClick={handleConnect}
      disabled={isConnecting}
    >
      <span className={styles.googleIcon}>📅</span>
      {isConnecting ? 'Connecting...' : 'Connect Google Tasks'}
    </button>
  )
}