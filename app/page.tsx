'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import TaskList from './components/TaskList'
import Calendar from './components/Calendar'
import GoogleTasksButton from './components/GoogleTasksButton'
import { apiClient } from '../lib/api-client'
import type { Task } from '../lib/types'
import styles from './page.module.css'

export default function Page() {
  const { user, isLoaded } = useUser()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>()
  
  // Load user's tasks from database
  useEffect(() => {
    if (!isLoaded || !user) return
    
    async function loadTasks() {
      try {
        setLoading(true)
        setError(null)
        const userTasks = await apiClient.getUserTasks()
        setTasks(userTasks)
      } catch (err) {
        console.error('Failed to load tasks:', err)
        setError('Failed to load tasks. Please try refreshing the page.')
      } finally {
        setLoading(false)
      }
    }
    
    loadTasks()
  }, [user, isLoaded])
  
  // Calculate task counts for each date to show in calendar
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach(task => {
      if (task.due_date) {
        counts[task.due_date] = (counts[task.due_date] || 0) + 1
      }
    })
    return counts
  }, [tasks])
  
  const handleDateSelect = (date: string) => {
    setSelectedDate(selectedDate === date ? undefined : date)
  }
  
  // Show loading state while Clerk loads
  if (!isLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }
  
  // This shouldn't happen due to middleware, but just in case
  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Please sign in to access your tasks.</div>
      </div>
    )
  }
  
  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tasks & Calendar</h1>
        <div className={styles.userInfo}>
          <GoogleTasksButton />
          <span className={styles.welcome}>Welcome, {user.firstName || user.emailAddresses[0].emailAddress}!</span>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
      
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      <section>
        <h2 className={styles.sectionHeader}>Tasks</h2>
        <TaskList 
          tasks={tasks}
          setTasks={setTasks}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          loading={loading}
        />
      </section>
      
      <section>
        <h2 className={styles.sectionHeader}>Calendar</h2>
        <Calendar 
          onDateSelect={handleDateSelect}
          selectedDate={selectedDate}
          taskCounts={taskCounts}
        />
      </section>
    </main>
  )
}