const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

interface SafetyNetProgressProps {
  currentBalance: number
  targetAmount: number
  targetMonths: number
}

/**
 * מד התקדמות לכרית הביטחון העסקית. הטקסט המספרי תמיד נוכח לצד הצבע
 * (עיקרון נגישות: צבע לא נושא מידע לבדו). הפס עצמו נעצר ב-100%, אבל
 * הטקסט מציג את האחוז האמיתי גם כשעוברים את היעד (למשל 180%).
 */
export function SafetyNetProgress({ currentBalance, targetAmount, targetMonths }: SafetyNetProgressProps) {
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
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-brown">
          {currency.format(currentBalance)} מתוך יעד {currency.format(targetAmount)} ({targetMonths} חודשי הוצאות)
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
