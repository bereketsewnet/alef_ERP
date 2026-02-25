/**
 * Ethiopian (EC) and Gregorian (GC) calendar conversion.
 * Used on Billing & Invoices page only. EC has 12 months of 30 days + Pagume (5 or 6 days).
 */

export type CalendarType = 'EC' | 'GC'

export interface EthiopianDate {
  year: number
  month: number
  day: number
}

const ETH_MONTH_NAMES = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Meyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
]

/** Gregorian to Julian Day Number (integer part, noon-based). */
function gregorianToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12)
  const yy = y + 4800 - a
  const mm = m + 12 * a - 3
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045
}

/** Julian Day Number to Gregorian. */
function jdnToGregorian(jdn: number): { y: number; m: number; d: number } {
  const a = jdn + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)
  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * d) / 4)
  const m = Math.floor((5 * e + 2) / 153)
  const y = 100 * b + d - 4800 + Math.floor(m / 10)
  const month = m + 3 - 12 * Math.floor(m / 10)
  const day = e - Math.floor((153 * month + 2) / 5) + 1
  return { y: y, m: month, d: day }
}

/** Convert Gregorian date to Ethiopian. Reference: 1 Meskerem 1 EC = 11 Sep 8 CE (Gregorian). */
export function toEthiopian(d: Date): EthiopianDate {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const jdn = gregorianToJdn(y, m, day)
  // JDN for 1 Meskerem 1 EC (approx 11 Sep 8 CE) = 1724221; EC year 1 has 365 days, then 366 every 4th
  const jdnEpoch = 1724221
  const n = jdn - jdnEpoch
  const year = Math.floor((4 * n + 3) / 1461) + 1
  const dInYear = n - Math.floor((1461 * (year - 1)) / 4)
  const month = Math.min(13, Math.floor(dInYear / 30) + 1)
  const dayInMonth = dInYear - (month - 1) * 30 + 1 // 1-based day
  return { year, month, day: dayInMonth }
}

/** Convert Ethiopian date to Gregorian (returns ISO date string YYYY-MM-DD for form/API). */
export function fromEthiopian(eth: EthiopianDate): string {
  const { year, month, day } = eth
  const jdnEpoch = 1724221
  const n = Math.floor((1461 * (year - 1)) / 4) + (month - 1) * 30 + (day - 1)
  const jdn = jdnEpoch + n
  const g = jdnToGregorian(jdn)
  const d = new Date(g.y, g.m - 1, g.d)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Format Ethiopian date for display (e.g. "12 Meskerem 2017"). */
export function formatEthiopian(eth: EthiopianDate): string {
  const name = ETH_MONTH_NAMES[eth.month - 1] ?? String(eth.month)
  return `${eth.day} ${name} ${eth.year}`
}

/** Format a Gregorian ISO date string for display (locale). */
export function formatGregorian(isoDate: string): string {
  if (!isoDate) return ''
  return new Date(isoDate + 'Z').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Format a date for display on Billing & Invoices page using the client's calendar.
 * isoDate: YYYY-MM-DD from API (always stored in Gregorian).
 */
export function formatDateByCalendar(isoDate: string | undefined | null, calendar: CalendarType | undefined | null): string {
  if (!isoDate) return ''
  const cal = calendar === 'EC' ? 'EC' : 'GC'
  if (cal === 'EC') {
    const d = new Date(isoDate + 'T12:00:00Z')
    const eth = toEthiopian(d)
    return formatEthiopian(eth) + ' (EC)'
  }
  return formatGregorian(isoDate) + ' (GC)'
}

/** Get Ethiopian month name by 1-based month number. */
export function getEthiopianMonthName(month: number): string {
  return ETH_MONTH_NAMES[month - 1] ?? String(month)
}

/** Number of days in Ethiopian month (1-12 => 30, 13 => 5 or 6). */
export function ethiopianMonthDays(year: number, month: number): number {
  if (month <= 12) return 30
  return (year % 4 === 3) ? 6 : 5
}

/** Build array of years for Ethiopian dropdown (e.g. current EC year ± 2). */
export function ethiopianYearRange(aroundGregorianYear: number): number[] {
  const d = new Date(aroundGregorianYear, 5, 15) // mid-year
  const eth = toEthiopian(d)
  const y = eth.year
  return [y - 2, y - 1, y, y + 1, y + 2]
}
