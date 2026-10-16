/**
 * מודל נתוני ההוצאות. ראו spec.md סעיף 4 — "טיפול בהוצאות מעורבות".
 * תומך בהזנה ידנית וגם בייבוא מדוח Morning (CSV) — שתי הדרכים מזינות
 * את אותה רשימה אחידה, וכל הוצאה ניתנת לעריכה (תדירות/מקור תשלום) בלי
 * קשר לאיך שנכנסה לרשימה.
 */

/** תדירות ההוצאה — קובעת איך "פורסים" אותה על פני החודשים (החלקת תזרים). */
export type ExpenseFrequency = 'one_time' | 'monthly' | 'bi_monthly' | 'annual'

/** מקור התשלום בפועל — לצורך מנגנון "הלוואת בעלים". */
export type PaymentSource = 'business' | 'private'

/** מאיפה ההוצאה הגיעה לרשימה — לתצוגה בלבד (תג "מיובא ממורנינג" וכו'). */
export type ExpenseImportSource = 'manual' | 'morning'

export interface Expense {
  id: string
  description: string
  /** הסכום המלא כפי ששולם בפועל, בש"ח (לא מוחלק לפי תדירות) */
  amount: number
  /**
   * מע"מ תשומות מוכר לקיזוז, בש"ח (לא מוחלק). 0 עבור הזנה ידנית שבה
   * האחוז המוכר לא ידוע — בדוח Morning זהו נתון מדויק לפי סיווג הרו"ח
   * ("סכום מע"מ מוכר" בקובץ), ומשמש את מנוע המע"מ במקום קירוב גורף.
   */
  vatAmount: number
  /** קטגוריית ההוצאה כפי שסווגה (למשל "הוצאות תקשורת וטלפון") — לתצוגה */
  category: string | null
  frequency: ExpenseFrequency
  source: PaymentSource
  importSource: ExpenseImportSource
  createdAt: string
}

export const EXPENSE_FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  one_time: 'חד־פעמי',
  monthly: 'חודשי',
  bi_monthly: 'דו־חודשי',
  annual: 'שנתי',
}

/** המחלק שבאמצעותו "פורסים" את ההוצאה לערך חודשי יציב (החלקת תזרים). */
const FREQUENCY_DIVISOR: Record<ExpenseFrequency, number> = {
  one_time: 1,
  monthly: 1,
  bi_monthly: 2,
  annual: 12,
}

/** השווי החודשי "המוחלק" של הוצאה — זה הערך שנכנס לחישובי תזרים חודשי יציב. */
export function monthlyEquivalent(expense: Pick<Expense, 'amount' | 'frequency'>): number {
  return expense.amount / FREQUENCY_DIVISOR[expense.frequency]
}

/** אותה פריסה חודשית, עבור רכיב המע"מ המוכר לקיזוז של ההוצאה. */
export function monthlyVatEquivalent(expense: Pick<Expense, 'vatAmount' | 'frequency'>): number {
  return expense.vatAmount / FREQUENCY_DIVISOR[expense.frequency]
}
