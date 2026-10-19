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

/** עבור טסטים שבהם ההוצאה בפועל זהה למוחלקת (אין תשלומים תקופתיים) */
function uniformExpenses(businessExpenses: number, businessVatDeductible = 0) {
  return (): MonthExpenseTotals => ({
    businessExpensesActual: businessExpenses,
    businessVatDeductibleActual: businessVatDeductible,
    businessExpensesSmoothed: businessExpenses,
    businessVatDeductibleSmoothed: businessVatDeductible,
  })
}

describe('computeDashboardDraw', () => {
  it('יעד כרית הביטחון = חודשי היעד × הוצאות חודשיות מוחלקות', () => {
    const profile = baseProfile()
    profile.safetyNet.targetMonthsOfExpenses = 3

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 20_000,
      businessExpensesActual: 4_000,
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 4_000,
      incomeHistory: { '2026-05': 20_000 },
      getExpenseTotalsForMonth: uniformExpenses(4_000),
      safetyNetCurrentBalance: 0,
    })

    expect(result.safetyNetTarget).toBeCloseTo(12_000, 2)
  })

  it('תשלום שנתי גדול לא מעוות את יעד הכרית — היעד לפי ההוצאה המוחלקת, לא בפועל', () => {
    const profile = baseProfile()
    profile.safetyNet.targetMonthsOfExpenses = 3

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 20_000,
      businessExpensesActual: 24_000, // תשלום ביטוח שנתי גדול, שולם במלואו החודש
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 2_000, // אותו תשלום, "מוחלק" ל-12 חודשים
      incomeHistory: { '2026-05': 20_000 },
      getExpenseTotalsForMonth: uniformExpenses(2_000),
      safetyNetCurrentBalance: 0,
    })

    // היעד מבוסס על ה-2,000 ה"טיפוסי", לא על ה-24,000 החריג
    expect(result.safetyNetTarget).toBeCloseTo(6_000, 2)
  })

  it('תשלום שנתי גדול מפחית את מלוא הסכום מהרווח החייב/מהנטו בפועל של החודש', () => {
    const profile = baseProfile()

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 20_000,
      businessExpensesActual: 24_000, // הוצאה אמיתית: כל ה-24,000 יורדים החודש
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 2_000,
      incomeHistory: { '2026-05': 20_000 },
      getExpenseTotalsForMonth: uniformExpenses(2_000),
      safetyNetCurrentBalance: 0,
    })

    // רווח/נטו החודש: 20,000 - 24,000 = שלילי, לא 20,000 - 2,000 = 18,000
    expect(result.financials.taxableProfit).toBeCloseTo(-4_000, 2)
    expect(result.financials.cashAfterStatutoryPayments).toBeLessThan(0)
  })

  it('כשהפער לכרית גדול בהרבה מהנטו החודשי, משיכה מינימלית=0 ומקסימלית=הנטו המלא', () => {
    const profile = baseProfile()
    profile.safetyNet.targetMonthsOfExpenses = 3

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 10_000,
      businessExpensesActual: 9_000, // יעד = 27,000 — הרבה מעבר לנטו החודש הקטן
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 9_000,
      incomeHistory: { '2026-05': 10_000 },
      getExpenseTotalsForMonth: uniformExpenses(9_000),
      safetyNetCurrentBalance: 0,
    })

    const minStop = result.drawStops.find((s) => s.key === 'min')!
    const maxStop = result.drawStops.find((s) => s.key === 'max')!
    expect(minStop.value).toBeCloseTo(0, 2)
    expect(maxStop.value).toBeCloseTo(result.financials.cashAfterStatutoryPayments, 2)
  })

  it('כשהפער לכרית חלקי, משיכה מינימלית = נטו בפועל פחות הפער (לא אפס)', () => {
    const profile = baseProfile()
    profile.safetyNet.targetMonthsOfExpenses = 3

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 10_000,
      businessExpensesActual: 1_000, // יעד = 3,000 — קטן מהנטו החודשי
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 1_000,
      incomeHistory: { '2026-05': 10_000 },
      getExpenseTotalsForMonth: uniformExpenses(1_000),
      safetyNetCurrentBalance: 0,
    })

    const minStop = result.drawStops.find((s) => s.key === 'min')!
    const expectedMin = result.financials.cashAfterStatutoryPayments - 3_000
    expect(minStop.value).toBeCloseTo(expectedMin, 2)
    expect(minStop.value).toBeGreaterThan(0)
  })

  it('כשהכרית כבר מלאה, משיכה מינימלית = משיכה בפועל (אין עוד מה לדחוף לכרית)', () => {
    const profile = baseProfile()
    profile.safetyNet.targetMonthsOfExpenses = 1

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 10_000,
      businessExpensesActual: 1_000,
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 1_000,
      incomeHistory: { '2026-05': 10_000 },
      getExpenseTotalsForMonth: uniformExpenses(1_000),
      safetyNetCurrentBalance: 100_000, // הרבה מעל כל יעד סביר
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
      businessExpensesActual: 2_000,
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 2_000,
      incomeHistory: { '2026-05': 10_000, '2026-06': 20_000 },
      getExpenseTotalsForMonth: uniformExpenses(2_000),
      safetyNetCurrentBalance: 0,
    })

    const averageStop = result.drawStops.find((s) => s.key === 'average')!
    // חודש חלש יותר (10,000) מושך את הממוצע מתחת לחודש הנוכחי (20,000)
    expect(averageStop.value).toBeLessThan(result.financials.cashAfterStatutoryPayments)
    expect(averageStop.value).toBeGreaterThan(0)
  })

  it('ממוצע משתמש בהוצאות המוחלקות של כל חודש היסטורי, לא בהוצאה בפועל של אותו חודש', () => {
    const profile = baseProfile()

    // חודש קודם: תשלום שנתי גדול בפועל (24,000) אבל מוחלק נמוך (2,000) —
    // הממוצע אמור להשתמש ב-2,000 ולא ב-24,000, כדי לא "לקפוץ" מתשלום חד-פעמי.
    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-06',
      grossIncome: 20_000,
      businessExpensesActual: 2_000,
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 2_000,
      incomeHistory: { '2026-05': 20_000, '2026-06': 20_000 },
      getExpenseTotalsForMonth: (monthKey) =>
        monthKey === '2026-05'
          ? {
              businessExpensesActual: 24_000,
              businessVatDeductibleActual: 0,
              businessExpensesSmoothed: 2_000, // הערך שבאמת נכנס לממוצע
              businessVatDeductibleSmoothed: 0,
            }
          : { businessExpensesActual: 2_000, businessVatDeductibleActual: 0, businessExpensesSmoothed: 2_000, businessVatDeductibleSmoothed: 0 },
      safetyNetCurrentBalance: 0,
    })

    const averageStop = result.drawStops.find((s) => s.key === 'average')!
    // אם הממוצע היה משתמש ב-24,000 בפועל, הוא היה שלילי/קרוב ל-0 — כאן הוא
    // אמור להיות קרוב לנטו של חודש "רגיל" (20,000-2,000=18,000 בשני החודשים)
    expect(averageStop.value).toBeCloseTo(result.financials.cashAfterStatutoryPayments, 1)
  })

  it('חודש קודם קיים בהיסטוריה — מוזן כ-previousMonth למנוע המע"מ, לפי הסכום בפועל', () => {
    const profile = baseProfile()
    profile.businessStatus = 'licensed'

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-06', // חודש זוגי = חודש דיווח
      grossIncome: 11_800,
      businessExpensesActual: 0,
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 0,
      incomeHistory: { '2026-05': 23_600, '2026-06': 11_800 },
      getExpenseTotalsForMonth: uniformExpenses(0),
      safetyNetCurrentBalance: 0,
    })

    expect(result.financials.vat.isReportingMonth).toBe(true)
    // פלט משולב: (11,800+23,600) ברוטו ⇐ 5,400 מע"מ עסקאות
    expect(result.financials.vat.periodOutputVat).toBeCloseTo(5_400, 1)
  })

  it('ה-stops תמיד ממוינים לפי ערך עולה', () => {
    const profile = baseProfile()

    const result = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 15_000,
      businessExpensesActual: 2_000,
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 2_000,
      incomeHistory: { '2026-05': 15_000 },
      getExpenseTotalsForMonth: uniformExpenses(2_000),
      safetyNetCurrentBalance: 0,
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
      businessExpensesActual: 2_000,
      privateLoanMonthly: 0,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 2_000,
      incomeHistory: { '2026-05': 15_000 },
      getExpenseTotalsForMonth: uniformExpenses(2_000),
      safetyNetCurrentBalance: 0,
    })

    const withLoan = computeDashboardDraw({
      profile,
      monthKey: '2026-05',
      grossIncome: 15_000,
      businessExpensesActual: 2_000,
      privateLoanMonthly: 5_000,
      businessVatDeductibleActual: 0,
      businessExpensesSmoothed: 2_000,
      incomeHistory: { '2026-05': 15_000 },
      getExpenseTotalsForMonth: uniformExpenses(2_000),
      safetyNetCurrentBalance: 0,
    })

    const avgWithout = withoutLoan.drawStops.find((s) => s.key === 'average')!.value
    const avgWith = withLoan.drawStops.find((s) => s.key === 'average')!.value
    expect(avgWith).toBeCloseTo(avgWithout, 2)
  })
})
