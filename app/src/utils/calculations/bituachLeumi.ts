import type { UserProfile } from '../../types/profile'
import {
  BITUACH_LEUMI_CEILING_MONTHLY_2026,
  BITUACH_LEUMI_THRESHOLD_MONTHLY_2026,
  SELF_EMPLOYED_BL_RATE_ABOVE_THRESHOLD,
  SELF_EMPLOYED_BL_RATE_BELOW_THRESHOLD,
  SELF_EMPLOYED_MINIMUM_MONTHLY_BASE_2026,
} from './constants2026'

export interface BituachLeumiEstimate {
  /** הבסיס החודשי שעליו בפועל חושב התשלום (אחרי הפעלת מינימום/תקרה) */
  calculationBase: number
  monthlyPayment: number
  /** true אם הבסיס הועלה למינימום החוקי (הרווח בפועל היה נמוך ממנו) */
  minimumBaseApplied: boolean
}

/**
 * אומדן דמי ביטוח לאומי ובריאות חודשיים לעצמאי, לפי טבלת האחוזים הרשמית
 * ל-2026 (ראו constants2026.ts). זהו קירוב לפי הרווח כפי שהוא — הביטוח הלאומי
 * עצמו מבצע התאמות נוספות לבסיס (למשל הפחתה בגין הפקדות פנסיה) שאינן
 * משוחזרות כאן במלואן; למספר הרשמי המדויק יש להשתמש במחשבון הביטוח הלאומי.
 */
export function estimateBituachLeumi(monthlyProfit: number, profile: UserProfile): BituachLeumiEstimate {
  if (!profile.bituachLeumi.meetsSelfEmployedDefinition) {
    return { calculationBase: 0, monthlyPayment: 0, minimumBaseApplied: false }
  }

  // תקרת ה-51,910 ₪: אין תוספת דמי ביטוח מעבר לסכום זה
  const profitAfterCeiling = Math.min(Math.max(0, monthlyProfit), BITUACH_LEUMI_CEILING_MONTHLY_2026)

  // בסיס מינימום (3,442 ₪) חל רק אם זהו העיסוק היחיד (אין הכנסה כשכיר/ה נוספת)
  const applyMinimum = !profile.bituachLeumi.hasEmployeeIncome
  const minimumBaseApplied = applyMinimum && profitAfterCeiling < SELF_EMPLOYED_MINIMUM_MONTHLY_BASE_2026
  const calculationBase = minimumBaseApplied ? SELF_EMPLOYED_MINIMUM_MONTHLY_BASE_2026 : profitAfterCeiling

  const belowThreshold = Math.min(calculationBase, BITUACH_LEUMI_THRESHOLD_MONTHLY_2026)
  const aboveThreshold = Math.max(0, calculationBase - BITUACH_LEUMI_THRESHOLD_MONTHLY_2026)

  const monthlyPayment =
    belowThreshold * SELF_EMPLOYED_BL_RATE_BELOW_THRESHOLD + aboveThreshold * SELF_EMPLOYED_BL_RATE_ABOVE_THRESHOLD

  return { calculationBase, monthlyPayment, minimumBaseApplied }
}
