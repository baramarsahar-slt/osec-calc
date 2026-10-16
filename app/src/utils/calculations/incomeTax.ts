import type { UserProfile } from '../../types/profile'
import {
  BASE_CREDIT_POINTS_RESIDENT,
  CHILD_CREDIT_POINTS_BY_AGE,
  CREDIT_POINT_MONTHLY_VALUE_2026,
  FEMALE_EXTRA_CREDIT_POINTS,
  INCOME_TAX_BRACKETS_2026,
} from './constants2026'

/** מחשבת מס לפי מדרגות פרוגרסיביות, על הכנסה חייבת שנתית. ללא זיכויים. */
export function computeAnnualIncomeTaxBeforeCredits(annualTaxableIncome: number): number {
  if (annualTaxableIncome <= 0) return 0

  let tax = 0
  let previousCeiling = 0

  for (const bracket of INCOME_TAX_BRACKETS_2026) {
    if (annualTaxableIncome <= previousCeiling) break
    const amountInBracket = Math.min(annualTaxableIncome, bracket.upTo) - previousCeiling
    tax += amountInBracket * bracket.rate
    previousCeiling = bracket.upTo
  }

  return tax
}

/**
 * נקודות הזיכוי האוטומטיות לשנת המס הנוכחית — רק קטגוריות שאומתו במסמכי
 * המחקר: בסיס תושבות (2.25, +0.5 לאישה) וילדים לפי גיל. **לא** כולל הורה
 * עצמאי/ת, יישוב מזכה, נכות, עולה חדש, מילואים או תואר — הערך המדויק של
 * אלה תלוי אישור/מחשבון רשמי שלא אומת כאן (ראו resolveCreditPoints).
 */
export function computeCreditPoints(personal: UserProfile['personal'], taxYear = new Date().getFullYear()): number {
  let points = BASE_CREDIT_POINTS_RESIDENT
  if (personal.gender === 'female') points += FEMALE_EXTRA_CREDIT_POINTS

  for (const child of personal.children) {
    const age = taxYear - child.birthYear
    const bracket = CHILD_CREDIT_POINTS_BY_AGE.find((b) => age <= b.maxAge)
    if (!bracket) continue // ילד/ה מעל גיל 18 — ללא נקודות לפי הטבלה הבסיסית
    points += personal.gender === 'female' ? bracket.mother : bracket.father
  }

  return points
}

/**
 * נקודות הזיכוי שבאמת נכנסות לחישוב: אם הוזן creditPointsOverride (למשל
 * מהמחשבון הרשמי של רשות המסים, secapp.taxes.gov.il/srsimulatorNZ) — הוא
 * גובר לגמרי על החישוב האוטומטי. כך אין צורך "לחבר דלתא" ידנית בין השניים.
 */
export function resolveCreditPoints(
  personal: UserProfile['personal'],
  taxYear = new Date().getFullYear(),
): number {
  return personal.creditPointsOverride ?? computeCreditPoints(personal, taxYear)
}

export interface IncomeTaxEstimate {
  creditPoints: number
  annualCreditValue: number
  annualTaxBeforeCredits: number
  annualTaxAfterCredits: number
  /** המס השנתי לאחר זיכויים, חלקי 12 — אומדן לצורך תזרים חודשי */
  monthlyTaxEquivalent: number
}

/**
 * אומדן מס הכנסה שנתי/חודשי על בסיס רווח חודשי קבוע (רווח × 12), לאחר נקודות
 * זיכוי. זהו אומדן ל"מס הסופי הצפוי", לא אחוז המקדמה הרשמי שנקבע בתיק —
 * ראו incomeTaxAdvance.ts להבחנה בין השניים (מוסברת במפורש גם במסמך המחקר).
 */
export function estimateIncomeTax(monthlyProfit: number, profile: UserProfile): IncomeTaxEstimate {
  const annualTaxableIncome = Math.max(0, monthlyProfit) * 12
  const creditPoints = resolveCreditPoints(profile.personal)
  const annualCreditValue = creditPoints * CREDIT_POINT_MONTHLY_VALUE_2026 * 12

  const annualTaxBeforeCredits = computeAnnualIncomeTaxBeforeCredits(annualTaxableIncome)
  const annualTaxAfterCredits = Math.max(0, annualTaxBeforeCredits - annualCreditValue)

  return {
    creditPoints,
    annualCreditValue,
    annualTaxBeforeCredits,
    annualTaxAfterCredits,
    monthlyTaxEquivalent: annualTaxAfterCredits / 12,
  }
}
