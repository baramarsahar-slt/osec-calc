import type { UserProfile } from '../types/profile'
import { estimateIncomeTax, VAT_RATE_2026 } from './calculations'

/**
 * בדיקת התאמה בין קצב המקדמות בפועל (מה שמשולם היום) לבין האחוז שבאמת
 * צפוי להידרש, בהינתן ביצועי השנה עד כה. ראו spec.md: "אם יש חוסר הלימה
 * בין המקדמות לסכומים הריאליים, יש להתריע".
 *
 * מתודולוגיה (לפי בחירת המשתמשת): תחזית מחזור שנתי = ממוצע פשוט של
 * ההכנסה שהוזנה השנה, מוכפל ב-12. לא טוענת לדייק — זו הערכת-בטן, לא
 * תחליף לחישוב רו"ח אמיתי. מוצגת רק כשיש לפחות 2 חודשים של נתונים
 * אמיתיים השנה, כדי לא להציג מספר לא יציב מחודש בודד.
 */

const MINIMUM_MONTHS_FOR_PROJECTION = 2
/** פער מינימלי (בנקודות אחוז) כדי לטרוח ולהתריע — פערים זניחים לא מוצגים */
const SIGNIFICANT_GAP_THRESHOLD_POINTS = 1

export interface AdvanceRateCheckResult {
  monthsEntered: number
  /**
   * תחזית מחזור שנתי **ללא מע"מ** — זה הבסיס שעליו באמת מחושב אחוז
   * המקדמה (ראו מסמך המחקר: "מכפילים את המחזור... ללא מע\"מ"). לא כולל
   * את רכיב המע"מ שנגבה מלקוחות, כדי לא להציג מספר מנופח/מטעה.
   */
  projectedAnnualTurnoverExclVat: number
  /** האחוז שבאמת נדרש, לפי התחזית — ללא שום מרווח ביטחון של אסטרטגיה */
  neededRatePercent: number
  /** האחוז שבפועל משולם היום (רשמי אם קיים, אחרת ההערכה המותאמת-אסטרטגיה) */
  actualRatePercent: number
  /** neededRatePercent פחות actualRatePercent — חיובי = משלמת פחות מדי */
  gapPercentPoints: number
  isSignificantGap: boolean
}

function excludeVat(grossAmount: number, businessStatus: UserProfile['businessStatus']): number {
  if (businessStatus === 'exempt') return grossAmount
  return grossAmount / (1 + VAT_RATE_2026)
}

export interface MonthlyActualsForYear {
  monthKey: string // "YYYY-MM"
  grossIncome: number
  businessExpensesActual: number
}

/**
 * @param monthsThisYear כל החודשים שהוזנה בהם הכנסה השנה (רק שנת המס הנוכחית)
 * @param actualAdvanceRatePercent האחוז שבפועל נכנס לחישוב ההמלצה החודשית היום
 */
export function checkAdvanceRateAlignment(
  profile: UserProfile,
  monthsThisYear: MonthlyActualsForYear[],
  actualAdvanceRatePercent: number,
): AdvanceRateCheckResult | null {
  const monthsEntered = monthsThisYear.length
  if (monthsEntered < MINIMUM_MONTHS_FOR_PROJECTION) return null

  const ytdRevenue = monthsThisYear.reduce((sum, m) => sum + m.grossIncome, 0)
  const ytdExpenses = monthsThisYear.reduce((sum, m) => sum + m.businessExpensesActual, 0)

  const projectedAnnualRevenue = (ytdRevenue / monthsEntered) * 12
  const projectedAnnualExpenses = (ytdExpenses / monthsEntered) * 12

  const projectedAnnualTurnoverExclVat = excludeVat(projectedAnnualRevenue, profile.businessStatus)
  const projectedAnnualExpensesExclVat = excludeVat(projectedAnnualExpenses, profile.businessStatus)
  const projectedAnnualProfit = projectedAnnualTurnoverExclVat - projectedAnnualExpensesExclVat

  const { annualTaxAfterCredits } = estimateIncomeTax(projectedAnnualProfit / 12, profile)
  const neededRatePercent =
    projectedAnnualTurnoverExclVat > 0 ? (annualTaxAfterCredits / projectedAnnualTurnoverExclVat) * 100 : 0

  const gapPercentPoints = neededRatePercent - actualAdvanceRatePercent

  return {
    monthsEntered,
    projectedAnnualTurnoverExclVat,
    neededRatePercent,
    actualRatePercent: actualAdvanceRatePercent,
    gapPercentPoints,
    isSignificantGap: Math.abs(gapPercentPoints) >= SIGNIFICANT_GAP_THRESHOLD_POINTS,
  }
}
