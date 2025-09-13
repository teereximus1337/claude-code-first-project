import { google } from 'googleapis'
import type { Task } from './types'

export class GoogleTasksService {
  private tasks: any

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: accessToken })
    this.tasks = google.tasks({ version: 'v1', auth })
  }

  /**
   * Get the default task list ID
   */
  async getDefaultTaskListId(): Promise<string> {
    try {
      const response = await this.tasks.tasklists.list()
      const taskLists = response.data.items || []
      
      // Find the default task list (usually named "My Tasks" or "@default")
      const defaultList = taskLists.find((list: any) => 
        list.title === 'My Tasks' || list.id === '@default'
      ) || taskLists[0]
      
      return defaultList?.id || '@default'
    } catch (error) {
      console.error('Error getting task lists:', error)
      return '@default'
    }
  }

  /**
   * Create a task in Google Tasks
   */
  async createTask(task: Omit<Task, 'id' | 'user_id' | 'created_at'>): Promise<string | null> {
    try {
      const taskListId = await this.getDefaultTaskListId()
      
      const googleTask = {
        title: task.title,
        status: task.done ? 'completed' : 'needsAction',
        due: task.due_date ? new Date(task.due_date).toISOString() : undefined,
        notes: `Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`
      }

      const response = await this.tasks.tasks.insert({
        tasklist: taskListId,
        requestBody: googleTask
      })

      return response.data.id || null
    } catch (error) {
      console.error('Error creating Google Task:', error)
      return null
    }
  }

  /**
   * Update a task in Google Tasks
   */
  async updateTask(googleTaskId: string, updates: Partial<Task>): Promise<boolean> {
    try {
      const taskListId = await this.getDefaultTaskListId()
      
      const googleTask: any = {}
      
      if (updates.title !== undefined) {
        googleTask.title = updates.title
      }
      
      if (updates.done !== undefined) {
        googleTask.status = updates.done ? 'completed' : 'needsAction'
      }
      
      if (updates.due_date !== undefined) {
        googleTask.due = updates.due_date ? new Date(updates.due_date).toISOString() : null
      }
      
      if (updates.priority !== undefined) {
        googleTask.notes = `Priority: ${updates.priority.charAt(0).toUpperCase() + updates.priority.slice(1)}`
      }

      await this.tasks.tasks.update({
        tasklist: taskListId,
        task: googleTaskId,
        requestBody: googleTask
      })

      return true
    } catch (error) {
      console.error('Error updating Google Task:', error)
      return false
    }
  }

  /**
   * Delete a task from Google Tasks
   */
  async deleteTask(googleTaskId: string): Promise<boolean> {
    try {
      const taskListId = await this.getDefaultTaskListId()
      
      await this.tasks.tasks.delete({
        tasklist: taskListId,
        task: googleTaskId
      })

      return true
    } catch (error) {
      console.error('Error deleting Google Task:', error)
      return false
    }
  }
}