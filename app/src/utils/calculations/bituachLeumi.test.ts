import { describe, expect, it } from 'vitest'
import { estimateBituachLeumi } from './bituachLeumi'
import { createDefaultProfile } from '../../types/profile'

describe('estimateBituachLeumi', () => {
  it('רווח מתחת לסף — כל הרווח באחוז המופחת (7.70%)', () => {
    const profile = createDefaultProfile()
    const result = estimateBituachLeumi(5_000, profile)
    expect(result.monthlyPayment).toBeCloseTo(5_000 * 0.077, 2)
    expect(result.minimumBaseApplied).toBe(false)
  })

  it('רווח 0 — הבסיס עולה למינימום החוקי (3,442 ₪) כשזהו העיסוק היחיד', () => {
    const profile = createDefaultProfile()
    const result = estimateBituachLeumi(0, profile)
    expect(result.minimumBaseApplied).toBe(true)
    expect(result.calculationBase).toBe(3_442)
    expect(result.monthlyPayment).toBeCloseTo(3_442 * 0.077, 2)
  })

  it('רווח 0 אך יש גם הכנסה כשכיר/ה — אין הפעלת מינימום', () => {
    const profile = createDefaultProfile()
    profile.bituachLeumi.hasEmployeeIncome = true
    const result = estimateBituachLeumi(0, profile)
    expect(result.minimumBaseApplied).toBe(false)
    expect(result.monthlyPayment).toBe(0)
  })

  it('רווח מעל הסף — שילוב שני האחוזים (7.70% + 18.00%)', () => {
    const profile = createDefaultProfile()
    const result = estimateBituachLeumi(10_000, profile)
    const expected = 7_703 * 0.077 + (10_000 - 7_703) * 0.18
    expect(result.monthlyPayment).toBeCloseTo(expected, 2)
  })

  it('רווח מעל התקרה (51,910) — אין תוספת מעבר לתקרה', () => {
    const profile = createDefaultProfile()
    const atCeiling = estimateBituachLeumi(51_910, profile)
    const aboveCeiling = estimateBituachLeumi(80_000, profile)
    expect(aboveCeiling.monthlyPayment).toBeCloseTo(atCeiling.monthlyPayment, 2)
  })

  it('לא עומדת בהגדרת "עצמאי" — אין חיוב', () => {
    const profile = createDefaultProfile()
    profile.bituachLeumi.meetsSelfEmployedDefinition = false
    const result = estimateBituachLeumi(20_000, profile)
    expect(result.monthlyPayment).toBe(0)
  })
})
