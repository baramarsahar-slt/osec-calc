import { describe, expect, it } from 'vitest'
import { parseMorningCsv } from './morningImport'

// שורות אמיתיות מתוך Expenses.01.10.2026-31.10.2026.csv (קובץ הדוגמה שסופק לפרויקט),
// כולל שורה עם מטבע זר (RUB) כדי לוודא שקוראים את "סכום כולל" המומר לש"ח ולא
// את הסכום במטבע המקור.
const SAMPLE_CSV = `"מספר המסמך","תאריך המסמך","חודש דיווח","סוג המסמך",ספק,"מספר עוסק",תיאור,"סכום כולל מע״מ","מע""מ",מטבע,"שער מטבע","תיאור חשבון הוצאה","קוד 6111","קוד מיון","מפתח חשבון","סכום הוצאה מוכרת","סכום מע״מ מוכר","סכום כולל","שולם באמצעות",הערות,"מספר הקצאה",קישור
71365253,06/10/2026,10/2026,"חשבונית מס","טלזר 019 שרותי",514384197,"(ללא תיאור)",39.6,6.04,ILS,,"הוצאות תקשורת וטלפון",3650,3500,3650,35.57,4.03,39.6,"כרטיס אשראי",,,https://example.com/1
50001,11/10/2026,10/2026,"חשבונית מס",סקויה,558618849,"החלק של יעל בהכנסות אוגוסט",4375,667.37,ILS,,"עלויות אחרות",1390,1300,1390,3707.63,667.37,4375,"העברה בנקאית",,,https://example.com/2
2037,11/10/2026,10/2026,"חשבונית מס / קבלה",סקויה,558618849,"(ללא תיאור)",2662.5,406.14,ILS,,שכירות,3070,3000,3070,2256.36,406.14,2662.5,"העברה בנקאית",,,https://example.com/3
51106,14/10/2026,10/2026,"חשבון / אישור תשלום","רובן כרמל בע""מ",515050680,"מסיבת סיום קבוצה",165,25.17,RUB,0.037041,"כיבודים, מתנות, תרומות, קנסות",3625,3500,3625,5.18,0.93,6.11,"כרטיס אשראי",,,https://example.com/4
`

describe('parseMorningCsv', () => {
  it('מפרסר את כל השורות התקינות בקובץ הדוגמה האמיתי', () => {
    const result = parseMorningCsv(SAMPLE_CSV)
    expect(result.formatError).toBe(false)
    expect(result.totalRows).toBe(4)
    expect(result.skippedRows).toBe(0)
    expect(result.expenses).toHaveLength(4)
  })

  it('קורא ספק כתיאור, קטגוריה, סכום כולל ומע"מ מוכר — מהעמודות הנכונות', () => {
    const result = parseMorningCsv(SAMPLE_CSV)
    const first = result.expenses[0]
    expect(first.description).toBe('טלזר 019 שרותי')
    expect(first.category).toBe('הוצאות תקשורת וטלפון')
    expect(first.amount).toBeCloseTo(39.6, 2)
    expect(first.vatAmount).toBeCloseTo(4.03, 2)
    expect(first.importSource).toBe('morning')
    expect(first.source).toBe('business')
    expect(first.frequency).toBe('monthly')
  })

  it('שורה במטבע זר — קוראת את "סכום כולל" (המומר לש"ח), לא את הסכום במטבע המקור', () => {
    const result = parseMorningCsv(SAMPLE_CSV)
    const rubRow = result.expenses.find((e) => e.description.includes('רובן כרמל'))
    expect(rubRow).toBeDefined()
    // 165 RUB × 0.037041 ≈ 6.11 ₪ — לא 165
    expect(rubRow!.amount).toBeCloseTo(6.11, 2)
    expect(rubRow!.vatAmount).toBeCloseTo(0.93, 2)
  })

  it('שתי הוצאות מאותו ספק (סקויה) נשארות כשתי שורות נפרדות', () => {
    const result = parseMorningCsv(SAMPLE_CSV)
    const fromSekoya = result.expenses.filter((e) => e.description === 'סקויה')
    expect(fromSekoya).toHaveLength(2)
  })

  it('מזהה קובץ שאינו בפורמט הנכון (חסרות עמודות מפתח)', () => {
    const result = parseMorningCsv('עמודה א,עמודה ב\n1,2\n')
    expect(result.formatError).toBe(true)
    expect(result.expenses).toHaveLength(0)
  })

  it('מדלגת על שורה בלי ספק/קטגוריה או עם סכום 0, סופרת אותה כ"נפסלה"', () => {
    const csvWithBadRow = `${SAMPLE_CSV.trimEnd()}\n,15/10/2026,10/2026,"חשבונית מס",,000000000,"",0,0,ILS,,,,,,,,0,,,,\n`
    const result = parseMorningCsv(csvWithBadRow)
    expect(result.totalRows).toBe(5)
    expect(result.skippedRows).toBe(1)
    expect(result.expenses).toHaveLength(4)
  })
})
