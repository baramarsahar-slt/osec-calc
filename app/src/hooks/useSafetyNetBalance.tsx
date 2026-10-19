import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { readJSON, writeJSON } from '../utils/storage'

const STORAGE_KEY = 'osec_calc_safety_net_balance_v1'

/**
 * יתרת כרית הביטחון משתנה מחודש לחודש, ולכן מתעדכנת כאן (בדשבורד), לא
 * בפרופיל: בכל חודש לבעלת העסק יש סכום אחר שבפועל יושב בפיקדון/בעו"ש.
 * היעד (כמה חודשי הוצאות) כן נשאר הגדרת פרופיל יציבה.
 *
 * "יתרה נוכחית" = הערך שהוזן לחודש הנוכחי אם קיים, אחרת החודש האחרון
 * שבו כן הוזן ערך (לא מתאפס סתם כי עוד לא עדכנו החודש), ובהיעדר הכל —
 * fallback לערך הישן שנשמר פעם בפרופיל (ראו migrateLegacyBalance).
 */
type BalanceByMonth = Record<string, number>

export interface UseSafetyNetBalanceResult {
  balanceByMonth: BalanceByMonth
  /** היתרה הרלוונטית לחודש נתון, כולל "גרירה קדימה" מהחודש האחרון שעודכן */
  getCurrentBalance: (monthKey: string) => number
  setBalanceForMonth: (monthKey: string, amount: number) => void
}

const SafetyNetBalanceContext = createContext<UseSafetyNetBalanceResult | null>(null)

function useSafetyNetBalanceState(): UseSafetyNetBalanceResult {
  const [balanceByMonth, setBalanceByMonth] = useState<BalanceByMonth>(
    () => readJSON<BalanceByMonth>(STORAGE_KEY) ?? {},
  )

  useEffect(() => {
    writeJSON(STORAGE_KEY, balanceByMonth)
  }, [balanceByMonth])

  const getCurrentBalance = useCallback(
    (monthKey: string) => {
      if (monthKey in balanceByMonth) return balanceByMonth[monthKey]
      // גרירה קדימה: החודש הכי קרוב מלפני monthKey שבו כן עודכנה יתרה
      const priorKeys = Object.keys(balanceByMonth)
        .filter((key) => key < monthKey)
        .sort()
      const lastPriorKey = priorKeys.at(-1)
      return lastPriorKey !== undefined ? balanceByMonth[lastPriorKey] : 0
    },
    [balanceByMonth],
  )

  const setBalanceForMonth = useCallback((monthKey: string, amount: number) => {
    setBalanceByMonth((prev) => ({ ...prev, [monthKey]: amount }))
  }, [])

  return { balanceByMonth, getCurrentBalance, setBalanceForMonth }
}

export function SafetyNetBalanceProvider({ children }: { children: ReactNode }) {
  const value = useSafetyNetBalanceState()
  return <SafetyNetBalanceContext.Provider value={value}>{children}</SafetyNetBalanceContext.Provider>
}

export function useSafetyNetBalance(): UseSafetyNetBalanceResult {
  const ctx = useContext(SafetyNetBalanceContext)
  if (!ctx) {
    throw new Error('useSafetyNetBalance חייב לפעול בתוך SafetyNetBalanceProvider')
  }
  return ctx
}
