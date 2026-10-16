import type { UserProfile } from '../types/profile'
import { computeMonthlyFinancials, type MonthlyFinancials } from './calculations'
import type { DrawStop } from '../components/dashboard/NetSalaryScale'

export interface DashboardDrawInputs {
  profile: UserProfile
  monthKey: string // "YYYY-MM" של החודש הנוכחי
  grossIncome: number
  businessExpensesMonthly: number
  privateLoanMonthly: number
  businessVatDeductibleMonthly: number
  /** כל ההכנסות שהוזנו אי-פעם, לפי מפתח חודש — לחישוב "ממוצע" */
  incomeHistory: Record<string, number>
}

export interface DashboardDrawResult {
  financials: MonthlyFinancials
  /** יעד כרית הביטחון בש"ח: חודשי היעד × סך ההוצאות החודשי הנוכחי */
  safetyNetTarget: number
  /** 4 נקודות על הסרגל, ממוינות לפי ערך עולה */
  drawStops: DrawStop[]
}

function monthNumberFromKey(monthKey: string): number {
  return Number(monthKey.split('-')[1])
}

/**
 * ממוצע "נטו אחרי תשלומים סטטוטוריים" על פני כל החודשים שיש להם הכנסה
 * רשומה, תוך הפעלת ה-expenses/VAT-deductible הנוכחיים על כל חודש.
 * קירוב מוצהר: אין עדיין ארכיון הוצאות חודשי (ייבנה בעתיד), כך שהחישוב
 * ההיסטורי מניח שרשימת ההוצאות של היום משקפת גם חודשים קודמים.
 */
function computeAverageNet(
  profile: UserProfile,
  incomeHistory: Record<string, number>,
  businessExpensesMonthly: number,
  businessVatDeductibleMonthly: number,
): number {
  const entries = Object.entries(incomeHistory)
  if (entries.length === 0) return 0

  const total = entries.reduce((sum, [monthKey, income]) => {
    const result = computeMonthlyFinancials({
      profile,
      monthNumber: monthNumberFromKey(monthKey),
      grossIncome: income,
      businessExpensesMonthly,
      privateLoanMonthly: 0, // הלוואת בעלים נוספת בנפרד בסוף, לא חלק מהבסיס להשוואה
      businessVatDeductibleMonthly,
      previousMonth: null,
    })
    return sum + result.cashAfterStatutoryPayments
  }, 0)

  return total / entries.length
}

export function computeDashboardDraw(input: DashboardDrawInputs): DashboardDrawResult {
  const {
    profile,
    monthKey,
    grossIncome,
    businessExpensesMonthly,
    privateLoanMonthly,
    businessVatDeductibleMonthly,
    incomeHistory,
  } = input

  const financials = computeMonthlyFinancials({
    profile,
    monthNumber: monthNumberFromKey(monthKey),
    grossIncome,
    businessExpensesMonthly,
    privateLoanMonthly,
    businessVatDeductibleMonthly,
    // אין עדיין ארכיון חודשי — ראו הערה במנוע המע"מ (vat.ts) לגבי המשמעות
    previousMonth: null,
  })

  const safetyNetTarget = profile.safetyNet.targetMonthsOfExpenses * businessExpensesMonthly
  const gapToTarget = Math.max(0, safetyNetTarget - profile.safetyNet.currentBalance)

  const actualNet = financials.cashAfterStatutoryPayments
  const averageNet = computeAverageNet(profile, incomeHistory, businessExpensesMonthly, businessVatDeductibleMonthly)

  // שמרני: אם יש פער לכרית, מעדיפים למלא אותו קודם — מה שנשאר הוא המשיכה
  const minDraw = Math.max(0, actualNet - Math.min(actualNet, gapToTarget))
  // אגרסיבי: מושכים את כל הנטו הזמין, בלי להתחשב ביעד הכרית
  const maxDraw = Math.max(0, actualNet)

  const rawStops: DrawStop[] = [
    { key: 'min', label: 'משיכה מינימלית', description: 'שמרני — מתעדף מילוי כרית הביטחון', value: minDraw },
    { key: 'average', label: 'נטו ממוצע מומלץ', description: 'בסיס השוואה, לפי ההכנסות שהוזנו עד כה', value: averageNet },
    { key: 'actual', label: 'נטו בפועל', description: 'הרווח הנקי האמיתי של החודש הנוכחי', value: actualNet },
    { key: 'max', label: 'משיכה מקסימלית', description: 'אגרסיבי — כל הנטו הזמין, בלי שמירה לכרית', value: maxDraw },
  ]

  const drawStops = [...rawStops].sort((a, b) => a.value - b.value)

  return { financials, safetyNetTarget, drawStops }
}
