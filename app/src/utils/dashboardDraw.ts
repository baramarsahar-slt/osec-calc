import type { UserProfile } from '../types/profile'
import { computeMonthlyFinancials, type MonthlyFinancials } from './calculations'
import type { DrawStop } from '../components/dashboard/NetSalaryScale'
import { addMonthsToKey } from '../hooks/useMonthlyIncome'

export interface MonthExpenseTotals {
  /** בפועל (לא מוחלק) — לחישובי מס/מע"מ/תזרים אמיתי */
  businessExpensesActual: number
  businessVatDeductibleActual: number
  /** "מוחלק" לפי תדירות — רק לסימולציית ה"ממוצע" ויעד כרית הביטחון */
  businessExpensesSmoothed: number
  businessVatDeductibleSmoothed: number
}

export interface DashboardDrawInputs {
  profile: UserProfile
  monthKey: string // "YYYY-MM" של החודש הנוכחי
  grossIncome: number
  /** הוצאות עסקיות החודש, בפועל — זה מה שנכנס לחישוב הרווח/מס/מע"מ האמיתי */
  businessExpensesActual: number
  privateLoanMonthly: number
  businessVatDeductibleActual: number
  /** הוצאות עסקיות החודש, "מוחלקות" — ליעד כרית הביטחון בלבד */
  businessExpensesSmoothed: number
  /** כל ההכנסות שהוזנו אי-פעם, לפי מפתח חודש — לחישוב "ממוצע" */
  incomeHistory: Record<string, number>
  /** מחזירה את הוצאות החודש (בפועל + מוחלק) של חודש נתון */
  getExpenseTotalsForMonth: (monthKey: string) => MonthExpenseTotals
}

export interface DashboardDrawResult {
  financials: MonthlyFinancials
  /** יעד כרית הביטחון בש"ח: חודשי היעד × הוצאות חודשיות "מוחלקות" (טיפוסיות) */
  safetyNetTarget: number
  /** 4 נקודות על הסרגל, ממוינות לפי ערך עולה */
  drawStops: DrawStop[]
}

function monthNumberFromKey(monthKey: string): number {
  return Number(monthKey.split('-')[1])
}

/**
 * "נטו ממוצע מומלץ" — על פני כל החודשים שיש להם הכנסה רשומה, אבל **עם
 * הוצאות מוחלקות** (לא ההוצאה המלאה בפועל של כל חודש). זה בכוונה: המטרה
 * של ה-stop הזה היא בסיס יציב להשוואה, לא שיקוף מדויק של כל חודש לחוד —
 * לכן תשלום שנתי גדול לא אמור "לקפוץ" את הממוצע הזה. חישוב המס/המע"מ
 * בפועל (financials הראשי למטה) תמיד משתמש בסכומים האמיתיים, לא באלה.
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
      businessExpensesMonthly: monthExpenses.businessExpensesSmoothed,
      privateLoanMonthly: 0, // הלוואת בעלים נוספת בנפרד בסוף, לא חלק מהבסיס להשוואה
      businessVatDeductibleMonthly: monthExpenses.businessVatDeductibleSmoothed,
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
    businessExpensesActual,
    privateLoanMonthly,
    businessVatDeductibleActual,
    businessExpensesSmoothed,
    incomeHistory,
    getExpenseTotalsForMonth,
  } = input

  // נתוני החודש הקודם בפועל (אם הוזנו) — מאפשרים איחוד דו-חודשי אמיתי של
  // מע"מ, במקום להניח "אין היסטוריה" בכל חודש. תמיד הסכומים האמיתיים —
  // התחשבנות מע"מ מול הרשות היא תמיד לפי מה ששולם בפועל, לא מוחלק.
  const previousMonthKey = addMonthsToKey(monthKey, -1)
  const previousMonthIncome = incomeHistory[previousMonthKey]
  const previousMonth =
    previousMonthIncome !== undefined
      ? {
          grossIncome: previousMonthIncome,
          businessExpensesMonthly: getExpenseTotalsForMonth(previousMonthKey).businessExpensesActual,
          businessVatDeductibleMonthly: getExpenseTotalsForMonth(previousMonthKey).businessVatDeductibleActual,
        }
      : null

  const financials = computeMonthlyFinancials({
    profile,
    monthNumber: monthNumberFromKey(monthKey),
    grossIncome,
    businessExpensesMonthly: businessExpensesActual,
    privateLoanMonthly,
    businessVatDeductibleMonthly: businessVatDeductibleActual,
    previousMonth,
  })

  // יעד כרית הביטחון לפי הוצאה "טיפוסית" (מוחלקת) — לא לפי החודש הנוכחי
  // שעשוי להיות חריג (גבוה בגלל תשלום שנתי, או נמוך באקראי)
  const safetyNetTarget = profile.safetyNet.targetMonthsOfExpenses * businessExpensesSmoothed
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
