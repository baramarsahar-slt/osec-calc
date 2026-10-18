import { describe, expect, it } from 'vitest'
import { addMonthsToKey, currentMonthKey } from './useMonthlyIncome'

describe('currentMonthKey', () => {
  it('מפרמט תאריך למפתח "YYYY-MM", עם חודש בשתי ספרות', () => {
    expect(currentMonthKey(new Date(2026, 0, 15))).toBe('2026-01') // ינואר
    expect(currentMonthKey(new Date(2026, 9, 15))).toBe('2026-10') // אוקטובר
  })
})

describe('addMonthsToKey', () => {
  it('מחזיר את החודש הקודם', () => {
    expect(addMonthsToKey('2026-06', -1)).toBe('2026-05')
  })

  it('מטפל נכון במעבר שנה אחורה (ינואר ⇐ דצמבר שנה קודמת)', () => {
    expect(addMonthsToKey('2026-01', -1)).toBe('2025-12')
  })

  it('מטפל נכון במעבר שנה קדימה (דצמבר ⇐ ינואר שנה הבאה)', () => {
    expect(addMonthsToKey('2026-12', 1)).toBe('2027-01')
  })

  it('delta=0 מחזיר את אותו מפתח', () => {
    expect(addMonthsToKey('2026-06', 0)).toBe('2026-06')
  })
})
