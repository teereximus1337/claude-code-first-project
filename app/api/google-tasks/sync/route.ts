import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { database } from '../../../../lib/database'
import { GoogleTasksService } from '../../../../lib/google-tasks'

export async function POST(request: NextRequest) {
  try {
    // Get Clerk user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get NextAuth session for Google access token
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Google authentication required' },
        { status: 401 }
      )
    }

    const { taskId, action } = await request.json()

    if (!taskId || !action) {
      return NextResponse.json(
        { error: 'Task ID and action are required' },
        { status: 400 }
      )
    }

    const googleTasks = new GoogleTasksService(session.accessToken as string)

    switch (action) {
      case 'create': {
        // Get the task from our database
        const tasks = await database.getUserTasks(userId)
        const task = tasks.find(t => t.id === taskId)
        
        if (!task) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        // Create in Google Tasks
        const googleTaskId = await googleTasks.createTask({
          title: task.title,
          done: task.done,
          priority: task.priority,
          due_date: task.due_date
        })

        if (googleTaskId) {
          // Update our database with the Google Task ID
          await database.updateTask(taskId, { google_task_id: googleTaskId }, userId)
          return NextResponse.json({ success: true, googleTaskId })
        } else {
          return NextResponse.json(
            { error: 'Failed to create Google Task' },
            { status: 500 }
          )
        }
      }

      case 'update': {
        const tasks = await database.getUserTasks(userId)
        const task = tasks.find(t => t.id === taskId)
        
        if (!task || !task.google_task_id) {
          return NextResponse.json(
            { error: 'Task not found or not synced' },
            { status: 404 }
          )
        }

        const success = await googleTasks.updateTask(task.google_task_id, {
          title: task.title,
          done: task.done,
          priority: task.priority,
          due_date: task.due_date
        })

        if (success) {
          return NextResponse.json({ success: true })
        } else {
          return NextResponse.json(
            { error: 'Failed to update Google Task' },
            { status: 500 }
          )
        }
      }

      case 'delete': {
        const tasks = await database.getUserTasks(userId)
        const task = tasks.find(t => t.id === taskId)
        
        if (!task || !task.google_task_id) {
          return NextResponse.json({ success: true }) // Already not in Google Tasks
        }

        const success = await googleTasks.deleteTask(task.google_task_id)
        
        // Update our database to remove the Google Task ID
        await database.updateTask(taskId, { google_task_id: null }, userId)
        
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Google Tasks sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync with Google Tasks' },
      { status: 500 }
    )
  }
}