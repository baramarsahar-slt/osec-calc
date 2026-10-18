const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

interface PrivateLoanCardProps {
  amount: number
}

/** הצגה נפרדת ובולטת של "הלוואת בעלים" — הוצאות עסקיות ששולמו מהכיס הפרטי. */
export function PrivateLoanCard({ amount }: PrivateLoanCardProps) {
  if (amount <= 0) {
    return (
      <div className="rounded-brand-lg border border-taupe-light bg-beige p-4 text-sm text-taupe">
        אין החזר הלוואת בעלים לחודש זה — כל ההוצאות העסקיות סומנו כ"עסקי" בעמוד "החודש שלי".
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-brand-lg border-2 border-terra-deep bg-beige p-4">
      <div>
        <p className="font-heading font-bold text-ink">החזר הלוואת בעלים</p>
        <p className="mt-0.5 text-sm text-brown">
          הוצאות עסקיות ששולמו בפועל מהחשבון הפרטי — מגיע לך בחזרה, מעל ומעבר למשיכה הרגילה.
        </p>
      </div>
      <p className="shrink-0 font-heading text-2xl font-bold text-terra-deep" dir="ltr">
        {currency.format(amount)}
      </p>
    </div>
  )
}
