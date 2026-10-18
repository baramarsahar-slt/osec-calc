import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { readJSON, writeJSON } from '../utils/storage'

const STORAGE_KEY = 'osec_calc_monthly_income_v1'

/** מפתח חודש קלנדרי בפורמט יציב למיון/שמירה, למשל "2026-10". */
export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** מפתח החודש שלפני/אחרי מפתח נתון, בהפרש חודשים נתון (יכול להיות שלילי). */
export function addMonthsToKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return currentMonthKey(date)
}

type MonthlyIncomeMap = Record<string, number>

export interface UseMonthlyIncomeResult {
  /** כל ההכנסות שהוזנו, לפי מפתח חודש */
  incomeByMonth: MonthlyIncomeMap
  getIncomeForMonth: (monthKey: string) => number
  setIncomeForMonth: (monthKey: string, amount: number) => void
  /** מוחקת לגמרי את ההכנסה של חודש נתון (חוזר למצב "לא הוזן") */
  clearIncomeForMonth: (monthKey: string) => void
}

const MonthlyIncomeContext = createContext<UseMonthlyIncomeResult | null>(null)

function useMonthlyIncomeState(): UseMonthlyIncomeResult {
  const [incomeByMonth, setIncomeByMonth] = useState<MonthlyIncomeMap>(
    () => readJSON<MonthlyIncomeMap>(STORAGE_KEY) ?? {},
  )

  useEffect(() => {
    writeJSON(STORAGE_KEY, incomeByMonth)
  }, [incomeByMonth])

  const getIncomeForMonth = useCallback((monthKey: string) => incomeByMonth[monthKey] ?? 0, [incomeByMonth])

  const setIncomeForMonth = useCallback((monthKey: string, amount: number) => {
    setIncomeByMonth((prev) => ({ ...prev, [monthKey]: amount }))
  }, [])

  const clearIncomeForMonth = useCallback((monthKey: string) => {
    setIncomeByMonth((prev) => {
      const next = { ...prev }
      delete next[monthKey]
      return next
    })
  }, [])

  return { incomeByMonth, getIncomeForMonth, setIncomeForMonth, clearIncomeForMonth }
}

export function MonthlyIncomeProvider({ children }: { children: ReactNode }) {
  const value = useMonthlyIncomeState()
  return <MonthlyIncomeContext.Provider value={value}>{children}</MonthlyIncomeContext.Provider>
}

export function useMonthlyIncome(): UseMonthlyIncomeResult {
  const ctx = useContext(MonthlyIncomeContext)
  if (!ctx) {
    throw new Error('useMonthlyIncome חייב לפעול בתוך MonthlyIncomeProvider')
  }
  return ctx
}
