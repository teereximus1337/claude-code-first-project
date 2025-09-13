import type { Task, CreateTaskData, UpdateTaskData } from './types'

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(errorData.error || 'Request failed', response.status)
  }
  
  return response.json()
}

export const apiClient = {
  /**
   * Get all tasks for the current user
   */
  async getUserTasks(): Promise<Task[]> {
    const response = await fetch('/api/tasks')
    const data = await handleResponse<{ tasks: Task[] }>(response)
    return data.tasks
  },

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskData): Promise<Task> {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    })
    const data = await handleResponse<{ task: Task }>(response)
    return data.task
  },

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: UpdateTaskData): Promise<Task> {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })
    const data = await handleResponse<{ task: Task }>(response)
    return data.task
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    })
    await handleResponse<{ success: boolean }>(response)
  },

  /**
   * Get task counts by date for calendar view
   */
  async getTaskCountsByDate(): Promise<Record<string, number>> {
    const response = await fetch('/api/tasks/counts')
    const data = await handleResponse<{ counts: Record<string, number> }>(response)
    return data.counts
  },

  /**
   * Sync task with Google Tasks
   */
  async syncWithGoogleTasks(taskId: string, action: 'create' | 'update' | 'delete'): Promise<boolean> {
    try {
      const response = await fetch('/api/google-tasks/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, action }),
      })
      
      if (response.ok) {
        return true
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Sync failed:', errorData.error || 'Unknown error')
        return false
      }
    } catch (error) {
      console.error('Sync error:', error)
      return false
    }
  },
}