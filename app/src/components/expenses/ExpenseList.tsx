import type { Expense, ExpenseFrequency } from '../../types/expense'
import { EXPENSE_FREQUENCY_LABELS, monthlyEquivalent } from '../../types/expense'
import type { NewExpenseInput } from '../../hooks/useExpenses'
import { SelectInput } from '../form/inputs'
import { SourceToggle } from './SourceToggle'

const frequencyOptions = (Object.entries(EXPENSE_FREQUENCY_LABELS) as [ExpenseFrequency, string][]).map(
  ([value, label]) => ({ value, label }),
)

const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

interface ExpenseListProps {
  expenses: Expense[]
  onUpdate: (id: string, patch: Partial<NewExpenseInput>) => void
  onRemove: (id: string) => void
}

export function ExpenseList({ expenses, onUpdate, onRemove }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <p className="text-sm text-taupe">עדיין לא הוזנו הוצאות. הוסיפי הוצאה ראשונה למעלה.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex flex-col gap-3 rounded-brand-sm bg-beige p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate font-semibold text-ink">{expense.description}</span>
              {expense.category && (
                <span className="rounded-full bg-beige-2 px-2 py-0.5 text-xs text-brown">{expense.category}</span>
              )}
              {expense.importSource === 'morning' && (
                <span className="rounded-full bg-terra/15 px-2 py-0.5 text-xs font-medium text-terra-deep">
                  מיובא ממורנינג
                </span>
              )}
            </div>
            <span className="text-sm text-brown" dir="ltr">
              {currency.format(expense.amount)}
              {expense.frequency !== 'monthly' && (
                <span dir="rtl"> ({currency.format(monthlyEquivalent(expense))} לחודש)</span>
              )}
              <span className="mx-1 text-taupe">•</span>
              <span dir="rtl">
                {expense.source === 'business' ? `מע״מ מוכר: ${currency.format(expense.vatAmount)}` : 'פרטי — ללא מע״מ מוכר'}
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SelectInput
              aria-label={`תדירות — ${expense.description}`}
              options={frequencyOptions}
              value={expense.frequency}
              onChange={(e) => onUpdate(expense.id, { frequency: e.target.value as ExpenseFrequency })}
              className="w-auto"
            />
            <SourceToggle
              idPrefix={expense.id}
              value={expense.source}
              onChange={(source) => onUpdate(expense.id, { source })}
            />
            <button
              type="button"
              onClick={() => onRemove(expense.id)}
              className="rounded-brand-sm px-3 py-2 text-sm font-medium text-terra-deep hover:bg-beige-2"
              aria-label={`הסרת ${expense.description}`}
            >
              הסרה
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
