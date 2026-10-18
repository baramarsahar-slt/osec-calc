import { useMemo, useState } from 'react'
import { useUserProfile } from '../hooks/useUserProfile'
import { useExpenses } from '../hooks/useExpenses'
import { currentMonthKey, useMonthlyIncome } from '../hooks/useMonthlyIncome'
import { computeDashboardDraw } from '../utils/dashboardDraw'
import { TaskCard } from '../components/dashboard/TaskCard'
import { SafetyNetProgress } from '../components/dashboard/SafetyNetProgress'
import { NetSalaryScale } from '../components/dashboard/NetSalaryScale'
import { PrivateLoanCard } from '../components/dashboard/PrivateLoanCard'
import { FinalDrawCard } from '../components/dashboard/FinalDrawCard'

const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

const monthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
}

export default function Dashboard() {
  const { profile } = useUserProfile()
  const { getMonthlyTotals } = useExpenses()
  const { incomeByMonth, getIncomeForMonth } = useMonthlyIncome()

  // הדשבורד תמיד מציג את "עכשיו" (החודש האמיתי של היום) — לא מושפע מבחירת
  // החודש בעמוד "החודש שלי", שמשמשת רק להזנת/תיקון נתונים היסטוריים.
  const monthKey = currentMonthKey()
  const grossIncome = getIncomeForMonth(monthKey)
  const totals = getMonthlyTotals(monthKey)

  const [selectedDrawIndex, setSelectedDrawIndex] = useState<number | null>(null)

  const { financials, safetyNetTarget, drawStops } = useMemo(
    () =>
      computeDashboardDraw({
        profile,
        monthKey,
        grossIncome,
        businessExpensesActual: totals.businessActual,
        privateLoanMonthly: totals.privateLoanActual,
        businessVatDeductibleActual: totals.businessVatDeductibleActual,
        businessExpensesSmoothed: totals.businessSmoothed,
        incomeHistory: incomeByMonth,
        getExpenseTotalsForMonth: (key) => {
          const monthTotals = getMonthlyTotals(key)
          return {
            businessExpensesActual: monthTotals.businessActual,
            businessVatDeductibleActual: monthTotals.businessVatDeductibleActual,
            businessExpensesSmoothed: monthTotals.businessSmoothed,
            businessVatDeductibleSmoothed: monthTotals.businessVatDeductibleSmoothed,
          }
        },
      }),
    [profile, monthKey, grossIncome, totals, incomeByMonth, getMonthlyTotals],
  )

  // ברירת מחדל הגיונית: "נטו בפועל" אם קיים ברשימה, אחרת האמצע
  const defaultIndex = Math.max(
    0,
    drawStops.findIndex((s) => s.key === 'actual'),
  )
  const activeIndex = selectedDrawIndex ?? defaultIndex
  const selectedStop = drawStops[activeIndex] ?? drawStops[0]

  if (grossIncome <= 0) {
    return (
      <section className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-bold text-terra">דשבורד</h1>
        <p className="text-brown">
          עדיין לא הוזנה הכנסה לחודש {monthLabel(monthKey)}. כדי לראות את התמונה המלאה, יש להזין הכנסה והוצאות
          בעמוד "החודש שלי".
        </p>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-terra">דשבורד</h1>
        <p className="mt-1 text-brown">חודש: {monthLabel(monthKey)}</p>
      </div>

      {/* 1. כרטיסיות משימה לפעולה */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold text-ink">משימות לפעולה</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {financials.vat.applicable && (
            <TaskCard
              title="מע״מ"
              amount={financials.vat.isReportingMonth ? financials.vat.netPayable : financials.vat.accruedHoldAmount}
              badge={
                financials.vat.isReportingMonth
                  ? { text: 'חודש דיווח', tone: 'warning' }
                  : { text: 'נצבר, לא לתשלום החודש', tone: 'neutral' }
              }
            >
              {financials.vat.isReportingMonth
                ? 'סכום סופי לתשלום/החזר לרשות המסים, מאוחד עם החודש הקודם.'
                : 'מומלץ להפריש בצד עד חודש הדיווח הבא.'}
              {financials.vat.isReportingMonth && financials.vat.previousMonthNetVat !== null && (
                <p className="mt-1 text-xs text-taupe">
                  (<span dir="ltr">{currency.format(financials.vat.currentMonthNetVat)}</span> מהחודש הנוכחי +{' '}
                  <span dir="ltr">{currency.format(financials.vat.previousMonthNetVat)}</span> מהחודש הקודם)
                </p>
              )}
            </TaskCard>
          )}

          <TaskCard
            title="מקדמת מס הכנסה"
            amount={financials.incomeTaxAdvance.advanceAmount}
            badge={
              financials.incomeTaxAdvance.source === 'assigned'
                ? { text: `${financials.incomeTaxAdvance.ratePercent.toFixed(1)}% רשמי`, tone: 'neutral' }
                : { text: 'הערכה בלבד', tone: 'warning' }
            }
          >
            {financials.incomeTaxAdvance.source === 'assigned'
              ? 'לפי האחוז שנקבע בתיק ברשות המסים.'
              : 'אחוז רשמי לא הוזן בפרופיל — זו הערכה לפי מדרגות המס, לא המספר הרשמי.'}
          </TaskCard>

          {profile.bituachLeumi.meetsSelfEmployedDefinition && (
            <TaskCard title="ביטוח לאומי" amount={financials.bituachLeumi.monthlyPayment}>
              {financials.bituachLeumi.minimumBaseApplied
                ? 'חושב לפי בסיס המינימום החוקי (הרווח בפועל היה נמוך ממנו).'
                : 'לפי הרווח החייב בפועל החודש.'}
            </TaskCard>
          )}

          <TaskCard
            title="פנסיה וקה״ש"
            amount={financials.pension.actualMonthlyDeposit + financials.pension.actualStudyFundDeposit}
            badge={
              financials.pension.belowMandatoryMinimum
                ? { text: 'מתחת לחובה — תוקן', tone: 'warning' }
                : undefined
            }
          >
            חובה חוקית מזערית: {currency.format(financials.pension.mandatoryMonthlyDeposit)} לחודש.
          </TaskCard>
        </div>
      </section>

      {/* 2. כרית ביטחון */}
      <section className="flex flex-col gap-3 rounded-brand-lg bg-beige-2 p-5">
        <h2 className="font-heading text-lg font-bold text-ink">כרית ביטחון עסקית</h2>
        <SafetyNetProgress
          currentBalance={profile.safetyNet.currentBalance}
          targetAmount={safetyNetTarget}
          targetMonths={profile.safetyNet.targetMonthsOfExpenses}
        />
      </section>

      {/* 3. סקאלת הנטו */}
      <section className="flex flex-col gap-3 rounded-brand-lg bg-beige-2 p-5">
        <h2 className="font-heading text-lg font-bold text-ink">סקאלת הנטו — בחירת מודל משיכה</h2>
        <NetSalaryScale stops={drawStops} selectedIndex={activeIndex} onSelect={setSelectedDrawIndex} />
      </section>

      {/* 4. הלוואת בעלים */}
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-bold text-ink">החזר הלוואת בעלים</h2>
        <PrivateLoanCard amount={totals.privateLoanActual} />
      </section>

      {/* 5. סכום סופי למשיכה */}
      <FinalDrawCard baseDraw={selectedStop.value} privateLoanAmount={totals.privateLoanActual} />
    </div>
  )
}
