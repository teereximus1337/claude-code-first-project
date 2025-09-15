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
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-center items-center min-h-64 text-gray-500">
              Loading...
            </div>
          </div>
        </div>
      </main>
    )
  }
  
  // This shouldn't happen due to middleware, but just in case
  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Please sign in to access your tasks.
            </div>
          </div>
        </div>
      </main>
    )
  }
  
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Tasks & Calendar</h1>
            <div className="flex items-center gap-4">
              <GoogleTasksButton />
              <span className="text-sm text-gray-600">
                Welcome, {user.firstName || user.emailAddresses[0].emailAddress}!
              </span>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>
              <TaskList 
                tasks={tasks}
                setTasks={setTasks}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                loading={loading}
              />
            </section>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendar</h2>
              <Calendar 
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                taskCounts={taskCounts}
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}