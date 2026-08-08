/**
 * Date-range filters for reporting screens (creator orders, and anything else
 * that offers a today/week/month/year toggle).
 *
 * Everything here is anchored to IST, not to the server clock. The store sells
 * in India, so "today" has to mean the seller's today: a Vercel function runs
 * in UTC, and between 18:30 and 00:00 IST a naive `new Date()` has already
 * rolled over to the next UTC day — an evening order would drop out of the
 * "Today" filter that was meant to show it.
 *
 * The boundaries returned are UTC ISO strings, because `created_at` is stored
 * as timestamptz and Supabase compares them in UTC.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export const DATE_RANGES = ['today', 'week', 'month', 'year', 'all'] as const
export type DateRange = (typeof DATE_RANGES)[number]

/** Labels for the filter buttons. Calendar periods, not rolling windows. */
export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  all: 'All Time',
}

export function isDateRange(value: string | null | undefined): value is DateRange {
  return !!value && (DATE_RANGES as readonly string[]).includes(value)
}

/**
 * Start of the given range as a UTC ISO string, or `null` for "all time"
 * (and for anything unrecognised — an unknown filter should show everything
 * rather than silently hide orders).
 *
 * Weeks start Monday, matching how the shop reads its own week.
 */
export function rangeStartISO(range: string | null | undefined, now: Date = new Date()): string | null {
  if (!isDateRange(range) || range === 'all') return null

  // Shift into IST so the UTC getters below read as IST calendar fields.
  const ist = new Date(now.getTime() + IST_OFFSET_MS)
  const year = ist.getUTCFullYear()
  const month = ist.getUTCMonth()
  const date = ist.getUTCDate()

  let startIST: number

  switch (range) {
    case 'today':
      startIST = Date.UTC(year, month, date)
      break
    case 'week': {
      // getUTCDay() is 0 for Sunday; remap so Monday is 0 days back.
      const daysSinceMonday = (ist.getUTCDay() + 6) % 7
      startIST = Date.UTC(year, month, date - daysSinceMonday)
      break
    }
    case 'month':
      startIST = Date.UTC(year, month, 1)
      break
    case 'year':
      startIST = Date.UTC(year, 0, 1)
      break
  }

  // Shift the IST midnight back to the real UTC instant it corresponds to.
  return new Date(startIST - IST_OFFSET_MS).toISOString()
}

/* ------------------------------------------------------------------ *
 * Chart bucketing
 *
 * The same range picker also drives the dashboard chart, so the bucket
 * size has to follow the range — 3-hourly for a day, daily for a week or
 * month, monthly for a year. Buckets are built from the calendar (not by
 * adding fixed offsets to "now") so the axis reads as whole days/months.
 * ------------------------------------------------------------------ */

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export type ChartGranularity = 'hour' | 'day' | 'month' | 'year'
export type ChartPoint = { name: string; orders: number }

/** Shortest "all time" axis, so a one-month-old account still plots a trend. */
const MIN_ALL_TIME_MONTHS = 6

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function hourLabel(hour: number) {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

/** `Aug 26` — normalised through Date.UTC so month overflow rolls the year. */
function monthLabel(year: number, monthIndex: number, withYear: boolean) {
  const d = new Date(Date.UTC(year, monthIndex, 1))
  const name = MONTHS[d.getUTCMonth()]
  return withYear ? `${name} ${String(d.getUTCFullYear()).slice(2)}` : name
}

/** IST calendar fields for an instant. */
function istParts(at: Date) {
  const ist = new Date(at.getTime() + IST_OFFSET_MS)
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),
    date: ist.getUTCDate(),
    weekday: ist.getUTCDay(),
  }
}

/**
 * Group order timestamps into chart buckets for a range.
 *
 * `timestamps` may contain anything; values outside the range are ignored, so
 * callers can pass a slightly wider query result without skewing the chart.
 * Buckets are emitted even when empty — a flat stretch is information.
 */
export function bucketByRange(
  range: DateRange,
  timestamps: (string | null | undefined)[],
  now: Date = new Date()
): { points: ChartPoint[]; granularity: ChartGranularity } {
  const { year, month, date, weekday } = istParts(now)

  // Bucket boundaries in "IST space" (real ms + offset), one more than labels.
  const edges: number[] = []
  const labels: string[] = []
  let granularity: ChartGranularity = 'day'

  if (range === 'today') {
    granularity = 'hour'
    const start = Date.UTC(year, month, date)
    for (let i = 0; i < 8; i++) {
      edges.push(start + i * 3 * HOUR_MS)
      labels.push(hourLabel(i * 3))
    }
    edges.push(start + DAY_MS)
  } else if (range === 'week') {
    granularity = 'day'
    const monday = Date.UTC(year, month, date - ((weekday + 6) % 7))
    for (let i = 0; i < 7; i++) {
      edges.push(monday + i * DAY_MS)
      labels.push(WEEKDAYS[i])
    }
    edges.push(monday + 7 * DAY_MS)
  } else if (range === 'month') {
    granularity = 'day'
    // Day 0 of the next month is the last day of this one.
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    for (let day = 1; day <= daysInMonth; day++) {
      edges.push(Date.UTC(year, month, day))
      labels.push(String(day))
    }
    edges.push(Date.UTC(year, month, daysInMonth + 1))
  } else if (range === 'year') {
    granularity = 'month'
    for (let i = 0; i < 12; i++) {
      edges.push(Date.UTC(year, i, 1))
      labels.push(monthLabel(year, i, false))
    }
    edges.push(Date.UTC(year + 1, 0, 1))
  } else {
    // All time: start at the first order and bucket monthly, switching to
    // yearly once a monthly axis would be unreadable.
    const stamps = timestamps
      .map(t => (t ? new Date(t).getTime() : NaN))
      .filter(ms => Number.isFinite(ms))
    const earliest = stamps.length
      ? stamps.reduce((min, ms) => (ms < min ? ms : min), Infinity) + IST_OFFSET_MS
      : Date.UTC(year, month - (MIN_ALL_TIME_MONTHS - 1), 1)

    const first = new Date(earliest)
    let firstYear = first.getUTCFullYear()
    let firstMonth = first.getUTCMonth()
    let monthSpan = (year - firstYear) * 12 + (month - firstMonth) + 1

    // A brand-new creator's whole history is one month; a single bar reads as
    // a broken chart, so always show a run-up to it.
    if (monthSpan < MIN_ALL_TIME_MONTHS) {
      firstYear = year
      firstMonth = month - (MIN_ALL_TIME_MONTHS - 1)
      monthSpan = MIN_ALL_TIME_MONTHS
    }

    if (monthSpan > 24) {
      granularity = 'year'
      for (let y = firstYear; y <= year; y++) {
        edges.push(Date.UTC(y, 0, 1))
        labels.push(String(y))
      }
      edges.push(Date.UTC(year + 1, 0, 1))
    } else {
      granularity = 'month'
      for (let i = 0; i < monthSpan; i++) {
        edges.push(Date.UTC(firstYear, firstMonth + i, 1))
        labels.push(monthLabel(firstYear, firstMonth + i, true))
      }
      edges.push(Date.UTC(firstYear, firstMonth + monthSpan, 1))
    }
  }

  const points: ChartPoint[] = labels.map(name => ({ name, orders: 0 }))
  const first = edges[0]
  const last = edges[edges.length - 1]

  for (const timestamp of timestamps) {
    if (!timestamp) continue
    const ms = new Date(timestamp).getTime()
    if (!Number.isFinite(ms)) continue

    const istMs = ms + IST_OFFSET_MS
    if (istMs < first || istMs >= last) continue

    for (let i = 0; i < points.length; i++) {
      if (istMs < edges[i + 1]) {
        points[i].orders++
        break
      }
    }
  }

  return { points, granularity }
}

/** Axis caption for the chart, e.g. "Daily order volume · this month". */
export function chartCaption(range: DateRange, granularity: ChartGranularity) {
  const unit = { hour: 'Hourly', day: 'Daily', month: 'Monthly', year: 'Yearly' }[granularity]
  const period = range === 'all' ? 'all time' : DATE_RANGE_LABELS[range].toLowerCase()
  return `${unit} order volume · ${period}`
}
