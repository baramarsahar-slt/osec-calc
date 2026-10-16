import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { parseMorningCsv } from '../../utils/morningImport'
import type { NewExpenseInput } from '../../hooks/useExpenses'

interface MorningImportProps {
  onImport: (expenses: NewExpenseInput[]) => void
}

type ImportFeedback =
  | { kind: 'success'; count: number; skipped: number }
  | { kind: 'format-error' }
  | { kind: 'empty' }

/**
 * ייבוא דוח הוצאות מ-Morning (CSV). עובד **לצד** ההזנה הידנית, לא במקומה —
 * כל הוצאה שיובאה נכנסת לאותה רשימה בדיוק כמו הוצאה שהוזנה ידנית, וניתנת
 * לעריכת תדירות/מקור תשלום באותו אופן (ראו ExpenseList).
 */
export function MorningImport({ onImport }: MorningImportProps) {
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // מאפסים את ה-input מיד, כדי שאפשר יהיה להעלות שוב את אותו קובץ בעתיד
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text !== 'string') return

      const result = parseMorningCsv(text)

      if (result.formatError) {
        setFeedback({ kind: 'format-error' })
        return
      }
      if (result.expenses.length === 0) {
        setFeedback({ kind: 'empty' })
        return
      }

      onImport(result.expenses)
      setFeedback({ kind: 'success', count: result.expenses.length, skipped: result.skippedRows })
    }
    reader.onerror = () => setFeedback({ kind: 'format-error' })
    reader.readAsText(file, 'utf-8')
  }

  return (
    <div className="flex flex-col gap-2 rounded-brand-md border border-dashed border-taupe-light bg-beige p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brown">ייבוא דוח הוצאות מ-Morning (CSV)</p>
          <p className="mt-0.5 text-xs text-taupe">
            מוסיף לרשימה הקיימת — לא מוחק הוצאות שכבר הוזנו ידנית. אחרי הייבוא אפשר לערוך תדירות ומקור תשלום לכל שורה.
          </p>
        </div>
        <label className="relative shrink-0 cursor-pointer rounded-brand-sm bg-terra-deep px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          בחירת קובץ CSV
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="ייבוא דוח הוצאות מ-Morning"
          />
        </label>
      </div>

      {feedback?.kind === 'success' && (
        <p className="text-sm font-medium text-ink">
          יובאו {feedback.count} הוצאות בהצלחה.
          {feedback.skipped > 0 && ` (${feedback.skipped} שורות נפסלו — חסר בהן ספק/קטגוריה או שהסכום היה 0.)`}
        </p>
      )}
      {feedback?.kind === 'empty' && (
        <p className="text-sm font-medium text-terra-deep">
          הקובץ נקרא בהצלחה אך לא נמצאו בו שורות תקינות לייבוא.
        </p>
      )}
      {feedback?.kind === 'format-error' && (
        <p className="text-sm font-medium text-terra-deep">
          הקובץ לא זוהה כדוח הוצאות של Morning (חסרות בו עמודות מפתח). ודאי שזה קובץ ה-CSV
          המקורי שיוצא מהמערכת, בלי עריכה.
        </p>
      )}
    </div>
  )
}
