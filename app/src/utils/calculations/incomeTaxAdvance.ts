import type { AdvanceStrategy, UserProfile } from '../../types/profile'
import { estimateIncomeTax } from './incomeTax'

/**
 * מקדמות מס הכנסה אצל עצמאי נקבעות מנהלית ע"י רשות המסים כאחוז מהמחזור,
 * לפי שומת עבר (או תחזית לעסק חדש) — זה לא נתון שניתן לגזור במדויק מהמדרגות
 * בלבד (ראו מסמך המחקר, סעיף "איך עובדות מקדמות מס הכנסה אצל עצמאי?").
 *
 * לכן:
 *  - אם המשתמשת הזינה את האחוז הרשמי שנקבע בתיק (profile.revenueForecast.
 *    assignedAdvanceRatePercent), משתמשים בו כפי שהוא — זה המספר המדויק.
 *  - אחרת, מציגים הערכה בלבד: היחס בין המס השנתי הצפוי (לפי מדרגות) לבין
 *    המחזור השנתי הצפוי, מותאם לפי אסטרטגיית הסיכון שנבחרה. ההערכה מסומנת
 *    בבירור ככזו — אסור להציג אותה כאילו היא האחוז הרשמי.
 */

/** מכפיל להמחשת אסטרטגיית הסיכון על ההערכה בלבד (לא חל על אחוז רשמי שהוזן) */
const STRATEGY_MULTIPLIER: Record<AdvanceStrategy, number> = {
  precise: 1,
  conservative: 1.15, // תשלום יתר מכוון, לקראת החזר מס בסוף שנה
  aggressive: 0.85, // תשלום בחסר מכוון, לטובת נזילות שוטפת
}

export interface IncomeTaxAdvanceEstimate {
  source: 'assigned' | 'estimated'
  ratePercent: number
  advanceAmount: number
}

export function estimateIncomeTaxAdvance(
  monthlyTurnoverExclVat: number,
  monthlyProfit: number,
  profile: UserProfile,
): IncomeTaxAdvanceEstimate {
  const assigned = profile.revenueForecast.assignedAdvanceRatePercent

  if (assigned !== null && assigned >= 0) {
    return {
      source: 'assigned',
      ratePercent: assigned,
      advanceAmount: monthlyTurnoverExclVat * (assigned / 100),
    }
  }

  const annualTurnover = Math.max(0, monthlyTurnoverExclVat) * 12
  const { annualTaxAfterCredits } = estimateIncomeTax(monthlyProfit, profile)
  const baseRatePercent = annualTurnover > 0 ? (annualTaxAfterCredits / annualTurnover) * 100 : 0
  const adjustedRatePercent = baseRatePercent * STRATEGY_MULTIPLIER[profile.advanceStrategy]

  return {
    source: 'estimated',
    ratePercent: adjustedRatePercent,
    advanceAmount: monthlyTurnoverExclVat * (adjustedRatePercent / 100),
  }
}
