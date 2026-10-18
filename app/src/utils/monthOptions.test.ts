import { describe, expect, it } from 'vitest'
import { getSelectableMonths } from './monthOptions'

describe('getSelectableMonths', () => {
  it('מתחיל בינואר 2026 ומסתיים בחודש הנוכחי, מהחדש לישן', () => {
    const months = getSelectableMonths(new Date(2026, 2, 10)) // מרץ 2026

    expect(months.map((m) => m.key)).toEqual(['2026-03', '2026-02', '2026-01'])
  })

  it('אם "היום" הוא ינואר 2026, מחזיר רק את ינואר (אין חודשים לפני)', () => {
    const months = getSelectableMonths(new Date(2026, 0, 5))
    expect(months.map((m) => m.key)).toEqual(['2026-01'])
  })

  it('לא כולל חודשים עתידיים', () => {
    const months = getSelectableMonths(new Date(2026, 9, 18)) // 18 באוקטובר 2026
    expect(months[0].key).toBe('2026-10')
    expect(months).toHaveLength(10) // ינואר עד אוקטובר
  })
})
