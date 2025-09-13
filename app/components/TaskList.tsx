'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '../../lib/api-client'
import type { Task, Priority } from '../../lib/types'
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
      <form className={styles.form} onSubmit={(e) => { e.preventDefault(); addTask(); }}>
        <label htmlFor="task-input" className={styles.srOnly}>
          Add new task
        </label>
        <input
          id="task-input"
          type="text"
          className={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a new task"
          disabled={isCreating}
        />
        <input
          type="date"
          className={styles.dateInput}
          value={dueDateValue}
          onChange={(e) => setDueDateValue(e.target.value)}
          title="Due date (optional)"
          disabled={isCreating}
        />
        <button type="submit" className={styles.button} disabled={isCreating}>
          {isCreating ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div className={styles.filterButtons}>
        <button 
          className={filterMode === 'all' ? styles.filterButtonActive : styles.filterButton}
          onClick={() => setFilterMode('all')}
        >
          All ({tasks.length})
        </button>
        <button 
          className={filterMode === 'today' ? styles.filterButtonActive : styles.filterButton}
          onClick={() => setFilterMode('today')}
        >
          Today ({tasks.filter(t => isToday(t.due_date || '')).length})
        </button>
        {selectedDate && (
          <button 
            className={filterMode === 'selected' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setFilterMode('selected')}
          >
            {formatDate(selectedDate)} ({tasks.filter(t => t.due_date === selectedDate).length})
          </button>
        )}
      </div>

      <ul className={styles.list}>
        {filteredTasks.map(task => (
          <li key={task.id} className={`${styles.item} priority-${task.priority}`}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={task.done}
              onChange={() => toggleTask(task.id, task.done)}
              disabled={updatingTasks.has(task.id)}
            />
            
            <div className={styles.priorityIndicator} style={{ backgroundColor: getPriorityColor(task.priority) }}></div>
            
            <div className={styles.taskContent}>
              <span className={task.done ? styles.titleDone : styles.titleText}>
                {task.title}
              </span>
              <div className={styles.taskMeta}>
                {task.due_date && (
                  <span className={`${styles.dueDate} ${isToday(task.due_date) ? styles.dueDateToday : ''}`}>
                    {isToday(task.due_date) ? 'Today' : formatDate(task.due_date)}
                  </span>
                )}
                <span className={styles.priorityLabel} style={{ color: getPriorityColor(task.priority) }}>
                  {getPriorityLabel(task.priority)} Priority
                </span>
              </div>
            </div>
            
            <div className={styles.taskActions}>
              {session && (
                <button
                  className={`${styles.syncToggle} ${task.google_task_id ? styles.synced : ''} ${syncingTasks.has(task.id) ? styles.syncing : ''}`}
                  onClick={() => toggleGoogleTasksSync(task.id)}
                  disabled={syncingTasks.has(task.id) || updatingTasks.has(task.id)}
                  title={task.google_task_id ? 'Remove from Google Tasks' : 'Sync to Google Tasks'}
                >
                  {syncingTasks.has(task.id) ? '⏳' : task.google_task_id ? '📅' : '📝'}
                </button>
              )}
              
              <div className={styles.priorityMenuContainer}>
                <button
                  className={styles.priorityButton}
                  onClick={(e) => togglePriorityMenu(task.id, e)}
                  title="Set Priority"
                  disabled={updatingTasks.has(task.id)}
                >
                  ⚡
                </button>
                {showPriorityMenu === task.id && (
                  <div className={styles.priorityMenu}>
                    <button
                      className={styles.priorityMenuItem}
                      onClick={() => updateTaskPriority(task.id, 'high')}
                    >
                      <span className={styles.priorityDot} style={{ backgroundColor: '#ef4444' }}></span>
                      High
                    </button>
                    <button
                      className={styles.priorityMenuItem}
                      onClick={() => updateTaskPriority(task.id, 'medium')}
                    >
                      <span className={styles.priorityDot} style={{ backgroundColor: '#f59e0b' }}></span>
                      Medium
                    </button>
                    <button
                      className={styles.priorityMenuItem}
                      onClick={() => updateTaskPriority(task.id, 'low')}
                    >
                      <span className={styles.priorityDot} style={{ backgroundColor: '#10b981' }}></span>
                      Low
                    </button>
                  </div>
                )}
              </div>
              
              <button 
                className={styles.buttonSecondary}
                onClick={() => deleteTask(task.id)}
                disabled={updatingTasks.has(task.id)}
              >
                {updatingTasks.has(task.id) ? 'Loading...' : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      
      {filteredTasks.length === 0 && !loading && (
        <div className={styles.loading}>
          {filterMode === 'all' ? 'No tasks yet. Create your first task above!' : 'No tasks for this filter.'}
        </div>
      )}
    </div>
  )
}