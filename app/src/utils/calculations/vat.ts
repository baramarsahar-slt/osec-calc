import type { BusinessStatus } from '../../types/profile'
import { VAT_RATE_2026 } from './constants2026'

/**
 * דיווח מע"מ בישראל הוא דו-חודשי עבור רוב העוסקים המורשים (ראו spec.md
 * סעיף "כללי דיווח מע"מ"): בחודש אי-זוגי צוברים בלי דרישת תשלום מיידית,
 * ובחודש זוגי (חודש הדיווח) מאחדים את שני החודשים, מקזזים תשומות מול
 * עסקאות, ומפיקים סכום סופי לתשלום/החזר.
 *
 * שיעור המע"מ (18%, VERIFIED — אושר במפורש ע"י המשתמשת) מוגדר ב-constants2026.ts.
 */

export interface MonthVatInputs {
  /** הכנסה ברוטו כפי שהוזנה (כוללת מע"מ, אם רלוונטי) */
  grossIncome: number
  /** הוצאות עסקיות (לא כולל הוצאות ששולמו מהפרטי) — כוללות מע"מ תשומות */
  businessExpenses: number
  /**
   * מע"מ תשומות מוכר לקיזוז, מדויק (לא מוערך) — כשידוע, למשל מסכימת
   * "מע"מ מוכר" שמגיעה ישירות מדוח Morning לכל שורת הוצאה. כשלא מסופק,
   * המע"מ המוכר מוערך גורפית לפי 18% מתוך businessExpenses (קירוב).
   */
  businessExpensesDeductibleVat?: number
}

export interface VatEstimate {
  /** false אצל עוסק פטור — אין גביית/קיזוז מע"מ כלל */
  applicable: boolean
  isOddMonth: boolean
  /** true בחודש הדיווח (זוגי) — זה הסכום שיש להעביר בפועל לרשות המסים */
  isReportingMonth: boolean
  /** מע"מ עסקאות (פלט) לתקופת הדיווח הרלוונטית */
  periodOutputVat: number
  /** מע"מ תשומות (קיזוז) לתקופת הדיווח הרלוונטית */
  periodInputVat: number
  /** הסכום הסופי לתשלום (חיובי) או להחזר (שלילי) — תקף רק בחודש הדיווח */
  netPayable: number
  /** בחודש אי-זוגי בלבד: הסכום שכדאי "להפריש בצד" עד חודש הדיווח */
  accruedHoldAmount: number
}

function extractVatPortion(grossAmount: number): number {
  return grossAmount - grossAmount / (1 + VAT_RATE_2026)
}

/** מע"מ תשומות לחודש נתון: מדויק אם סופק, אחרת קירוב גורף לפי 18% */
function resolveInputVat(month: MonthVatInputs): number {
  return month.businessExpensesDeductibleVat ?? extractVatPortion(month.businessExpenses)
}

export function computeVat(
  businessStatus: BusinessStatus,
  monthNumber: number,
  currentMonth: MonthVatInputs,
  previousMonth: MonthVatInputs | null,
): VatEstimate {
  const applicable = businessStatus !== 'exempt'
  const isOddMonth = monthNumber % 2 === 1
  const isReportingMonth = !isOddMonth

  if (!applicable) {
    return {
      applicable: false,
      isOddMonth,
      isReportingMonth,
      periodOutputVat: 0,
      periodInputVat: 0,
      netPayable: 0,
      accruedHoldAmount: 0,
    }
  }

  const currentOutput = extractVatPortion(currentMonth.grossIncome)
  const currentInput = resolveInputVat(currentMonth)

  if (isOddMonth) {
    // חודש ראשון בתקופה: צוברים, בלי דרישת תשלום מיידית
    return {
      applicable,
      isOddMonth,
      isReportingMonth,
      periodOutputVat: currentOutput,
      periodInputVat: currentInput,
      netPayable: 0,
      accruedHoldAmount: currentOutput - currentInput,
    }
  }

  // חודש זוגי = חודש הדיווח: מאחדים עם החודש הקודם (אם קיים)
  const prevOutput = previousMonth ? extractVatPortion(previousMonth.grossIncome) : 0
  const prevInput = previousMonth ? resolveInputVat(previousMonth) : 0

  const periodOutputVat = currentOutput + prevOutput
  const periodInputVat = currentInput + prevInput

  return {
    applicable,
    isOddMonth,
    isReportingMonth,
    periodOutputVat,
    periodInputVat,
    netPayable: periodOutputVat - periodInputVat,
    accruedHoldAmount: 0,
  }
}
