import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ExpenseFrequency, PaymentSource } from '../../types/expense'
import { EXPENSE_FREQUENCY_LABELS } from '../../types/expense'
import type { NewExpenseInput } from '../../hooks/useExpenses'
import Field from '../form/Field'
import { SelectInput, TextInput } from '../form/inputs'
import { SourceToggle } from './SourceToggle'

const frequencyOptions = (Object.entries(EXPENSE_FREQUENCY_LABELS) as [ExpenseFrequency, string][]).map(
  ([value, label]) => ({ value, label }),
)

interface ExpenseFormProps {
  onAdd: (input: NewExpenseInput) => void
}

const emptyDraft = { description: '', amount: '', frequency: 'monthly' as ExpenseFrequency, source: 'business' as PaymentSource }

/** טופס הוספת הוצאה ידנית אחת. לא כולל ייבוא קובץ — זה יתווסף בשלב נפרד. */
export function ExpenseForm({ onAdd }: ExpenseFormProps) {
  const [draft, setDraft] = useState(emptyDraft)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const amount = Number(draft.amount)
    if (!draft.description.trim()) {
      setError('יש להזין שם/תיאור להוצאה')
      return
    }
    if (!draft.amount || Number.isNaN(amount) || amount <= 0) {
      setError('יש להזין סכום חיובי')
      return
    }
    onAdd({
      description: draft.description.trim(),
      amount,
      frequency: draft.frequency,
      source: draft.source,
    })
    setDraft(emptyDraft)
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-brand-md bg-beige p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="תיאור ההוצאה" htmlFor="expense-description">
          <TextInput
            id="expense-description"
            placeholder='למשל: שכירות, "מורנינג", ארנונה'
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </Field>
        <Field label="סכום ששולם בפועל (₪)" htmlFor="expense-amount">
          <TextInput
            id="expense-amount"
            type="number"
            min={0}
            step="0.01"
            value={draft.amount}
            onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="תדירות" htmlFor="expense-frequency">
          <SelectInput
            id="expense-frequency"
            options={frequencyOptions}
            value={draft.frequency}
            onChange={(e) => setDraft((d) => ({ ...d, frequency: e.target.value as ExpenseFrequency }))}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-brown">מקור תשלום</span>
          <SourceToggle
            idPrefix="new-expense"
            value={draft.source}
            onChange={(source) => setDraft((d) => ({ ...d, source }))}
          />
        </div>

        <button
          type="submit"
          className="mr-auto rounded-brand-md bg-terra-deep px-5 py-2.5 font-semibold text-white hover:opacity-90"
        >
          + הוספת הוצאה
        </button>
      </div>

      {error && <p className="text-sm font-medium text-terra-deep">{error}</p>}
    </form>
  )
}
