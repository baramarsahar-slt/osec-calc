import { useState } from 'react'
import { currentMonthKey, useMonthlyIncome } from '../hooks/useMonthlyIncome'
import { useExpenses } from '../hooks/useExpenses'
import { useUserProfile } from '../hooks/useUserProfile'
import { getSelectableMonths } from '../utils/monthOptions'
import FormSection from '../components/form/FormSection'
import Field from '../components/form/Field'
import { SelectInput, TextInput } from '../components/form/inputs'
import { ExpenseForm } from '../components/expenses/ExpenseForm'
import { ExpenseList } from '../components/expenses/ExpenseList'
import { ExpenseSummary } from '../components/expenses/ExpenseSummary'
import { MorningImport } from '../components/expenses/MorningImport'

export default function MonthlyInput() {
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => currentMonthKey())
  const monthOptions = getSelectableMonths()

  const { profile } = useUserProfile()
  const { getIncomeForMonth, setIncomeForMonth } = useMonthlyIncome()
  const { getExpensesForMonth, addExpense, addExpenses, updateExpense, removeExpense, getMonthlyTotals } =
    useExpenses()

  const grossIncome = getIncomeForMonth(selectedMonthKey)
  const expenses = getExpensesForMonth(selectedMonthKey)
  const totals = getMonthlyTotals(selectedMonthKey)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-terra">החודש שלי</h1>
        <p className="mt-1 text-brown">
          כל הנתונים נשמרים לפי חודש — אפשר לחזור ולמלא/לתקן חודשים קודמים בכל עת. ככל שיש יותר
          היסטוריה, הדשבורד מדויק יותר (למשל לחישוב ממוצע ולדיווח מע"מ דו-חודשי).
        </p>
        <div className="mt-3 max-w-xs">
          <Field label="בחירת חודש" htmlFor="month-select">
            <SelectInput
              id="month-select"
              options={monthOptions.map((m) => ({ value: m.key, label: m.label }))}
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <FormSection step={1} title="הכנסה ברוטו" description="סך התקבולים שנכנסו לעסק בחודש זה.">
        <Field
          label="הכנסה ברוטו חודשית (₪)"
          htmlFor="gross-income"
          hint={
            profile.businessStatus === 'exempt'
              ? 'הסכום הכולל שנכנס בפועל לחשבון העסק החודש (אצל עוסק פטור אין מע״מ בכלל, אז זה פשוט כל הסכום).'
              : 'הסכום הכולל שנכנס בפועל לחשבון העסק החודש — כולל מע״מ שגבית מלקוחות. אין צורך להוריד את המע״מ בעצמך, המערכת עושה את זה.'
          }
        >
          <TextInput
            id="gross-income"
            type="number"
            min={0}
            step="0.01"
            value={grossIncome || ''}
            onChange={(e) => setIncomeForMonth(selectedMonthKey, Number(e.target.value))}
          />
        </Field>
      </FormSection>

      <FormSection
        step={2}
        title="ניהול הוצאות"
        description='כל הוצאה מסווגת לפי מקור תשלום (עסקי/פרטי). התדירות (חודשי/שנתי/דו-חודשי) לא משפיעה על הסכומים כאן — הסכום המלא תמיד נספר במלואו בחודש שבו שולם. היא משפיעה רק על "נטו ממוצע מומלץ" ועל יעד כרית הביטחון בדשבורד, כדי שתשלום גדול וחד-פעמי לא יעוות את המלצת המשיכה היציבה.'
      >
        <MorningImport onImport={(inputs) => addExpenses(selectedMonthKey, inputs)} />
        <ExpenseForm onAdd={(input) => addExpense(selectedMonthKey, input)} />
        <ExpenseList
          expenses={expenses}
          onUpdate={(id, patch) => updateExpense(selectedMonthKey, id, patch)}
          onRemove={(id) => removeExpense(selectedMonthKey, id)}
        />
        <ExpenseSummary
          totalActual={totals.totalActual}
          businessActual={totals.businessActual}
          privateLoanActual={totals.privateLoanActual}
        />
      </FormSection>
    </div>
  )
}
