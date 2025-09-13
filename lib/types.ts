export type Priority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  user_id: string
  title: string
  done: boolean
  priority: Priority
  due_date?: string | null
  google_task_id?: string | null
  created_at: string
}

export interface CreateTaskData {
  title: string
  priority?: Priority
  due_date?: string | null
}

export interface UpdateTaskData {
  title?: string
  done?: boolean
  priority?: Priority
  due_date?: string | null
}

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Task, 'id' | 'user_id'>>
      }
    }
  }
}