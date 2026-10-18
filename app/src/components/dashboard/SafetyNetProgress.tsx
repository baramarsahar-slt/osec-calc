const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

interface SafetyNetProgressProps {
  currentBalance: number
  targetAmount: number
  targetMonths: number
}

/**
 * מד התקדמות לכרית הביטחון העסקית. הטקסט המספרי תמיד נוכח לצד הצבע
 * (עיקרון נגישות: צבע לא נושא מידע לבדו).
 */
export function SafetyNetProgress({ currentBalance, targetAmount, targetMonths }: SafetyNetProgressProps) {
  if (targetAmount <= 0) {
    return (
      <p className="text-sm text-taupe">
        עדיין אין מספיק נתוני הוצאות כדי לחשב יעד לכרית הביטחון — הזיני הוצאות חודשיות בעמוד "החודש שלי".
      </p>
    )
  }

  const percent = Math.max(0, Math.min(100, (currentBalance / targetAmount) * 100))
  const reachedTarget = currentBalance >= targetAmount

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-brown">
          {currency.format(currentBalance)} מתוך יעד {currency.format(targetAmount)} ({targetMonths} חודשי הוצאות)
        </span>
        <span className="text-sm font-bold text-ink">{Math.round(percent)}%</span>
      </div>
      <div
        className="h-4 w-full overflow-hidden rounded-full bg-beige"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="התקדמות כרית הביטחון"
      >
        <div
          className="h-full rounded-full bg-terra-deep transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-brown">
        {reachedTarget ? '✓ היעד הושג — הכרית מלאה.' : `נותרו ${currency.format(Math.max(0, targetAmount - currentBalance))} עד ליעד.`}
      </p>
    </div>
  )
}
