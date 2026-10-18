import { describe, expect, it } from 'vitest'
import { computeVat } from './vat'

describe('computeVat', () => {
  it('עוסק פטור — אין מע"מ כלל, בכל חודש', () => {
    const result = computeVat('exempt', 3, { grossIncome: 20_000, businessExpenses: 5_000 }, null)
    expect(result.applicable).toBe(false)
    expect(result.netPayable).toBe(0)
  })

  it('חודש אי-זוגי — צוברים, בלי דרישת תשלום מיידית', () => {
    const result = computeVat('licensed', 3, { grossIncome: 11_800, businessExpenses: 2_360 }, null)
    expect(result.isOddMonth).toBe(true)
    expect(result.isReportingMonth).toBe(false)
    expect(result.netPayable).toBe(0)
    // 11,800 ברוטו כולל מע"מ 18% ⇐ 10,000 נטו ⇐ 1,800 מע"מ עסקאות
    expect(result.periodOutputVat).toBeCloseTo(1_800, 1)
    expect(result.accruedHoldAmount).toBeGreaterThan(0)
  })

  it('חודש זוגי בלי חודש קודם (למשל תחילת שימוש באפליקציה) — מחשב רק את עצמו', () => {
    const result = computeVat('licensed', 4, { grossIncome: 11_800, businessExpenses: 2_360 }, null)
    expect(result.isReportingMonth).toBe(true)
    expect(result.periodOutputVat).toBeCloseTo(1_800, 1)
    expect(result.periodInputVat).toBeCloseTo(360, 1)
    expect(result.netPayable).toBeCloseTo(1_440, 1)
  })

  it('חודש זוגי עם חודש קודם — מאחד את שני החודשים', () => {
    const current = { grossIncome: 11_800, businessExpenses: 2_360 }
    const previous = { grossIncome: 23_600, businessExpenses: 4_720 }
    const result = computeVat('licensed', 6, current, previous)

    expect(result.isReportingMonth).toBe(true)
    // פלט: (11,800+23,600) ברוטו ⇐ 30,000 נטו ⇐ 5,400 מע"מ עסקאות
    expect(result.periodOutputVat).toBeCloseTo(5_400, 1)
    // תשומות: (2,360+4,720) ברוטו ⇐ 6,000 נטו ⇐ 1,080 מע"מ תשומות
    expect(result.periodInputVat).toBeCloseTo(1_080, 1)
    expect(result.netPayable).toBeCloseTo(4_320, 1)
  })

  it('פירוק לפי חודש: current+previous מסתכמים בדיוק ל-netPayable', () => {
    const current = { grossIncome: 11_800, businessExpenses: 2_360 }
    const previous = { grossIncome: 23_600, businessExpenses: 4_720 }
    const result = computeVat('licensed', 6, current, previous)

    // 11,800 ⇐ 1,800 פלט פחות 360 תשומות = 1,440 נטו מהחודש הנוכחי
    expect(result.currentMonthNetVat).toBeCloseTo(1_440, 1)
    // 23,600 ⇐ 3,600 פלט פחות 720 תשומות = 2,880 נטו מהחודש הקודם
    expect(result.previousMonthNetVat).toBeCloseTo(2_880, 1)
    expect(result.currentMonthNetVat + (result.previousMonthNetVat ?? 0)).toBeCloseTo(result.netPayable, 1)
  })

  it('חודש דיווח בלי חודש קודם — previousMonthNetVat הוא null (לא 0)', () => {
    const result = computeVat('licensed', 4, { grossIncome: 11_800, businessExpenses: 2_360 }, null)
    expect(result.previousMonthNetVat).toBeNull()
  })

  it('חודש אי-זוגי — accruedHoldAmount שווה בדיוק ל-currentMonthNetVat', () => {
    const result = computeVat('licensed', 3, { grossIncome: 11_800, businessExpenses: 2_360 }, null)
    expect(result.currentMonthNetVat).toBeCloseTo(result.accruedHoldAmount, 5)
    expect(result.previousMonthNetVat).toBeNull()
  })

  it('כשסופק מע"מ תשומות מדויק (מייבוא Morning), משתמשים בו במקום בקירוב הגורף', () => {
    // 2,360 ₪ הוצאה ברוטו, אבל רק 100 ₪ מתוכה מוכרים לקיזוז בפועל (לפי הרו"ח) —
    // קירוב גורף של 18% היה נותן 360, אבל כאן יש מספר מדויק שגובר עליו.
    const result = computeVat(
      'licensed',
      4,
      { grossIncome: 11_800, businessExpenses: 2_360, businessExpensesDeductibleVat: 100 },
      null,
    )
    expect(result.periodInputVat).toBeCloseTo(100, 2)
    expect(result.netPayable).toBeCloseTo(1_800 - 100, 2)
  })
})
