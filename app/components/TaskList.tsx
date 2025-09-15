'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '../../lib/api-client'
import type { Task, Priority } from '../../lib/types'
import { Card, Button, Input, Badge, IconButton, Checkbox } from './design-system'
import styles from '../page.module.css'

interface TaskListProps {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  selectedDate?: string
  onDateSelect?: (date: string) => void
  loading: boolean
}

export default function TaskList({ tasks, setTasks, selectedDate, onDateSelect, loading }: TaskListProps) {
  const { data: session } = useSession()
  const [inputValue, setInputValue] = useState('')
  const [dueDateValue, setDueDateValue] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'selected'>('all')
  const [showPriorityMenu, setShowPriorityMenu] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set())
  const [syncingTasks, setSyncingTasks] = useState<Set<string>>(new Set())

  const addTask = async () => {
    const trimmedTitle = inputValue.trim()
    if (!trimmedTitle || isCreating) return

    try {
      setIsCreating(true)
      const newTask = await apiClient.createTask({
        title: trimmedTitle,
        priority: 'medium',
        due_date: dueDateValue || null,
      })
      
      setTasks(prev => [newTask, ...prev])
      setInputValue('')
      setDueDateValue('')
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleTask = async (taskId: string, currentDone: boolean) => {
    if (updatingTasks.has(taskId)) return

    try {
      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, done: !currentDone } : task
      ))
      
      setUpdatingTasks(prev => new Set(prev).add(taskId))
      
      await apiClient.updateTask(taskId, { done: !currentDone })
    } catch (error) {
      // Revert optimistic update
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, done: currentDone } : task
      ))
      console.error('Failed to toggle task:', error)
      alert('Failed to update task. Please try again.')
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const deleteTask = async (taskId: string) => {
    if (updatingTasks.has(taskId)) return

    try {
      // Optimistic update
      setTasks(prev => prev.filter(task => task.id !== taskId))
      setUpdatingTasks(prev => new Set(prev).add(taskId))
      
      await apiClient.deleteTask(taskId)
    } catch (error) {
      // Revert optimistic update - we'd need to refetch tasks here
      console.error('Failed to delete task:', error)
      alert('Failed to delete task. Please refresh the page.')
      // For now, refresh tasks
      window.location.reload()
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const updateTaskPriority = async (taskId: string, priority: Priority) => {
    if (updatingTasks.has(taskId)) return

    try {
      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, priority } : task
      ))
      
      setUpdatingTasks(prev => new Set(prev).add(taskId))
      setShowPriorityMenu(null)
      
      await apiClient.updateTask(taskId, { priority })
    } catch (error) {
      // Revert optimistic update - we'd need the original priority
      console.error('Failed to update task priority:', error)
      alert('Failed to update priority. Please refresh the page.')
      window.location.reload()
    } finally {
      setUpdatingTasks(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const togglePriorityMenu = (taskId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setShowPriorityMenu(showPriorityMenu === taskId ? null : taskId)
  }

  const toggleGoogleTasksSync = async (taskId: string) => {
    if (!session) {
      alert('Please connect to Google Tasks first')
      return
    }

    const task = tasks.find(t => t.id === taskId)
    if (!task || syncingTasks.has(taskId)) return

    setSyncingTasks(prev => new Set(prev).add(taskId))

    try {
      if (task.google_task_id) {
        // Remove from Google Tasks
        const success = await apiClient.syncWithGoogleTasks(taskId, 'delete')
        if (success) {
          // Update local state to remove google_task_id
          setTasks(prev => prev.map(t => 
            t.id === taskId ? { ...t, google_task_id: null } : t
          ))
        } else {
          alert('Failed to remove from Google Tasks')
        }
      } else {
        // Add to Google Tasks
        const success = await apiClient.syncWithGoogleTasks(taskId, 'create')
        if (success) {
          // Refresh tasks to get the google_task_id
          const response = await apiClient.getUserTasks()
          setTasks(response)
        } else {
          alert('Failed to sync with Google Tasks')
        }
      }
    } catch (error) {
      console.error('Sync error:', error)
      alert('Failed to sync with Google Tasks')
    } finally {
      setSyncingTasks(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'High'
      case 'medium': return 'Medium'
      case 'low': return 'Low'
      default: return 'Medium'
    }
  }

  // Close priority menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showPriorityMenu) {
        setShowPriorityMenu(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showPriorityMenu])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask()
    }
  }

  const getFilteredTasks = () => {
    const today = new Date().toISOString().split('T')[0]
    
    switch (filterMode) {
      case 'today':
        return tasks.filter(task => task.due_date === today)
      case 'selected':
        return selectedDate ? tasks.filter(task => task.due_date === selectedDate) : tasks
      default:
        return tasks
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  const filteredTasks = getFilteredTasks()

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading your tasks...
      </div>
    )
  }

  return (
    <div>
      <form className="flex items-center gap-3 mb-6" onSubmit={(e) => { e.preventDefault(); addTask(); }}>
        <label htmlFor="task-input" className="sr-only">
          Add new task
        </label>
        <Input
          id="task-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a new task"
          disabled={isCreating}
          className="flex-1"
        />
        <Input
          type="date"
          value={dueDateValue}
          onChange={(e) => setDueDateValue(e.target.value)}
          title="Due date (optional)"
          disabled={isCreating}
          className="w-auto"
        />
        <Button type="submit" disabled={isCreating}>
          {isCreating ? 'Adding...' : 'Add'}
        </Button>
      </form>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button 
          variant={filterMode === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilterMode('all')}
        >
          All ({tasks.length})
        </Button>
        <Button 
          variant={filterMode === 'today' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilterMode('today')}
        >
          Today ({tasks.filter(t => isToday(t.due_date || '')).length})
        </Button>
        {selectedDate && (
          <Button 
            variant={filterMode === 'selected' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterMode('selected')}
          >
            {formatDate(selectedDate)} ({tasks.filter(t => t.due_date === selectedDate).length})
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {filteredTasks.map(task => (
          <Card key={task.id} className="flex items-center gap-4">
            <Checkbox
              checked={task.done}
              onChange={() => toggleTask(task.id, task.done)}
              disabled={updatingTasks.has(task.id)}
            />
            
            <div className="flex-1">
              <div className={`font-medium ${task.done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {task.due_date && (
                  <Badge variant={isToday(task.due_date) ? 'today' : 'default'}>
                    {isToday(task.due_date) ? 'Today' : formatDate(task.due_date)}
                  </Badge>
                )}
                <Badge variant={task.priority}>
                  {getPriorityLabel(task.priority)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {session && (
                <IconButton
                  variant={task.google_task_id ? 'success' : 'default'}
                  onClick={() => toggleGoogleTasksSync(task.id)}
                  disabled={syncingTasks.has(task.id) || updatingTasks.has(task.id)}
                  title={task.google_task_id ? 'Remove from Google Tasks' : 'Sync to Google Tasks'}
                >
                  {syncingTasks.has(task.id) ? '⏳' : task.google_task_id ? '📅' : '📝'}
                </IconButton>
              )}
              
              <div className="relative">
                <IconButton
                  onClick={(e) => togglePriorityMenu(task.id, e as React.MouseEvent)}
                  title="Set Priority"
                  disabled={updatingTasks.has(task.id)}
                >
                  ⚡
                </IconButton>
                {showPriorityMenu === task.id && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                    <button
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg"
                      onClick={() => updateTaskPriority(task.id, 'high')}
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      High
                    </button>
                    <button
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => updateTaskPriority(task.id, 'medium')}
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      Medium
                    </button>
                    <button
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 last:rounded-b-lg"
                      onClick={() => updateTaskPriority(task.id, 'low')}
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Low
                    </button>
                  </div>
                )}
              </div>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => deleteTask(task.id)}
                disabled={updatingTasks.has(task.id)}
              >
                {updatingTasks.has(task.id) ? 'Loading...' : 'Delete'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {filteredTasks.length === 0 && !loading && (
        <div className="flex justify-center items-center min-h-32 text-gray-500">
          {filterMode === 'all' ? 'No tasks yet. Create your first task above!' : 'No tasks for this filter.'}
        </div>
      )}
    </div>
  )
}