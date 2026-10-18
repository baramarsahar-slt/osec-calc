import { describe, expect, it } from 'vitest'
import { checkAdvanceRateAlignment } from './advanceRateCheck'
import { createDefaultProfile } from '../types/profile'

function baseProfile() {
  const profile = createDefaultProfile()
  profile.businessStatus = 'exempt' // מפשט: בלי מע"מ בתרחישי הבדיקה
  profile.personal.gender = 'male' // 2.25 נקודות, כמו בדוגמה הרשמית
  return profile
}

describe('checkAdvanceRateAlignment', () => {
  it('מחזירה null עם פחות מ-2 חודשי היסטוריה השנה', () => {
    const profile = baseProfile()
    const result = checkAdvanceRateAlignment(
      profile,
      [{ monthKey: '2026-09', grossIncome: 20_000, businessExpensesActual: 0 }],
      8,
    )
    expect(result).toBeNull()
  })

  it('תואם את הדוגמה הרשמית: 240,000 ₪/שנה, 2.25 נקודות ⇐ כ-13.41% אחוז נדרש', () => {
    const profile = baseProfile()
    // 20,000 ₪/חודש × 12 = 240,000 ₪/שנה, בלי הוצאות — תואם את הדוגמה
    // המלאה במסמך המחקר (מס לאחר זיכויים 32,178 ₪ על 240,000 ₪ רווח)
    const months = [
      { monthKey: '2026-09', grossIncome: 20_000, businessExpensesActual: 0 },
      { monthKey: '2026-10', grossIncome: 20_000, businessExpensesActual: 0 },
    ]
    const result = checkAdvanceRateAlignment(profile, months, 8)!

    expect(result.monthsEntered).toBe(2)
    expect(result.projectedAnnualTurnoverExclVat).toBeCloseTo(240_000, 2)
    // 32,178 / 240,000 × 100 ≈ 13.4075%
    expect(result.neededRatePercent).toBeCloseTo(13.41, 1)
  })

  it('מסמנת פער משמעותי כשהאחוז בפועל נמוך משמעותית מהנדרש', () => {
    const profile = baseProfile()
    const months = [
      { monthKey: '2026-09', grossIncome: 20_000, businessExpensesActual: 0 },
      { monthKey: '2026-10', grossIncome: 20_000, businessExpensesActual: 0 },
    ]
    // האחוז הנדרש כ-13.4%, אבל בפועל משלמת רק 8% — פער גדול, לכיוון תת-תשלום
    const result = checkAdvanceRateAlignment(profile, months, 8)!
    expect(result.gapPercentPoints).toBeGreaterThan(1)
    expect(result.isSignificantGap).toBe(true)
  })

  it('לא מסמנת פער כשהאחוז בפועל קרוב לנדרש (פחות מנקודת אחוז)', () => {
    const profile = baseProfile()
    const months = [
      { monthKey: '2026-09', grossIncome: 20_000, businessExpensesActual: 0 },
      { monthKey: '2026-10', grossIncome: 20_000, businessExpensesActual: 0 },
    ]
    const result = checkAdvanceRateAlignment(profile, months, 13.41)!
    expect(result.isSignificantGap).toBe(false)
  })

  it('הוצאות מקטינות את הרווח החזוי ולכן את האחוז הנדרש', () => {
    const profile = baseProfile()
    const withoutExpenses = checkAdvanceRateAlignment(
      profile,
      [
        { monthKey: '2026-09', grossIncome: 20_000, businessExpensesActual: 0 },
        { monthKey: '2026-10', grossIncome: 20_000, businessExpensesActual: 0 },
      ],
      0,
    )!
    const withExpenses = checkAdvanceRateAlignment(
      profile,
      [
        { monthKey: '2026-09', grossIncome: 20_000, businessExpensesActual: 10_000 },
        { monthKey: '2026-10', grossIncome: 20_000, businessExpensesActual: 10_000 },
      ],
      0,
    )!
    expect(withExpenses.neededRatePercent).toBeLessThan(withoutExpenses.neededRatePercent)
  })

  it('ממוצע פשוט: 3 חודשים בהכנסות שונות מחושב לפי ממוצע כולל, לא רק אחרון', () => {
    const profile = baseProfile()
    const months = [
      { monthKey: '2026-08', grossIncome: 10_000, businessExpensesActual: 0 },
      { monthKey: '2026-09', grossIncome: 20_000, businessExpensesActual: 0 },
      { monthKey: '2026-10', grossIncome: 30_000, businessExpensesActual: 0 },
    ]
    const result = checkAdvanceRateAlignment(profile, months, 0)!
    // ממוצע (10,000+20,000+30,000)/3=20,000 × 12 = 240,000
    expect(result.projectedAnnualTurnoverExclVat).toBeCloseTo(240_000, 2)
  })

  it('עוסק מורשה: המחזור המוחזר הוא ללא מע"מ, לא ההכנסה הגולמית שכוללת אותו', () => {
    const profile = baseProfile()
    profile.businessStatus = 'licensed'
    const months = [
      { monthKey: '2026-09', grossIncome: 23_600, businessExpensesActual: 0 }, // כולל 3,600 מע"מ
      { monthKey: '2026-10', grossIncome: 23_600, businessExpensesActual: 0 },
    ]
    const result = checkAdvanceRateAlignment(profile, months, 0)!
    // ממוצע 23,600 × 12 = 283,200 ברוטו ⇐ 240,000 ללא מע"מ — לא 283,200
    expect(result.projectedAnnualTurnoverExclVat).toBeCloseTo(240_000, 1)
  })
})
