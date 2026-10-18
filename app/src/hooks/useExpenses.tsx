import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { readJSON, writeJSON } from '../utils/storage'
import type { Expense, ExpenseFrequency, ExpenseImportSource, PaymentSource } from '../types/expense'
import { monthlyEquivalent, monthlyVatEquivalent } from '../types/expense'

const STORAGE_KEY = 'osec_calc_expenses_v2'

export interface NewExpenseInput {
  description: string
  amount: number
  frequency: ExpenseFrequency
  source: PaymentSource
  /** מע"מ מוכר לקיזוז, בש"ח. ברירת מחדל 0 (הזנה ידנית — אחוז הקיזוז לא ידוע) */
  vatAmount?: number
  category?: string | null
  importSource?: ExpenseImportSource
}

/**
 * שני סוגי סכומים, בכוונה, לשני צרכים שונים לגמרי:
 *  - "Actual" — הסכום המלא בפועל, בלי שום פריסה. זה מה שבאמת יצא/נכנס
 *    מהחשבון החודש, וזה מה שחייב להיכנס לכל חישוב מס/מע"מ/רווח/הלוואת
 *    בעלים. הוצאה שנתית של 6,000 ₪ ששולמה החודש מפחיתה 6,000 ₪ מהרווח
 *    החייב החודש — לא 500 ₪.
 *  - "Smoothed" — אותה הוצאה "מוחלקת" לפי תדירות (שנתי÷12, דו-חודשי÷2).
 *    זה *לא* נכנס לשום חישוב מס — הוא משמש אך ורק את "ההמלצה היציבה"
 *    בדשבורד (ה-stop "נטו ממוצע מומלץ" וכן יעד כרית הביטחון), כדי
 *    שהמלצת המשיכה החודשית לא תקפוץ פרא בגלל תשלום חד-פעמי גדול.
 */
export interface MonthlyExpenseTotals {
  /** סך כל ההוצאות בפועל (לא מוחלק) */
  totalActual: number
  /** מתוך הסך — רק מה ששולם מהחשבון העסקי, בפועל */
  businessActual: number
  /** מתוך הסך — רק מה ששולם מהחשבון הפרטי בפועל = "הלוואת בעלים" שהעסק חייב להחזיר */
  privateLoanActual: number
  /** מתוך ההוצאות העסקיות — סך המע"מ המוכר לקיזוז, בפועל (לשימוש מנוע המע"מ) */
  businessVatDeductibleActual: number
  /** הוצאות עסקיות "מוחלקות" — רק ליישור תנודתיות בהמלצת משיכה, לא לחישובי מס */
  businessSmoothed: number
  /** מע"מ תשומות "מוחלק" — לשימוש פנימי בלבד בסימולציית ה"ממוצע" */
  businessVatDeductibleSmoothed: number
}

type ExpensesByMonth = Record<string, Expense[]>

export interface UseExpensesResult {
  /** כל ההוצאות, לפי מפתח חודש ("2026-09") — כל חודש הוא דלי עצמאי משלו */
  expensesByMonth: ExpensesByMonth
  getExpensesForMonth: (monthKey: string) => Expense[]
  addExpense: (monthKey: string, input: NewExpenseInput) => void
  /** הוספת כמה הוצאות בבת אחת לאותו חודש (ייבוא CSV) */
  addExpenses: (monthKey: string, inputs: NewExpenseInput[]) => void
  updateExpense: (monthKey: string, id: string, patch: Partial<NewExpenseInput>) => void
  removeExpense: (monthKey: string, id: string) => void
  getMonthlyTotals: (monthKey: string) => MonthlyExpenseTotals
}

const UserExpensesContext = createContext<UseExpensesResult | null>(null)

function buildExpense(input: NewExpenseInput): Expense {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    vatAmount: input.vatAmount ?? 0,
    category: input.category ?? null,
    importSource: input.importSource ?? 'manual',
    description: input.description,
    amount: input.amount,
    frequency: input.frequency,
    source: input.source,
  }
}

const EMPTY_EXPENSES: Expense[] = []

function computeTotals(expenses: Expense[]): MonthlyExpenseTotals {
  const businessExpenses = expenses.filter((e) => e.source === 'business')
  const privateExpenses = expenses.filter((e) => e.source === 'private')
  return {
    totalActual: expenses.reduce((sum, e) => sum + e.amount, 0),
    businessActual: businessExpenses.reduce((sum, e) => sum + e.amount, 0),
    privateLoanActual: privateExpenses.reduce((sum, e) => sum + e.amount, 0),
    businessVatDeductibleActual: businessExpenses.reduce((sum, e) => sum + e.vatAmount, 0),
    businessSmoothed: businessExpenses.reduce((sum, e) => sum + monthlyEquivalent(e), 0),
    businessVatDeductibleSmoothed: businessExpenses.reduce((sum, e) => sum + monthlyVatEquivalent(e), 0),
  }
}

function useExpensesState(): UseExpensesResult {
  // טעינה סינכרונית ב-initializer — ראו ההערה המפורטת ב-useUserProfile
  // לגבי הסיבה שזה קריטי (StrictMode מריץ effects פעמיים ויוצר מרוץ).
  const [expensesByMonth, setExpensesByMonth] = useState<ExpensesByMonth>(
    () => readJSON<ExpensesByMonth>(STORAGE_KEY) ?? {},
  )

  useEffect(() => {
    writeJSON(STORAGE_KEY, expensesByMonth)
  }, [expensesByMonth])

  const getExpensesForMonth = useCallback(
    (monthKey: string) => expensesByMonth[monthKey] ?? EMPTY_EXPENSES,
    [expensesByMonth],
  )

  const addExpense = useCallback((monthKey: string, input: NewExpenseInput) => {
    setExpensesByMonth((prev) => ({
      ...prev,
      [monthKey]: [...(prev[monthKey] ?? []), buildExpense(input)],
    }))
  }, [])

  const addExpenses = useCallback((monthKey: string, inputs: NewExpenseInput[]) => {
    if (inputs.length === 0) return
    setExpensesByMonth((prev) => ({
      ...prev,
      [monthKey]: [...(prev[monthKey] ?? []), ...inputs.map(buildExpense)],
    }))
  }, [])

  const updateExpense = useCallback((monthKey: string, id: string, patch: Partial<NewExpenseInput>) => {
    setExpensesByMonth((prev) => ({
      ...prev,
      [monthKey]: (prev[monthKey] ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }))
  }, [])

  const removeExpense = useCallback((monthKey: string, id: string) => {
    setExpensesByMonth((prev) => ({
      ...prev,
      [monthKey]: (prev[monthKey] ?? []).filter((e) => e.id !== id),
    }))
  }, [])

  const getMonthlyTotals = useCallback(
    (monthKey: string) => computeTotals(expensesByMonth[monthKey] ?? EMPTY_EXPENSES),
    [expensesByMonth],
  )

  return {
    expensesByMonth,
    getExpensesForMonth,
    addExpense,
    addExpenses,
    updateExpense,
    removeExpense,
    getMonthlyTotals,
  }
}

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const value = useExpensesState()
  return <UserExpensesContext.Provider value={value}>{children}</UserExpensesContext.Provider>
}

export function useExpenses(): UseExpensesResult {
  const ctx = useContext(UserExpensesContext)
  if (!ctx) {
    throw new Error('useExpenses חייב לפעול בתוך ExpensesProvider')
  }
  return ctx
}
