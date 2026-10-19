const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

interface FinalDrawCardProps {
  baseDraw: number
  privateLoanAmount: number
}

/**
 * הסכום הסופי להעברה בפועל מחשבון העסק לחשבון הפרטי: בסיס המשיכה שנבחר
 * בסרגל + החזר הלוואת הבעלים — מתעדכן אוטומטית עם שינוי הבחירה בסרגל.
 */
export function FinalDrawCard({ baseDraw, privateLoanAmount }: FinalDrawCardProps) {
  const total = baseDraw + privateLoanAmount

  return (
    <div className="rounded-brand-lg bg-ink p-6 text-center">
      <p className="font-heading text-2xl font-extrabold text-beige">סכום סופי להעברה</p>
      <p className="mt-2 font-heading text-4xl font-bold text-beige" dir="ltr">
        {currency.format(total)}
      </p>
      {privateLoanAmount > 0 && (
        <p className="mt-2 text-sm text-taupe-light">
          ({currency.format(baseDraw)} משיכה + {currency.format(privateLoanAmount)} החזר הלוואת בעלים)
        </p>
      )}
    </div>
  )
}
