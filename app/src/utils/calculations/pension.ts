import type { UserProfile } from '../../types/profile'
import {
  MANDATORY_PENSION_TIER_1_ANNUAL_CEILING,
  MANDATORY_PENSION_TIER_1_RATE,
  MANDATORY_PENSION_TIER_2_ANNUAL_CEILING,
  MANDATORY_PENSION_TIER_2_RATE,
  PENSION_CREDIT_ANNUAL_CEILING_2026,
  PENSION_CREDIT_RATE,
  PENSION_CREDIT_RATE_OF_INCOME,
  PENSION_DEDUCTION_ANNUAL_CEILING_2026,
  PENSION_DEDUCTION_RATE_OF_INCOME,
  STUDY_FUND_DEDUCTION_ANNUAL_CEILING_2026,
  STUDY_FUND_DEDUCTION_RATE_2026,
} from './constants2026'

/**
 * חובת ההפקדה המזערית השנתית לעצמאי (VERIFIED — ראו constants2026.ts),
 * מוערכת כאן חודשית לפי הכפלת הרווח החודשי ב-12 (אותה שיטת המחשה
 * שמשתמש בה מסמך המחקר עצמו: "מקבילה חודשית בממוצע").
 */
export function computeMandatoryMonthlyPensionDeposit(monthlyProfit: number): number {
  const annualProfit = Math.max(0, monthlyProfit) * 12

  const tier1 = Math.min(annualProfit, MANDATORY_PENSION_TIER_1_ANNUAL_CEILING) * MANDATORY_PENSION_TIER_1_RATE
  const tier2Base = Math.max(
    0,
    Math.min(annualProfit, MANDATORY_PENSION_TIER_2_ANNUAL_CEILING) - MANDATORY_PENSION_TIER_1_ANNUAL_CEILING,
  )
  const tier2 = tier2Base * MANDATORY_PENSION_TIER_2_RATE

  return (tier1 + tier2) / 12
}

export interface PensionEstimate {
  /** חובת הפקדה מזערית חודשית לפי חוק (VERIFIED) */
  mandatoryMonthlyDeposit: number
  /** ההפקדה בפועל: סכום ידני אם הוגדר, אחרת לפי אחוז היעד — לא פחות מהחובה */
  actualMonthlyDeposit: number
  /** true אם הסכום שהוגדר ידנית נמוך מהחובה החוקית — דגל אזהרה בלבד */
  belowMandatoryMinimum: boolean
  /** מתוך ההפקדה בפועל — חלק המוכר לזיכוי (35% משיעור זה בפועל) */
  creditEligibleMonthly: number
  creditValueMonthly: number
  /** מתוך ההפקדה בפועל — חלק המוכר לניכוי (ערכו תלוי מדרגת המס השולית) */
  deductionEligibleMonthly: number
  /** קרן השתלמות — VERIFIED, ראו constants2026.ts */
  studyFundDeductibleMonthly: number
}

export function estimatePension(monthlyProfit: number, profile: UserProfile): PensionEstimate {
  const { pensionGoals } = profile
  const mandatoryMonthlyDeposit = computeMandatoryMonthlyPensionDeposit(monthlyProfit)

  const targetFromPercent = (monthlyProfit * pensionGoals.pensionTargetPercent) / 100
  const manualAmount = pensionGoals.monthlyPensionAmount

  const requestedMonthlyDeposit = manualAmount ?? targetFromPercent
  const belowMandatoryMinimum = manualAmount !== null && manualAmount < mandatoryMonthlyDeposit
  const actualMonthlyDeposit = Math.max(requestedMonthlyDeposit, mandatoryMonthlyDeposit)

  // הטבות המס: מתוך ההפקדה השנתית, "פרוסה" ראשונה (עד 5.5% מההכנסה, עד תקרת
  // 2026) מוכרת לזיכוי; השארית (עד 11% מההכנסה, עד תקרת 2026) מוכרת לניכוי.
  // סדר-העדיפות הזה (זיכוי לפני ניכוי) הוא הנחת-עבודה סבירה, לא ציטוט ישיר
  // מהמסמכים — הערך הכספי הכולל של שתי התקרות (11%+5.5%) כן מאומת.
  const annualDeposit = actualMonthlyDeposit * 12
  const annualProfit = Math.max(0, monthlyProfit) * 12

  const creditEligibleAnnual = Math.min(
    annualDeposit,
    annualProfit * PENSION_CREDIT_RATE_OF_INCOME,
    PENSION_CREDIT_ANNUAL_CEILING_2026,
  )
  const remainingForDeduction = Math.max(0, annualDeposit - creditEligibleAnnual)
  const deductionEligibleAnnual = Math.min(
    remainingForDeduction,
    annualProfit * PENSION_DEDUCTION_RATE_OF_INCOME,
    PENSION_DEDUCTION_ANNUAL_CEILING_2026,
  )

  const studyFundMonthlyAmount = pensionGoals.monthlyStudyFundAmount ?? 0
  const studyFundDeductibleMonthly = Math.min(
    studyFundMonthlyAmount,
    monthlyProfit * STUDY_FUND_DEDUCTION_RATE_2026,
    STUDY_FUND_DEDUCTION_ANNUAL_CEILING_2026 / 12,
  )

  return {
    mandatoryMonthlyDeposit,
    actualMonthlyDeposit,
    belowMandatoryMinimum,
    creditEligibleMonthly: creditEligibleAnnual / 12,
    creditValueMonthly: (creditEligibleAnnual / 12) * PENSION_CREDIT_RATE,
    deductionEligibleMonthly: deductionEligibleAnnual / 12,
    studyFundDeductibleMonthly,
  }
}
