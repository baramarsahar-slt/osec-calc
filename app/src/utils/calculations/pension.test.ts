import { describe, expect, it } from 'vitest'
import { computeMandatoryMonthlyPensionDeposit, estimatePension } from './pension'
import { createDefaultProfile } from '../../types/profile'

describe('computeMandatoryMonthlyPensionDeposit — דוגמאות רשמיות מהמסמך', () => {
  /**
   * מתוך טבלת ההמחשה במסמך הפנסיה: הכנסה חודשית ממוצעת ⇐ מקבילה חודשית
   * של חובת ההפקדה המזערית.
   */
  it('5,000 ₪ לחודש ⇐ כ-222.50 ₪ לחודש', () => {
    expect(computeMandatoryMonthlyPensionDeposit(5_000)).toBeCloseTo(222.5, 1)
  })

  it('8,000 ₪ לחודש ⇐ כ-446.36 ₪ לחודש', () => {
    expect(computeMandatoryMonthlyPensionDeposit(8_000)).toBeCloseTo(446.36, 1)
  })

  it('10,000 ₪ לחודש ⇐ כ-697.36 ₪ לחודש', () => {
    expect(computeMandatoryMonthlyPensionDeposit(10_000)).toBeCloseTo(697.36, 1)
  })

  it('13,769 ₪ לחודש (=165,228/12) ⇐ כ-1,170.37 ₪ לחודש — מקסימום החובה', () => {
    expect(computeMandatoryMonthlyPensionDeposit(13_769)).toBeCloseTo(1_170.37, 1)
  })

  it('20,000 ₪ לחודש — מעל התקרה, החובה לא גדלה יותר מ-1,170.37 ₪', () => {
    expect(computeMandatoryMonthlyPensionDeposit(20_000)).toBeCloseTo(1_170.37, 1)
  })
})

describe('estimatePension', () => {
  it('ללא הפקדה ידנית — ההפקדה בפועל לא נופלת מהחובה החוקית', () => {
    const profile = createDefaultProfile()
    profile.pensionGoals.pensionTargetPercent = 0
    profile.pensionGoals.monthlyPensionAmount = null
    const result = estimatePension(10_000, profile)
    expect(result.actualMonthlyDeposit).toBeCloseTo(result.mandatoryMonthlyDeposit, 2)
    expect(result.belowMandatoryMinimum).toBe(false)
  })

  it('מסמנת אזהרה כשהסכום הידני נמוך מהחובה, אך לא יורדת מתחתיה בפועל', () => {
    const profile = createDefaultProfile()
    profile.pensionGoals.monthlyPensionAmount = 100 // נמוך בוודאות מהחובה על 10,000 רווח
    const result = estimatePension(10_000, profile)
    expect(result.belowMandatoryMinimum).toBe(true)
    expect(result.actualMonthlyDeposit).toBeGreaterThanOrEqual(result.mandatoryMonthlyDeposit)
  })

  it('זיכוי הפנסיה הוא 35% מהחלק המוכר לזיכוי', () => {
    const profile = createDefaultProfile()
    profile.pensionGoals.monthlyPensionAmount = 2_000
    const result = estimatePension(15_000, profile)
    expect(result.creditValueMonthly).toBeCloseTo(result.creditEligibleMonthly * 0.35, 5)
  })
})

describe('קרן השתלמות — נתונים מאומתים', () => {
  it('הפקדה קטנה — מוכרת במלואה לניכוי', () => {
    const profile = createDefaultProfile()
    profile.pensionGoals.monthlyStudyFundAmount = 500
    const result = estimatePension(20_000, profile)
    expect(result.studyFundDeductibleMonthly).toBeCloseTo(500, 2)
  })

  it('תקרת 4.5% מהרווח חוסמת לפני התקרה השנתית בשקלים, ברווח נמוך', () => {
    const profile = createDefaultProfile()
    profile.pensionGoals.monthlyStudyFundAmount = 1_000
    const result = estimatePension(5_000, profile) // 4.5% × 5,000 = 225
    expect(result.studyFundDeductibleMonthly).toBeCloseTo(225, 2)
  })

  it('תקרת 13,203 ₪/שנה (1,100.25 ₪/חודש) חוסמת ברווח גבוה', () => {
    const profile = createDefaultProfile()
    profile.pensionGoals.monthlyStudyFundAmount = 5_000
    const result = estimatePension(50_000, profile) // 4.5% × 50,000 = 2,250 > התקרה
    expect(result.studyFundDeductibleMonthly).toBeCloseTo(13_203 / 12, 2)
  })

  it('יעד לפי אחוז עצמאי מהפנסיה — 6% פנסיה ו-2.5% קה"ש על אותו רווח', () => {
    const profile = createDefaultProfile()
    profile.pensionGoals.pensionTargetPercent = 6
    profile.pensionGoals.monthlyPensionAmount = null
    profile.pensionGoals.studyFundTargetPercent = 2.5
    profile.pensionGoals.monthlyStudyFundAmount = null

    const result = estimatePension(10_000, profile)

    expect(result.actualStudyFundDeposit).toBeCloseTo(250, 2) // 2.5% × 10,000
    // הפנסיה לא נגזרת מקה"ש וההפך — שני יעדים עצמאיים על אותו רווח
    expect(result.actualMonthlyDeposit).toBeGreaterThanOrEqual(600) // 6% × 10,000, או החובה אם גבוהה ממנה
  })

  it('הפקדה מעבר לתקרת הניכוי — התזרים בפועל (actualStudyFundDeposit) לא נחתך, רק הניכוי למס', () => {
    const profile = createDefaultProfile()
    profile.pensionGoals.monthlyStudyFundAmount = 5_000 // הרבה מעבר לתקרת הניכוי
    const result = estimatePension(50_000, profile)

    expect(result.actualStudyFundDeposit).toBeCloseTo(5_000, 2) // זה מה שבאמת יוצא מהחשבון
    expect(result.studyFundDeductibleMonthly).toBeLessThan(result.actualStudyFundDeposit) // אבל רק חלק ממנו מוכר
  })
})
