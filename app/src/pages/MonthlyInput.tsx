import { useMonthlyIncome } from '../hooks/useMonthlyIncome'
import { useExpenses } from '../hooks/useExpenses'
import FormSection from '../components/form/FormSection'
import Field from '../components/form/Field'
import { TextInput } from '../components/form/inputs'
import { ExpenseForm } from '../components/expenses/ExpenseForm'
import { ExpenseList } from '../components/expenses/ExpenseList'
import { ExpenseSummary } from '../components/expenses/ExpenseSummary'
import { MorningImport } from '../components/expenses/MorningImport'

const monthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('he-IL', { year: 'numeric', month: 'long' })
}

export default function MonthlyInput() {
  const { monthKey, grossIncome, setGrossIncome } = useMonthlyIncome()
  const {
    expenses,
    addExpense,
    addExpenses,
    updateExpense,
    removeExpense,
    totalMonthlyEquivalent,
    businessMonthlyEquivalent,
    privateLoanMonthlyEquivalent,
  } = useExpenses()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-terra">קלט חודשי</h1>
        <p className="mt-1 text-brown">חודש: {monthLabel(monthKey)}</p>
      </div>

      <FormSection step={1} title="הכנסה ברוטו" description="סך התקבולים שנכנסו לעסק בחודש זה.">
        <Field label="הכנסה ברוטו חודשית (₪)" htmlFor="gross-income">
          <TextInput
            id="gross-income"
            type="number"
            min={0}
            step="0.01"
            value={grossIncome || ''}
            onChange={(e) => setGrossIncome(Number(e.target.value))}
          />
        </Field>
      </FormSection>

      <FormSection
        step={2}
        title="ניהול הוצאות"
        description="כל הוצאה מסווגת לפי תדירות (להחלקת תזרים) ולפי מקור תשלום (עסקי/פרטי)."
      >
        <MorningImport onImport={addExpenses} />
        <ExpenseForm onAdd={addExpense} />
        <ExpenseSummary
          totalMonthlyEquivalent={totalMonthlyEquivalent}
          businessMonthlyEquivalent={businessMonthlyEquivalent}
          privateLoanMonthlyEquivalent={privateLoanMonthlyEquivalent}
        />
        <ExpenseList expenses={expenses} onUpdate={updateExpense} onRemove={removeExpense} />
      </FormSection>
    </div>
  )
}
