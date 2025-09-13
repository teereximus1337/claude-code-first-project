'use client'

import { useState } from 'react'
import styles from '../page.module.css'

interface CalendarProps {
  onDateSelect: (date: string) => void
  selectedDate?: string
  taskCounts: Record<string, number>
}

export default function Calendar({ onDateSelect, selectedDate, taskCounts }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  const formatDateString = (day: number) => {
    return new Date(year, month, day).toISOString().split('T')[0]
  }
  
  const isToday = (day: number) => {
    return formatDateString(day) === todayString
  }
  
  const isSelected = (day: number) => {
    return formatDateString(day) === selectedDate
  }
  
  const getTaskCount = (day: number) => {
    const dateString = formatDateString(day)
    return taskCounts[dateString] || 0
  }
  
  const renderCalendarDays = () => {
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className={styles.calendarDayEmpty}></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateString(day)
      const taskCount = getTaskCount(day)
      const dayClasses = [
        styles.calendarDay,
        isToday(day) ? styles.calendarDayToday : '',
        isSelected(day) ? styles.calendarDaySelected : '',
        taskCount > 0 ? styles.calendarDayWithTasks : ''
      ].filter(Boolean).join(' ')
      
      days.push(
        <button
          key={day}
          className={dayClasses}
          onClick={() => onDateSelect(dateString)}
          title={taskCount > 0 ? `${taskCount} task${taskCount > 1 ? 's' : ''}` : undefined}
        >
          <span className={styles.calendarDayNumber}>{day}</span>
          {taskCount > 0 && (
            <span className={styles.calendarDayBadge}>{taskCount}</span>
          )}
        </button>
      )
    }
    
    return days
  }
  
  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <h2 className={styles.calendarTitle}>
          {monthNames[month]} {year}
        </h2>
        <div className={styles.calendarNav}>
          <button className={styles.calendarNavButton} onClick={goToPreviousMonth}>
            ←
          </button>
          <button className={styles.calendarTodayButton} onClick={goToToday}>
            Today
          </button>
          <button className={styles.calendarNavButton} onClick={goToNextMonth}>
            →
          </button>
        </div>
      </div>
      
      <div className={styles.calendarWeekdays}>
        {weekdays.map(weekday => (
          <div key={weekday} className={styles.calendarWeekday}>
            {weekday}
          </div>
        ))}
      </div>
      
      <div className={styles.calendarGrid}>
        {renderCalendarDays()}
      </div>
    </div>
  )
}