// lib/business-days.js

const HOLIDAYS = new Set([
  '2025-01-26',
  '2025-03-14',
  '2025-04-14',
  '2025-08-15',
  '2025-10-02',
  '2025-10-20',
  '2025-12-25',
  '2026-01-26',
  '2026-08-15',
  '2026-10-02',
  '2026-12-25',
])

function toDateString(date) {
  return new Date(date).toISOString().split('T')[0]
}

function isWeekend(date) {
  const day = new Date(date).getDay()
  return day === 0 || day === 6
}

function isHoliday(date) {
  return HOLIDAYS.has(toDateString(date))
}

export function isBusinessDay(date) {
  return !isWeekend(date) && !isHoliday(date)
}

export function businessDaysBetween(startDate, endDate) {
  let count = 0
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current < end) {
    if (isBusinessDay(current)) count++
    current.setDate(current.getDate() + 1)
  }

  return count
}

export function isDeadlineWithinBusinessDays(deadline, days) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const remaining = businessDaysBetween(today, new Date(deadline))
  return remaining >= 0 && remaining <= days
}

export function isOverdue(deadline) {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}