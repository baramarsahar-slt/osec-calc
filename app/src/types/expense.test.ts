import { describe, expect, it } from 'vitest'
import { migrateLegacyFrequency, monthlyEquivalent } from './expense'

describe('migrateLegacyFrequency', () => {
  it('ממירה "one_time" הישן ל-"monthly" (מוזגו לאותה קטגוריה)', () => {
    expect(migrateLegacyFrequency('one_time')).toBe('monthly')
  })

  it('לא נוגעת בתדירויות תקפות אחרות', () => {
    expect(migrateLegacyFrequency('monthly')).toBe('monthly')
    expect(migrateLegacyFrequency('bi_monthly')).toBe('bi_monthly')
    expect(migrateLegacyFrequency('annual')).toBe('annual')
  })

  it('הוצאה ישנה עם "one_time" מתנהגת בדיוק כמו "monthly" בחישוב (מחלק 1)', () => {
    const migrated = migrateLegacyFrequency('one_time')
    expect(monthlyEquivalent({ amount: 1_000, frequency: migrated })).toBe(1_000)
  })
})
