import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { readJSON, writeJSON } from '../utils/storage'
import type { Expense, ExpenseFrequency, ExpenseImportSource, PaymentSource } from '../types/expense'
import { monthlyEquivalent, monthlyVatEquivalent } from '../types/expense'

const STORAGE_KEY = 'osec_calc_expenses_v1'

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

export interface UseExpensesResult {
  expenses: Expense[]
  addExpense: (input: NewExpenseInput) => void
  /** הוספת כמה הוצאות בבת אחת (ייבוא CSV) — עדכון state יחיד במקום אחד לכל שורה */
  addExpenses: (inputs: NewExpenseInput[]) => void
  updateExpense: (id: string, patch: Partial<NewExpenseInput>) => void
  removeExpense: (id: string) => void
  /** סך ההוצאות החודשי המוחלק (אחרי פריסת הוצאות תקופתיות) */
  totalMonthlyEquivalent: number
  /** מתוך הסך — רק מה ששולם מהחשבון העסקי */
  businessMonthlyEquivalent: number
  /** מתוך הסך — רק מה ששולם מהחשבון הפרטי = "הלוואת בעלים" שהעסק חייב להחזיר */
  privateLoanMonthlyEquivalent: number
  /** מתוך ההוצאות העסקיות — סך המע"מ המוכר לקיזוז (לשימוש מנוע המע"מ) */
  businessVatDeductibleMonthlyEquivalent: number
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

function useExpensesState(): UseExpensesResult {
  // טעינה סינכרונית ב-initializer — כמו ב-useUserProfile, כדי למנוע מרוץ מול
  // StrictMode שדורס נתונים שמורים (ראו ההערה המפורטת שם).
  const [expenses, setExpenses] = useState<Expense[]>(() => readJSON<Expense[]>(STORAGE_KEY) ?? [])

  useEffect(() => {
    writeJSON(STORAGE_KEY, expenses)
  }, [expenses])

  const addExpense = useCallback((input: NewExpenseInput) => {
    setExpenses((prev) => [...prev, buildExpense(input)])
  }, [])

  const addExpenses = useCallback((inputs: NewExpenseInput[]) => {
    if (inputs.length === 0) return
    setExpenses((prev) => [...prev, ...inputs.map(buildExpense)])
  }, [])

  const updateExpense = useCallback((id: string, patch: Partial<NewExpenseInput>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }, [])

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const totalMonthlyEquivalent = expenses.reduce((sum, e) => sum + monthlyEquivalent(e), 0)
  const businessExpenses = expenses.filter((e) => e.source === 'business')
  const businessMonthlyEquivalent = businessExpenses.reduce((sum, e) => sum + monthlyEquivalent(e), 0)
  const privateLoanMonthlyEquivalent = expenses
    .filter((e) => e.source === 'private')
    .reduce((sum, e) => sum + monthlyEquivalent(e), 0)
  const businessVatDeductibleMonthlyEquivalent = businessExpenses.reduce(
    (sum, e) => sum + monthlyVatEquivalent(e),
    0,
  )

  return {
    expenses,
    addExpense,
    addExpenses,
    updateExpense,
    removeExpense,
    totalMonthlyEquivalent,
    businessMonthlyEquivalent,
    privateLoanMonthlyEquivalent,
    businessVatDeductibleMonthlyEquivalent,
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
