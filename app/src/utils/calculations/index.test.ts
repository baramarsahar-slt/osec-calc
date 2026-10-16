import { describe, expect, it } from 'vitest'
import { computeMonthlyFinancials } from './index'
import { createDefaultProfile } from '../../types/profile'

describe('computeMonthlyFinancials — אינטגרציה', () => {
  it('הלוואת בעלים מתווספת למשיכה המומלצת', () => {
    const profile = createDefaultProfile()
    profile.businessStatus = 'exempt' // מפשט: בלי מע"מ בתרחיש הזה
    profile.revenueForecast.assignedAdvanceRatePercent = 0
    profile.bituachLeumi.meetsSelfEmployedDefinition = false // מפשט: בלי ביטוח לאומי בתרחיש הזה
    profile.pensionGoals.pensionTargetPercent = 0

    const withoutPrivate = computeMonthlyFinancials({
      profile,
      monthNumber: 5,
      grossIncome: 20_000,
      businessExpensesMonthly: 5_000,
      privateLoanMonthly: 0,
      previousMonth: null,
    })

    const withPrivate = computeMonthlyFinancials({
      profile,
      monthNumber: 5,
      grossIncome: 20_000,
      businessExpensesMonthly: 5_000,
      privateLoanMonthly: 1_000,
      previousMonth: null,
    })

    // ה-1,000 שנוספו כהלוואת בעלים אמורים לחזור במלואם למשיכה המומלצת
    expect(withPrivate.recommendedDraw - withoutPrivate.recommendedDraw).toBeCloseTo(1_000, 2)
  })

  it('עוסק פטור — אין רכיב מע"מ בתזרים', () => {
    const profile = createDefaultProfile()
    profile.businessStatus = 'exempt'

    const result = computeMonthlyFinancials({
      profile,
      monthNumber: 6, // חודש זוגי — היה אמור להיות חודש דיווח אצל עוסק מורשה
      grossIncome: 15_000,
      businessExpensesMonthly: 2_000,
      privateLoanMonthly: 0,
      previousMonth: null,
    })

    expect(result.vat.applicable).toBe(false)
    expect(result.turnoverExclVat).toBe(15_000) // בלי הפחתת מע"מ כלל
  })

  it('עוסק מורשה, חודש דיווח — netPayable של המע"מ נכנס לתזרים', () => {
    const profile = createDefaultProfile()
    profile.businessStatus = 'licensed'
    profile.revenueForecast.assignedAdvanceRatePercent = 0
    profile.bituachLeumi.meetsSelfEmployedDefinition = false
    profile.pensionGoals.pensionTargetPercent = 0

    const result = computeMonthlyFinancials({
      profile,
      monthNumber: 4,
      grossIncome: 11_800, // כולל 1,800 מע"מ
      businessExpensesMonthly: 0,
      privateLoanMonthly: 0,
      previousMonth: null,
    })

    expect(result.vat.isReportingMonth).toBe(true)
    expect(result.vat.netPayable).toBeCloseTo(1_800, 1)
    // 11,800 ברוטו פחות 1,800 מע"מ לתשלום, פחות חובת ההפקדה הפנסיונית המזערית
    // (שחלה גם כש-pensionTargetPercent=0 — זו חובה חוקית, לא יעד רשות) = הנטו הזמין
    const expectedCash = 10_000 - result.pension.actualMonthlyDeposit
    expect(result.cashAfterStatutoryPayments).toBeCloseTo(expectedCash, 2)
    expect(result.pension.actualMonthlyDeposit).toBeCloseTo(result.pension.mandatoryMonthlyDeposit, 2)
  })

  it('התזרים מחסיר את מלוא הפקדת קה"ש בפועל, לא רק את החלק המוכר לניכוי', () => {
    const profile = createDefaultProfile()
    profile.businessStatus = 'exempt'
    profile.revenueForecast.assignedAdvanceRatePercent = 0
    profile.bituachLeumi.meetsSelfEmployedDefinition = false
    profile.pensionGoals.pensionTargetPercent = 0
    profile.pensionGoals.monthlyStudyFundAmount = 5_000 // מעבר לתקרת הניכוי במכוון

    const result = computeMonthlyFinancials({
      profile,
      monthNumber: 5,
      grossIncome: 50_000,
      businessExpensesMonthly: 0,
      privateLoanMonthly: 0,
      previousMonth: null,
    })

    expect(result.pension.actualStudyFundDeposit).toBeCloseTo(5_000, 2)
    expect(result.pension.studyFundDeductibleMonthly).toBeLessThan(5_000)
    const expectedCash = 50_000 - result.pension.actualMonthlyDeposit - 5_000
    expect(result.cashAfterStatutoryPayments).toBeCloseTo(expectedCash, 2)
  })
})
