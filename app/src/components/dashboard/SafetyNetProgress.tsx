import { useState } from 'react'

const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

interface SafetyNetProgressProps {
  currentBalance: number
  targetAmount: number
  targetMonths: number
  onUpdateBalance: (amount: number) => void
}

/**
 * מד התקדמות לכרית הביטחון העסקית, עם עדכון יתרה ישיר מהדשבורד — היעד
 * נשאר הגדרת פרופיל יציבה, אבל היתרה בפועל משתנה מחודש לחודש ומתעדכנת
 * כאן, לא בפרופיל. הטקסט המספרי תמיד נוכח לצד הצבע (עיקרון נגישות: צבע
 * לא נושא מידע לבדו). הפס עצמו נעצר ב-100%, אבל הטקסט מציג את האחוז
 * האמיתי גם כשעוברים את היעד (למשל 180%).
 */
export function SafetyNetProgress({ currentBalance, targetAmount, targetMonths, onUpdateBalance }: SafetyNetProgressProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(String(currentBalance))

  const startEditing = () => {
    setDraftValue(String(currentBalance))
    setIsEditing(true)
  }

  const saveEdit = () => {
    const amount = Number(draftValue)
    if (!Number.isNaN(amount) && amount >= 0) onUpdateBalance(amount)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="safety-net-balance" className="text-sm font-semibold text-brown">
            יתרה נוכחית בכרית הביטחון (₪)
          </label>
          <input
            id="safety-net-balance"
            type="number"
            min={0}
            autoFocus
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
            className="w-full rounded-brand-sm border border-taupe-light bg-beige px-3 py-2 text-left text-ink"
            dir="ltr"
          />
        </div>
        <button
          type="button"
          onClick={saveEdit}
          className="rounded-brand-sm bg-terra-deep px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          שמירה
        </button>
      </div>
    )
  }

  if (targetAmount <= 0) {
    return (
      <p className="text-sm text-taupe">
        עדיין אין מספיק נתוני הוצאות כדי לחשב יעד לכרית הביטחון — הזיני הוצאות חודשיות בעמוד "החודש שלי".
      </p>
    )
  }

  const rawPercent = (currentBalance / targetAmount) * 100
  const barPercent = Math.max(0, Math.min(100, rawPercent))
  const reachedTarget = currentBalance >= targetAmount

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-brown">
          {currency.format(currentBalance)} מתוך יעד {currency.format(targetAmount)} ({targetMonths} חודשי הוצאות)
          <button type="button" onClick={startEditing} className="mr-2 text-xs font-semibold text-terra-deep underline">
            עדכון יתרה
          </button>
        </span>
        <span className="text-sm font-bold text-ink">{Math.round(Math.max(0, rawPercent))}%</span>
      </div>
      <div
        className="h-4 w-full overflow-hidden rounded-full bg-beige"
        role="progressbar"
        aria-valuenow={Math.round(barPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="התקדמות כרית הביטחון"
      >
        <div className="h-full rounded-full bg-terra-deep transition-[width]" style={{ width: `${barPercent}%` }} />
      </div>
      <p className="text-sm text-brown">
        {reachedTarget
          ? rawPercent > 100
            ? `✓ מעל היעד ב-${Math.round(rawPercent - 100)}% (${currency.format(currentBalance - targetAmount)} מעבר ליעד).`
            : '✓ היעד הושג — הכרית מלאה.'
          : `נותרו ${currency.format(Math.max(0, targetAmount - currentBalance))} עד ליעד.`}
      </p>
      <p className="text-xs text-taupe">
        טיפ: שווה לשמור את כרית הביטחון בפיקדון יומי נזיל, לא בעו״ש — כך היא לא "נראית" ככסף פנוי ליומיום.
      </p>
    </div>
  )
}
