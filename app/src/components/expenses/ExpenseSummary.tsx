const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

interface ExpenseSummaryProps {
  totalActual: number
  businessActual: number
  privateLoanActual: number
}

/**
 * סיכום ההוצאות החודשיות **בפועל** (הסכום המלא ששולם, בלי שום פריסה/
 * "החלקה") + "הלוואת בעלים": הסכום שהעסק חייב להחזיר כי שולם בפועל
 * מהחשבון הפרטי. ראו spec.md סעיף 4.3.
 *
 * רקע כהה בולט במכוון, שונה לגמרי משורות ההוצאה (bg-beige) — זה סיכום
 * "שורה תחתונה", לא עוד פריט ברשימה.
 */
export function ExpenseSummary({ totalActual, businessActual, privateLoanActual }: ExpenseSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-brand-md bg-ink p-5">
        <p className="text-sm font-semibold text-taupe-light">סך הוצאות החודש</p>
        <p className="mt-1 font-heading text-3xl font-extrabold text-beige" dir="ltr">
          {currency.format(totalActual)}
        </p>
      </div>
      <div className="rounded-brand-md bg-ink p-5">
        <p className="text-sm font-semibold text-taupe-light">מתוכו שולם מהעסק</p>
        <p className="mt-1 font-heading text-3xl font-extrabold text-beige" dir="ltr">
          {currency.format(businessActual)}
        </p>
      </div>
      <div className="rounded-brand-md bg-terra-deep p-5">
        <p className="text-sm font-semibold text-white/85">הלוואת בעלים — להחזרה</p>
        <p className="mt-1 font-heading text-3xl font-extrabold text-white" dir="ltr">
          {currency.format(privateLoanActual)}
        </p>
        <p className="mt-1 text-xs text-white/85">
          הוצאות עסקיות ששולמו מהחשבון הפרטי — מתווסף למשיכת השכר המומלצת
        </p>
      </div>
    </div>
  )
}
