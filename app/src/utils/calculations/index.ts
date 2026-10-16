import type { UserProfile } from '../../types/profile'
import { estimateBituachLeumi, type BituachLeumiEstimate } from './bituachLeumi'
import { estimateIncomeTax, type IncomeTaxEstimate } from './incomeTax'
import { estimateIncomeTaxAdvance, type IncomeTaxAdvanceEstimate } from './incomeTaxAdvance'
import { estimatePension, type PensionEstimate } from './pension'
import { computeVat, type VatEstimate } from './vat'
import { VAT_RATE_2026 } from './constants2026'

export * from './constants2026'
export * from './incomeTax'
export * from './incomeTaxAdvance'
export * from './bituachLeumi'
export * from './pension'
export * from './vat'

export interface MonthlyFinancialsInput {
  profile: UserProfile
  monthNumber: number // 1–12
  grossIncome: number
  /** סך הוצאות עסקיות (לפי monthlyEquivalent) ששולמו בפועל מהחשבון העסקי */
  businessExpensesMonthly: number
  /** סך הוצאות עסקיות (לפי monthlyEquivalent) ששולמו בפועל מהחשבון הפרטי — הלוואת בעלים */
  privateLoanMonthly: number
  /**
   * מע"מ תשומות מוכר לקיזוז, מדויק (למשל מסכום "מע"מ מוכר" בייבוא Morning).
   * אם לא סופק, מנוע המע"מ יעריך אותו גורפית לפי 18% מתוך businessExpensesMonthly.
   */
  businessVatDeductibleMonthly?: number
  /** נתוני החודש הקודם, לצורך איחוד דו-חודשי של מע"מ. null אם אין היסטוריה */
  previousMonth: {
    grossIncome: number
    businessExpensesMonthly: number
    businessVatDeductibleMonthly?: number
  } | null
}

export interface MonthlyFinancials {
  turnoverExclVat: number
  /** רווח חייב במס, אחרי ניכוי כלל ההוצאות העסקיות המוכרות (כולל אלו ששולמו מהפרטי) */
  taxableProfit: number

  vat: VatEstimate
  incomeTax: IncomeTaxEstimate
  incomeTaxAdvance: IncomeTaxAdvanceEstimate
  bituachLeumi: BituachLeumiEstimate
  pension: PensionEstimate

  /** מה שנשאר בחשבון העסק אחרי הוצאות עסקיות וכלל התשלומים הסטטוטוריים */
  cashAfterStatutoryPayments: number
  /** הסכום המומלץ למשיכה אישית: cashAfterStatutoryPayments + החזר הלוואת בעלים */
  recommendedDraw: number
}

/** מוציא את רכיב המע"מ מתוך סכום ברוטו (VERIFIED, 18% — ראו constants2026.ts) */
function excludeVat(grossAmount: number, businessStatus: UserProfile['businessStatus']): number {
  if (businessStatus === 'exempt') return grossAmount
  return grossAmount / (1 + VAT_RATE_2026)
}

/**
 * מחשב את כל התמונה הפיננסית של חודש נתון, על בסיס פרופיל המשתמשת
 * ונתוני ההכנסה/הוצאות שהוזנו. זוהי נקודת הכניסה היחידה שאמורה לשמש
 * את הדשבורד — כל לוגיקת המס/ביטוח לאומי/פנסיה/מע"מ ממוקדת כאן.
 */
export function computeMonthlyFinancials(input: MonthlyFinancialsInput): MonthlyFinancials {
  const {
    profile,
    monthNumber,
    grossIncome,
    businessExpensesMonthly,
    privateLoanMonthly,
    businessVatDeductibleMonthly,
    previousMonth,
  } = input

  const turnoverExclVat = excludeVat(grossIncome, profile.businessStatus)

  // ההוצאות המוכרות לצורך רווח חייב כוללות גם את אלו ששולמו מהפרטי —
  // הן עדיין עלות עסקית אמיתית, רק שמומנה מכיס פרטי (ראו "הלוואת בעלים").
  const totalRecognizedExpenses = businessExpensesMonthly + privateLoanMonthly
  const expensesExclVat = excludeVat(totalRecognizedExpenses, profile.businessStatus)
  const taxableProfit = turnoverExclVat - expensesExclVat

  const vat = computeVat(
    profile.businessStatus,
    monthNumber,
    {
      grossIncome,
      businessExpenses: businessExpensesMonthly,
      businessExpensesDeductibleVat: businessVatDeductibleMonthly,
    },
    previousMonth
      ? {
          grossIncome: previousMonth.grossIncome,
          businessExpenses: previousMonth.businessExpensesMonthly,
          businessExpensesDeductibleVat: previousMonth.businessVatDeductibleMonthly,
        }
      : null,
  )

  const incomeTax = estimateIncomeTax(taxableProfit, profile)
  const incomeTaxAdvance = estimateIncomeTaxAdvance(turnoverExclVat, taxableProfit, profile)
  const bituachLeumi = estimateBituachLeumi(taxableProfit, profile)
  const pension = estimatePension(taxableProfit, profile)

  const vatPayableThisMonth = vat.applicable && vat.isReportingMonth ? vat.netPayable : 0

  const cashAfterStatutoryPayments =
    grossIncome -
    businessExpensesMonthly -
    incomeTaxAdvance.advanceAmount -
    bituachLeumi.monthlyPayment -
    pension.actualMonthlyDeposit -
    pension.studyFundDeductibleMonthly -
    vatPayableThisMonth

  const recommendedDraw = cashAfterStatutoryPayments + privateLoanMonthly

  return {
    turnoverExclVat,
    taxableProfit,
    vat,
    incomeTax,
    incomeTaxAdvance,
    bituachLeumi,
    pension,
    cashAfterStatutoryPayments,
    recommendedDraw,
  }
}
