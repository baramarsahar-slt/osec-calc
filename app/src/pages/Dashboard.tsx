import { useMemo, useState } from 'react'
import { useUserProfile } from '../hooks/useUserProfile'
import { useExpenses } from '../hooks/useExpenses'
import { currentMonthKey, useMonthlyIncome } from '../hooks/useMonthlyIncome'
import { computeDashboardDraw } from '../utils/dashboardDraw'
import { checkAdvanceRateAlignment } from '../utils/advanceRateCheck'
import { TaskCard } from '../components/dashboard/TaskCard'
import { VatTaskCard } from '../components/dashboard/VatTaskCard'
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

  const advanceRateCheck = useMemo(() => {
    const currentYear = new Date().getFullYear().toString()
    const monthsThisYear = Object.entries(incomeByMonth)
      .filter(([key]) => key.startsWith(currentYear))
      .map(([key, income]) => ({
        monthKey: key,
        grossIncome: income,
        businessExpensesActual: getMonthlyTotals(key).businessActual,
      }))
    return checkAdvanceRateAlignment(profile, monthsThisYear, financials.incomeTaxAdvance.ratePercent)
  }, [profile, incomeByMonth, getMonthlyTotals, financials.incomeTaxAdvance.ratePercent])

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
          {financials.vat.applicable && <VatTaskCard vat={financials.vat} reportingMonthKey={monthKey} />}

          <TaskCard
            title="מקדמת מס הכנסה"
            amount={financials.incomeTaxAdvance.advanceAmount}
            badge={
              financials.incomeTaxAdvance.source === 'assigned'
                ? { text: `${financials.incomeTaxAdvance.ratePercent.toFixed(1)}% רשמי`, tone: 'neutral' }
                : { text: 'הערכה בלבד', tone: 'warning' }
            }
          >
            <p>
              {financials.incomeTaxAdvance.source === 'assigned'
                ? 'לפי האחוז שנקבע בתיק ברשות המסים.'
                : 'אחוז רשמי לא הוזן בפרופיל — זו הערכה לפי מדרגות המס, לא המספר הרשמי.'}
            </p>
            {advanceRateCheck?.isSignificantGap && (
              <p className="mt-1 text-xs font-semibold text-terra-deep">
                ⚠ לפי {advanceRateCheck.monthsEntered} חודשי הכנסה שהוזנו השנה, התחזית למחזור שנתי (ללא מע״מ) היא{' '}
                <span dir="ltr">{currency.format(advanceRateCheck.projectedAnnualTurnoverExclVat)}</span> — האחוז שבאמת נראה
                נדרש הוא כ-{advanceRateCheck.neededRatePercent.toFixed(1)}%, מול{' '}
                {advanceRateCheck.actualRatePercent.toFixed(1)}% בפועל. כדאי לבדוק מול רו"ח אם נדרש עדכון מקדמות —
                זו הערכת-בטן בלבד, לא המלצה.
              </p>
            )}
            <a
              href="https://www.gov.il/he/service/itc-payment-online-incometax"
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-terra-deep underline"
            >
              לדיווח ותשלום מקדמות באתר רשות המסים
            </a>
          </TaskCard>

          {profile.bituachLeumi.meetsSelfEmployedDefinition && (
            <TaskCard title="ביטוח לאומי" amount={financials.bituachLeumi.monthlyPayment}>
              {financials.bituachLeumi.minimumBaseApplied
                ? 'מבוסס רק על הרווח שהוזן עד כה החודש (בלי חודשים קודמים, ובלי הכנסה שעוד לא נכנסה) — לכן נפל לבסיס המינימום החוקי. יתעדכן אוטומטית ברגע שתזיני את ההכנסה של החודש.'
                : 'לפי הרווח החייב בפועל החודש (רק החודש הזה, לא מצטבר).'}
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
            <p>
              על בסיס הכנסות בסך <span dir="ltr">{currency.format(financials.taxableProfit)}</span> יש להפקיד
              מינימום <span dir="ltr">{currency.format(financials.pension.mandatoryMonthlyDeposit)}</span> בפנסיה.
            </p>
            <p className="mt-1">
              על בסיס הכנסות החודש, עליך להפקיד{' '}
              <span dir="ltr">{currency.format(financials.pension.actualMonthlyDeposit)}</span> לקרן פנסיה (
              {profile.pensionGoals.pensionTargetPercent}% שמוגדר בפרופיל) ו-
              <span dir="ltr">{currency.format(financials.pension.actualStudyFundDeposit)}</span> לקרן השתלמות (
              {profile.pensionGoals.studyFundTargetPercent}% שמוגדר בפרופיל).
            </p>
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

      {/* 3. נטו בבנק */}
      <section className="flex flex-col gap-3 rounded-brand-lg bg-beige-2 p-5">
        <div>
          <h2 className="font-heading text-lg font-bold text-ink">נטו בבנק</h2>
          <p className="mt-1 text-sm text-brown">צריך לקבוע מהו מודל המשיכה שלך החודש — תזוזי בין האפשרויות כדי לראות את ההשפעה.</p>
        </div>
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
