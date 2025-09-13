import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { database } from '../../../../lib/database'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const counts = await database.getTaskCountsByDate(userId)
    return NextResponse.json({ counts })
  } catch (error) {
    console.error('Failed to fetch task counts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task counts' },
      { status: 500 }
    )
  }
}