import { describe, expect, it } from 'vitest'
import { estimateIncomeTaxAdvance } from './incomeTaxAdvance'
import { createDefaultProfile } from '../../types/profile'

describe('estimateIncomeTaxAdvance', () => {
  it('משתמשת באחוז הרשמי שהוזן, בלי קשר לאסטרטגיה', () => {
    const profile = createDefaultProfile()
    profile.revenueForecast.assignedAdvanceRatePercent = 8
    profile.advanceStrategy = 'aggressive' // לא אמור להשפיע כשיש אחוז רשמי

    const result = estimateIncomeTaxAdvance(50_000, 30_000, profile)

    expect(result.source).toBe('assigned')
    expect(result.ratePercent).toBe(8)
    expect(result.advanceAmount).toBeCloseTo(4_000, 2)
  })

  it('בלי אחוז רשמי — אסטרטגיה "מדויק" לא משנה את ההערכה הבסיסית', () => {
    const profile = createDefaultProfile()
    profile.revenueForecast.assignedAdvanceRatePercent = null
    profile.advanceStrategy = 'precise'

    const result = estimateIncomeTaxAdvance(30_000, 20_000, profile)
    expect(result.source).toBe('estimated')
    expect(result.ratePercent).toBeGreaterThan(0)
  })

  it('אסטרטגיה "שמרנית" מניבה הערכה גבוהה יותר מ"אגרסיבית", על אותם נתונים', () => {
    const conservative = createDefaultProfile()
    conservative.revenueForecast.assignedAdvanceRatePercent = null
    conservative.advanceStrategy = 'conservative'

    const aggressive = createDefaultProfile()
    aggressive.revenueForecast.assignedAdvanceRatePercent = null
    aggressive.advanceStrategy = 'aggressive'

    const resultConservative = estimateIncomeTaxAdvance(30_000, 20_000, conservative)
    const resultAggressive = estimateIncomeTaxAdvance(30_000, 20_000, aggressive)

    expect(resultConservative.advanceAmount).toBeGreaterThan(resultAggressive.advanceAmount)
  })
})
