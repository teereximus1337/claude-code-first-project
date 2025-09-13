import { supabase } from './supabase'
import type { Task, CreateTaskData, UpdateTaskData } from './types'

// Type assertion for Supabase operations
type SupabaseTask = {
  id: string
  user_id: string
  title: string
  done: boolean
  priority: 'high' | 'medium' | 'low'
  due_date: string | null
  google_task_id: string | null
  created_at: string
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export const database = {
  /**
   * Get all tasks for a specific user
   */
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new DatabaseError(`Failed to fetch tasks: ${error.message}`, error)
      }

      return (data as SupabaseTask[]) || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error while fetching tasks', error)
    }
  },

  /**
   * Create a new task for a user
   */
  async createTask(userId: string, taskData: CreateTaskData): Promise<Task> {
    try {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .insert({
          user_id: userId,
          title: taskData.title,
          priority: taskData.priority || 'medium',
          due_date: taskData.due_date || null,
          done: false,
        })
        .select()
        .single()

      if (error) {
        throw new DatabaseError(`Failed to create task: ${error.message}`, error)
      }

      if (!data) {
        throw new DatabaseError('No data returned after creating task')
      }

      return data as SupabaseTask
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error while creating task', error)
    }
  },

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: UpdateTaskData, userId: string): Promise<Task> {
    try {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', userId) // Ensure user can only update their own tasks
        .select()
        .single()

      if (error) {
        throw new DatabaseError(`Failed to update task: ${error.message}`, error)
      }

      if (!data) {
        throw new DatabaseError('Task not found or you do not have permission to update it')
      }

      return data as SupabaseTask
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error while updating task', error)
    }
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId) // Ensure user can only delete their own tasks

      if (error) {
        throw new DatabaseError(`Failed to delete task: ${error.message}`, error)
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error while deleting task', error)
    }
  },

  /**
   * Get task counts by date for calendar view
   */
  async getTaskCountsByDate(userId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .select('due_date')
        .eq('user_id', userId)
        .not('due_date', 'is', null)

      if (error) {
        throw new DatabaseError(`Failed to fetch task counts: ${error.message}`, error)
      }

      const counts: Record<string, number> = {}
      data?.forEach((task: any) => {
        if (task.due_date) {
          counts[task.due_date] = (counts[task.due_date] || 0) + 1
        }
      })

      return counts
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error while fetching task counts', error)
    }
  },

  /**
   * Get tasks for a specific date
   */
  async getTasksForDate(userId: string, date: string): Promise<Task[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('due_date', date)
        .order('created_at', { ascending: false })

      if (error) {
        throw new DatabaseError(`Failed to fetch tasks for date: ${error.message}`, error)
      }

      return (data as SupabaseTask[]) || []
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Unexpected error while fetching tasks for date', error)
    }
  },

  /**
   * Get today's tasks
   */
  async getTodaysTasks(userId: string): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.getTasksForDate(userId, today)
  },
}