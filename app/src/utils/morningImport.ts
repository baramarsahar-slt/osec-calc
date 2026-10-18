import Papa from 'papaparse'
import type { NewExpenseInput } from '../hooks/useExpenses'

/**
 * פרסור דוח הוצאות מיוצא מ-Morning (CSV, כותרות בעברית). מבנה הכותרות
 * אומת מול קובץ דוגמה אמיתי שהועלה לפרויקט (Expenses.01.10.2026-31.10.2026.csv).
 *
 * שדות שאנחנו קוראים בפועל:
 *  - "ספק"               → שם ההוצאה/ההוצאה (vendor)
 *  - "תיאור חשבון הוצאה"  → קטגוריה
 *  - "סכום כולל"          → הסכום הכולל ששולם, בש"ח (אחרי המרת מטבע אם רלוונטי)
 *  - "סכום מע"מ מוכר"     → מע"מ תשומות מוכר לקיזוז, בש"ח — נתון מדויק מהרו"ח,
 *                           לא קירוב. זה מה שמזין את מנוע המע"מ במקום הערכה גורפת.
 *
 * שורה בלי ספק/קטגוריה, או עם סכום 0/לא מספרי, נספרת כ"שורה שנפסלה" ולא
 * נכנסת לרשימה — כדי לא לשבש את הסכומים בשקט.
 */

const VENDOR_COLUMN = 'ספק'
const CATEGORY_COLUMN = 'תיאור חשבון הוצאה'
const TOTAL_AMOUNT_COLUMN = 'סכום כולל'
// שימו לב: הגרש כאן הוא גרשיים עבריים (״, U+05F4), לא מרכאות ASCII רגילות —
// כך בדיוק מופיעה הכותרת בקובץ המקור של Morning.
const RECOGNIZED_VAT_COLUMN = 'סכום מע״מ מוכר'

export interface MorningImportResult {
  expenses: NewExpenseInput[]
  totalRows: number
  skippedRows: number
  /** כשהקובץ לא נראה כמו דוח Morning תקין (חסרות עמודות מפתח) */
  formatError: boolean
}

function parseHebrewNumber(raw: string | undefined): number {
  if (!raw) return 0
  // הסרת פסיקים מפרידי-אלפים ורווחים, ליתר ביטחון
  const cleaned = raw.replace(/,/g, '').trim()
  const value = Number.parseFloat(cleaned)
  return Number.isFinite(value) ? value : 0
}

export function parseMorningCsv(csvText: string): MorningImportResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  const headers = parsed.meta.fields ?? []
  const hasRequiredColumns =
    headers.includes(VENDOR_COLUMN) && headers.includes(CATEGORY_COLUMN) && headers.includes(TOTAL_AMOUNT_COLUMN)

  if (!hasRequiredColumns) {
    return { expenses: [], totalRows: 0, skippedRows: 0, formatError: true }
  }

  const rows = parsed.data
  const expenses: NewExpenseInput[] = []
  let skippedRows = 0

  for (const row of rows) {
    const vendor = (row[VENDOR_COLUMN] ?? '').trim()
    const category = (row[CATEGORY_COLUMN] ?? '').trim()
    const amount = parseHebrewNumber(row[TOTAL_AMOUNT_COLUMN])
    const vatAmount = parseHebrewNumber(row[RECOGNIZED_VAT_COLUMN])

    const description = vendor || category

    if (!description || !amount) {
      skippedRows++
      continue
    }

    expenses.push({
      description,
      amount,
      vatAmount,
      category: category || null,
      // ברירת מחדל סבירה לשורת דוח חודשי: עסקה שתועדה בפועל באותו חודש,
      // ששולמה מהעסק. המשתמשת יכולה לשנות כל שדה אחרי הייבוא.
      frequency: 'monthly',
      source: 'business',
      importSource: 'morning',
    })
  }

  return { expenses, totalRows: rows.length, skippedRows, formatError: false }
}
