import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { readJSON, writeJSON } from '../utils/storage'

const STORAGE_KEY = 'osec_calc_monthly_income_v1'

/** מפתח חודש קלנדרי בפורמט יציב למיון/שמירה, למשל "2026-10". */
export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

type MonthlyIncomeMap = Record<string, number>

export interface UseMonthlyIncomeResult {
  monthKey: string
  /** ההכנסה ברוטו שהוזנה לחודש הנוכחי (0 אם טרם הוזנה) */
  grossIncome: number
  setGrossIncome: (amount: number) => void
  /**
   * כל ההכנסות שהוזנו אי-פעם, לפי מפתח חודש. משמש לחישוב "ממוצע היסטורי"
   * בדשבורד. שימו לב: זו רק היסטוריית הכנסה — אין עדיין ארכיון הוצאות
   * חודשי, כך שממוצע מבוסס-היסטוריה מניח את רשימת ההוצאות הנוכחית
   * כקירוב לכל החודשים (ראו הערה בדשבורד).
   */
  incomeHistory: MonthlyIncomeMap
}

const MonthlyIncomeContext = createContext<UseMonthlyIncomeResult | null>(null)

function useMonthlyIncomeState(): UseMonthlyIncomeResult {
  const monthKey = currentMonthKey()
  const [incomeMap, setIncomeMap] = useState<MonthlyIncomeMap>(
    () => readJSON<MonthlyIncomeMap>(STORAGE_KEY) ?? {},
  )

  useEffect(() => {
    writeJSON(STORAGE_KEY, incomeMap)
  }, [incomeMap])

  const setGrossIncome = useCallback(
    (amount: number) => {
      setIncomeMap((prev) => ({ ...prev, [monthKey]: amount }))
    },
    [monthKey],
  )

  return { monthKey, grossIncome: incomeMap[monthKey] ?? 0, setGrossIncome, incomeHistory: incomeMap }
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
