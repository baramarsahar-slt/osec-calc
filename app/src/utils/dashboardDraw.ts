import type { UserProfile } from '../types/profile'
import { computeMonthlyFinancials, type MonthlyFinancials } from './calculations'
import type { DrawStop } from '../components/dashboard/NetSalaryScale'
import { addMonthsToKey } from '../hooks/useMonthlyIncome'

export interface MonthExpenseTotals {
  businessExpensesMonthly: number
  businessVatDeductibleMonthly: number
}

export interface DashboardDrawInputs {
  profile: UserProfile
  monthKey: string // "YYYY-MM" של החודש הנוכחי
  grossIncome: number
  businessExpensesMonthly: number
  privateLoanMonthly: number
  businessVatDeductibleMonthly: number
  /** כל ההכנסות שהוזנו אי-פעם, לפי מפתח חודש — לחישוב "ממוצע" */
  incomeHistory: Record<string, number>
  /** מחזירה את ההוצאות העסקיות בפועל של חודש נתון — ממשית, לא קירוב */
  getExpenseTotalsForMonth: (monthKey: string) => MonthExpenseTotals
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
 * רשומה — כל חודש משתמש **בהוצאות שלו עצמו בפועל**, לא בהוצאות החודש
 * הנוכחי. ככל שיש יותר היסטוריה אמיתית, הממוצע הזה מדויק יותר.
 */
function computeAverageNet(
  profile: UserProfile,
  incomeHistory: Record<string, number>,
  getExpenseTotalsForMonth: (monthKey: string) => MonthExpenseTotals,
): number {
  const entries = Object.entries(incomeHistory)
  if (entries.length === 0) return 0

  const total = entries.reduce((sum, [monthKey, income]) => {
    const monthExpenses = getExpenseTotalsForMonth(monthKey)
    const result = computeMonthlyFinancials({
      profile,
      monthNumber: monthNumberFromKey(monthKey),
      grossIncome: income,
      businessExpensesMonthly: monthExpenses.businessExpensesMonthly,
      privateLoanMonthly: 0, // הלוואת בעלים נוספת בנפרד בסוף, לא חלק מהבסיס להשוואה
      businessVatDeductibleMonthly: monthExpenses.businessVatDeductibleMonthly,
      previousMonth: null, // ממוצע הוא תמונת-מצב חודשית בודדת לכל חודש, לא התחשבנות מע"מ מאוחדת
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
    getExpenseTotalsForMonth,
  } = input

  // נתוני החודש הקודם בפועל (אם הוזנו) — מאפשרים איחוד דו-חודשי אמיתי של
  // מע"מ, במקום להניח "אין היסטוריה" בכל חודש.
  const previousMonthKey = addMonthsToKey(monthKey, -1)
  const previousMonthIncome = incomeHistory[previousMonthKey]
  const previousMonth =
    previousMonthIncome !== undefined
      ? {
          grossIncome: previousMonthIncome,
          businessExpensesMonthly: getExpenseTotalsForMonth(previousMonthKey).businessExpensesMonthly,
          businessVatDeductibleMonthly: getExpenseTotalsForMonth(previousMonthKey).businessVatDeductibleMonthly,
        }
      : null

  const financials = computeMonthlyFinancials({
    profile,
    monthNumber: monthNumberFromKey(monthKey),
    grossIncome,
    businessExpensesMonthly,
    privateLoanMonthly,
    businessVatDeductibleMonthly,
    previousMonth,
  })

  const safetyNetTarget = profile.safetyNet.targetMonthsOfExpenses * businessExpensesMonthly
  const gapToTarget = Math.max(0, safetyNetTarget - profile.safetyNet.currentBalance)

  const actualNet = financials.cashAfterStatutoryPayments
  const averageNet = computeAverageNet(profile, incomeHistory, getExpenseTotalsForMonth)

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
