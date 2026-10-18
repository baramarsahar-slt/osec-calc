import { describe, expect, it } from 'vitest'
import { computeDashboardDraw, type MonthExpenseTotals } from './dashboardDraw'
import { createDefaultProfile } from '../types/profile'

function baseProfile() {
  const profile = createDefaultProfile()
  profile.businessStatus = 'exempt' // מפשט: בלי מע"מ בתרחישי הבדיקה
  profile.revenueForecast.assignedAdvanceRatePercent = 0
  profile.bituachLeumi.meetsSelfEmployedDefinition = false
  profile.pensionGoals.pensionTargetPercent = 0
  profile.pensionGoals.monthlyPensionAmount = 0
  return profile
}

/** עבור טסטים שבהם כל החודשים משתמשים באותן הוצאות — מפשט את ההגדרה */
function uniformExpenses(businessExpensesMonthly: number, businessVatDeductibleMonthly = 0) {
  return (): MonthExpenseTotals => ({ businessExpensesMonthly, businessVatDeductibleMonthly })
}

describe('computeDashboardDraw', () => {
  it('יעד כרית הביטחון = חודשי היעד × הוצאות חודשיות', () => {
    const profile = baseProfile()
    profile.safetyNet.targetMonthsOfExpenses = 3

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 20_000,
      businessExpensesMonthly: 4_000,
      privateLoanMonthly: 0,
      businessVatDeductibleMonthly: 0,
      incomeHistory: { '2026-05': 20_000 },
      getExpenseTotalsForMonth: uniformExpenses(4_000),
    })

    expect(result.safetyNetTarget).toBeCloseTo(12_000, 2)
  })

  it('כשהפער לכרית גדול בהרבה מהנטו החודשי, משיכה מינימלית=0 ומקסימלית=הנטו המלא', () => {
    const profile = baseProfile()
    profile.safetyNet.targetMonthsOfExpenses = 3
    profile.safetyNet.currentBalance = 0

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 10_000,
      businessExpensesMonthly: 9_000, // יעד = 27,000 — הרבה מעבר לנטו החודש הקטן
      privateLoanMonthly: 0,
      businessVatDeductibleMonthly: 0,
      incomeHistory: { '2026-05': 10_000 },
      getExpenseTotalsForMonth: uniformExpenses(9_000),
    })

    const minStop = result.drawStops.find((s) => s.key === 'min')!
    const maxStop = result.drawStops.find((s) => s.key === 'max')!
    expect(minStop.value).toBeCloseTo(0, 2)
    expect(maxStop.value).toBeCloseTo(result.financials.cashAfterStatutoryPayments, 2)
  })

  it('כשהפער לכרית חלקי, משיכה מינימלית = נטו בפועל פחות הפער (לא אפס)', () => {
    const profile = baseProfile()
    profile.safetyNet.targetMonthsOfExpenses = 3
    profile.safetyNet.currentBalance = 0

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 10_000,
      businessExpensesMonthly: 1_000, // יעד = 3,000 — קטן מהנטו החודשי
      privateLoanMonthly: 0,
      businessVatDeductibleMonthly: 0,
      incomeHistory: { '2026-05': 10_000 },
      getExpenseTotalsForMonth: uniformExpenses(1_000),
    })

    const minStop = result.drawStops.find((s) => s.key === 'min')!
    const expectedMin = result.financials.cashAfterStatutoryPayments - 3_000
    expect(minStop.value).toBeCloseTo(expectedMin, 2)
    expect(minStop.value).toBeGreaterThan(0)
  })

  it('כשהכרית כבר מלאה, משיכה מינימלית = משיכה בפועל (אין עוד מה לדחוף לכרית)', () => {
    const profile = baseProfile()
    profile.safetyNet.targetMonthsOfExpenses = 1
    profile.safetyNet.currentBalance = 100_000 // הרבה מעל כל יעד סביר

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 10_000,
      businessExpensesMonthly: 1_000,
      privateLoanMonthly: 0,
      businessVatDeductibleMonthly: 0,
      incomeHistory: { '2026-05': 10_000 },
      getExpenseTotalsForMonth: uniformExpenses(1_000),
    })

    const minStop = result.drawStops.find((s) => s.key === 'min')!
    expect(minStop.value).toBeCloseTo(result.financials.cashAfterStatutoryPayments, 2)
  })

  it('ממוצע: עם שני חודשים שונים, הממוצע נמצא בין שני הערכים', () => {
    const profile = baseProfile()

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-06',
      grossIncome: 20_000,
      businessExpensesMonthly: 2_000,
      privateLoanMonthly: 0,
      businessVatDeductibleMonthly: 0,
      incomeHistory: { '2026-05': 10_000, '2026-06': 20_000 },
      getExpenseTotalsForMonth: uniformExpenses(2_000),
    })

    const averageStop = result.drawStops.find((s) => s.key === 'average')!
    // חודש חלש יותר (10,000) מושך את הממוצע מתחת לחודש הנוכחי (20,000)
    expect(averageStop.value).toBeLessThan(result.financials.cashAfterStatutoryPayments)
    expect(averageStop.value).toBeGreaterThan(0)
  })

  it('ממוצע משתמש בהוצאות האמיתיות של כל חודש, לא בהוצאות החודש הנוכחי', () => {
    const profile = baseProfile()

    // אותה הכנסה בשני החודשים, אבל הוצאות שונות — אם הממוצע היה "דוחס" את
    // הוצאות החודש הנוכחי על החודש הקודם, שני החודשים היו יוצאים זהים.
    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-06',
      grossIncome: 20_000,
      businessExpensesMonthly: 2_000, // הוצאות החודש הנוכחי
      privateLoanMonthly: 0,
      businessVatDeductibleMonthly: 0,
      incomeHistory: { '2026-05': 20_000, '2026-06': 20_000 },
      getExpenseTotalsForMonth: (monthKey) =>
        monthKey === '2026-05'
          ? { businessExpensesMonthly: 10_000, businessVatDeductibleMonthly: 0 } // חודש קודם: הוצאות גבוהות בהרבה
          : { businessExpensesMonthly: 2_000, businessVatDeductibleMonthly: 0 },
    })

    const averageStop = result.drawStops.find((s) => s.key === 'average')!
    // ממוצע של (20,000-10,000) וחודש נוכחי (20,000-2,000=18,000) → נמוך מ-18,000
    expect(averageStop.value).toBeLessThan(result.financials.cashAfterStatutoryPayments)
  })

  it('חודש קודם קיים בהיסטוריה — מוזן כ-previousMonth למנוע המע"מ (איחוד דו-חודשי אמיתי)', () => {
    const profile = baseProfile()
    profile.businessStatus = 'licensed'

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-06', // חודש זוגי = חודש דיווח
      grossIncome: 11_800,
      businessExpensesMonthly: 0,
      privateLoanMonthly: 0,
      businessVatDeductibleMonthly: 0,
      incomeHistory: { '2026-05': 23_600, '2026-06': 11_800 },
      getExpenseTotalsForMonth: uniformExpenses(0),
    })

    expect(result.financials.vat.isReportingMonth).toBe(true)
    // פלט משולב: (11,800+23,600) ברוטו ⇐ 5,400 מע"מ עסקאות
    expect(result.financials.vat.periodOutputVat).toBeCloseTo(5_400, 1)
  })

  it('ה-stops תמיד ממוינים לפי ערך עולה', () => {
    const profile = baseProfile()
    profile.safetyNet.currentBalance = 0

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 15_000,
      businessExpensesMonthly: 2_000,
      privateLoanMonthly: 0,
      businessVatDeductibleMonthly: 0,
      incomeHistory: { '2026-05': 15_000 },
      getExpenseTotalsForMonth: uniformExpenses(2_000),
    })

    const values = result.drawStops.map((s) => s.value)
    const sorted = [...values].sort((a, b) => a - b)
    expect(values).toEqual(sorted)
  })

  it('privateLoanMonthly לא משפיע על חישוב הממוצע (הוא נוסף בנפרד ב-UI)', () => {
    const profile = baseProfile()

    const withoutLoan = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 15_000,
      businessExpensesMonthly: 2_000,
      privateLoanMonthly: 0,
      businessVatDeductibleMonthly: 0,
      incomeHistory: { '2026-05': 15_000 },
      getExpenseTotalsForMonth: uniformExpenses(2_000),
    })

    const withLoan = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 15_000,
      businessExpensesMonthly: 2_000,
      privateLoanMonthly: 5_000,
      businessVatDeductibleMonthly: 0,
      incomeHistory: { '2026-05': 15_000 },
      getExpenseTotalsForMonth: uniformExpenses(2_000),
    })

    const avgWithout = withoutLoan.drawStops.find((s) => s.key === 'average')!.value
    const avgWith = withLoan.drawStops.find((s) => s.key === 'average')!.value
    expect(avgWith).toBeCloseTo(avgWithout, 2)
  })
})
