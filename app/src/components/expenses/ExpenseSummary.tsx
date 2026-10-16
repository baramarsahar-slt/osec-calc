const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

interface ExpenseSummaryProps {
  totalMonthlyEquivalent: number
  businessMonthlyEquivalent: number
  privateLoanMonthlyEquivalent: number
}

/**
 * סיכום ההוצאות החודשיות (אחרי החלקת תזרים) + "הלוואת בעלים": הסכום שהעסק
 * חייב להחזיר כי שולם בפועל מהחשבון הפרטי. ראו spec.md סעיף 4.3.
 */
export function ExpenseSummary({
  totalMonthlyEquivalent,
  businessMonthlyEquivalent,
  privateLoanMonthlyEquivalent,
}: ExpenseSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-brand-md bg-beige p-4">
        <p className="text-sm font-semibold text-brown">סך הוצאות חודשי (מוחלק)</p>
        <p className="mt-1 font-heading text-xl font-bold text-ink" dir="ltr">
          {currency.format(totalMonthlyEquivalent)}
        </p>
      </div>
      <div className="rounded-brand-md bg-beige p-4">
        <p className="text-sm font-semibold text-brown">מתוכו שולם מהעסק</p>
        <p className="mt-1 font-heading text-xl font-bold text-ink" dir="ltr">
          {currency.format(businessMonthlyEquivalent)}
        </p>
      </div>
      <div className="rounded-brand-md border-2 border-terra-deep bg-beige p-4">
        <p className="text-sm font-semibold text-brown">הלוואת בעלים — להחזרה</p>
        <p className="mt-1 font-heading text-xl font-bold text-terra-deep" dir="ltr">
          {currency.format(privateLoanMonthlyEquivalent)}
        </p>
        <p className="mt-1 text-xs text-taupe">
          הוצאות עסקיות ששולמו מהחשבון הפרטי — מתווסף למשיכת השכר המומלצת
        </p>
      </div>
    </div>
  )
}
