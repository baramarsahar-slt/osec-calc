import { currentMonthKey } from '../hooks/useMonthlyIncome'

/** תחילת הטווח הנתמך לבחירת חודש — אין צורך ללכת אחורה משנה זו. */
const EARLIEST_SUPPORTED_YEAR = 2026

export interface MonthOption {
  key: string // "2026-09"
  label: string // "ספטמבר 2026"
}

/**
 * רשימת החודשים הנבחרים לעמוד "החודש שלי": מינואר 2026 ועד החודש הנוכחי
 * בפועל (כולל) — לא כולל חודשים עתידיים, כי זו הזנת נתונים בפועל, לא תחזית.
 * מוחזר מהחדש לישן (כדי שהחודש הנוכחי יהיה ראשון ברשימה).
 */
export function getSelectableMonths(today = new Date()): MonthOption[] {
  const months: MonthOption[] = []
  let year = today.getFullYear()
  let month = today.getMonth() + 1 // 1-12

  while (year > EARLIEST_SUPPORTED_YEAR || (year === EARLIEST_SUPPORTED_YEAR && month >= 1)) {
    const date = new Date(year, month - 1, 1)
    months.push({
      key: currentMonthKey(date),
      label: date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' }),
    })
    month -= 1
    if (month === 0) {
      month = 12
      year -= 1
    }
  }

  return months
}
