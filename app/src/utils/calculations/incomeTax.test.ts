import { describe, expect, it } from 'vitest'
import { computeAnnualIncomeTaxBeforeCredits, computeCreditPoints, estimateIncomeTax } from './incomeTax'
import { createDefaultProfile } from '../../types/profile'
import { CREDIT_POINT_MONTHLY_VALUE_2026 } from './constants2026'

describe('computeAnnualIncomeTaxBeforeCredits', () => {
  it('מחזיר 0 עבור הכנסה אפסית/שלילית', () => {
    expect(computeAnnualIncomeTaxBeforeCredits(0)).toBe(0)
    expect(computeAnnualIncomeTaxBeforeCredits(-1000)).toBe(0)
  })

  it('מדרגה ראשונה בלבד: 10% על הכל', () => {
    expect(computeAnnualIncomeTaxBeforeCredits(50_000)).toBeCloseTo(5_000, 2)
  })

  it('בדיוק על תקרת המדרגה הראשונה (84,120 ₪)', () => {
    expect(computeAnnualIncomeTaxBeforeCredits(84_120)).toBeCloseTo(8_412, 2)
  })

  /**
   * דוגמה רשמית מתוך מסמך המחקר: הכנסה חייבת 240,000 ₪ ⇐ מס לפני זיכויים
   * 38,712 ₪ (ראו "מס הכנסה בישראל..." סעיף "דוגמה שנתית מלאה לעצמאי").
   */
  it('תואם את הדוגמה הרשמית: 240,000 ₪ ⇐ 38,712 ₪ לפני זיכויים', () => {
    expect(computeAnnualIncomeTaxBeforeCredits(240_000)).toBeCloseTo(38_712, 2)
  })

  it('מדרגה עליונה: 50% על החלק שמעל 721,560', () => {
    const base = computeAnnualIncomeTaxBeforeCredits(721_560)
    const withExtra = computeAnnualIncomeTaxBeforeCredits(721_560 + 10_000)
    expect(withExtra - base).toBeCloseTo(5_000, 2) // 50% מתוך 10,000
  })
})

describe('computeCreditPoints', () => {
  it('גבר תושב ישראל, ללא ילדים: 2.25 נקודות בלבד', () => {
    const profile = createDefaultProfile()
    profile.personal.gender = 'male'
    expect(computeCreditPoints(profile.personal, 2026)).toBeCloseTo(2.25, 5)
  })

  it('אישה תושבת ישראל, ללא ילדים: 2.75 נקודות (VERIFIED בדוגמה הרשמית)', () => {
    const profile = createDefaultProfile()
    profile.personal.gender = 'female'
    expect(computeCreditPoints(profile.personal, 2026)).toBeCloseTo(2.75, 5)
  })

  it('מוסיף נקודות זיכוי נוספות שהוזנו ידנית', () => {
    const profile = createDefaultProfile()
    profile.personal.gender = 'male'
    profile.personal.manualExtraCreditPoints = 1.5
    expect(computeCreditPoints(profile.personal, 2026)).toBeCloseTo(2.25 + 1.5, 5)
  })

  it('ילד/ה בן/בת 10 להורה-אם: +2 נקודות (טווח גילאי 6–17)', () => {
    const profile = createDefaultProfile()
    profile.personal.gender = 'female'
    profile.personal.children = [{ id: '1', birthYear: 2016 }] // גיל 10 בשנת 2026
    expect(computeCreditPoints(profile.personal, 2026)).toBeCloseTo(2.75 + 2, 5)
  })

  it('ילד/ה בן שנה להורה-אב: +4.5 נקודות', () => {
    const profile = createDefaultProfile()
    profile.personal.gender = 'male'
    profile.personal.children = [{ id: '1', birthYear: 2025 }] // גיל 1 בשנת 2026
    expect(computeCreditPoints(profile.personal, 2026)).toBeCloseTo(2.25 + 4.5, 5)
  })

  it('ילד/ה מעל גיל 18: ללא נקודות נוספות', () => {
    const profile = createDefaultProfile()
    profile.personal.children = [{ id: '1', birthYear: 2000 }] // גיל 26 בשנת 2026
    expect(computeCreditPoints(profile.personal, 2026)).toBeCloseTo(2.75, 5)
  })
})

describe('estimateIncomeTax — דוגמה רשמית מלאה', () => {
  /**
   * מתוך מסמך המחקר: רווח שנתי 240,000 ₪, 2.25 נקודות זיכוי ⇐
   * מס לפני זיכויים 38,712 ₪, זיכוי 6,534 ₪, מס לאחר זיכויים 32,178 ₪.
   */
  it('240,000 ₪ לשנה, 2.25 נקודות ⇐ 32,178 ₪ מס לאחר זיכויים', () => {
    const profile = createDefaultProfile()
    profile.personal.gender = 'male' // 2.25 נקודות בלבד, כמו בדוגמה
    const monthlyProfit = 240_000 / 12

    const result = estimateIncomeTax(monthlyProfit, profile)

    expect(result.annualTaxBeforeCredits).toBeCloseTo(38_712, 2)
    expect(result.annualCreditValue).toBeCloseTo(2.25 * CREDIT_POINT_MONTHLY_VALUE_2026 * 12, 2)
    expect(result.annualCreditValue).toBeCloseTo(6_534, 0)
    expect(result.annualTaxAfterCredits).toBeCloseTo(32_178, 0)
  })
})
