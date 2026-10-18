import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { readJSON, writeJSON } from '../utils/storage'

const STORAGE_KEY = 'osec_calc_vat_reporting_log_v1'

/**
 * רישום "דווח ושולם" לכל תקופת דיווח מע"מ (לפי מפתח החודש הזוגי/הדיווח,
 * למשל "2026-10"). זהו **רק רישום סטטוס** — לא מוחק ולא משנה שום נתון
 * הכנסה/הוצאה. המנוע עצמו כבר "מתאפס" מעצמו כל חודשיים (כל חודש דיווח
 * מסתכל רק על עצמו + החודש שלפניו, אף פעם לא רחוק יותר) — הרישום הזה
 * הוא רק checklist היסטורי שנשאר לצמיתות, לפי בקשת המשתמשת.
 */
type VatReportingLog = Record<string, string> // reportingMonthKey -> ISO timestamp

export interface UseVatReportingLogResult {
  reportingLog: VatReportingLog
  isReported: (reportingMonthKey: string) => boolean
  getReportedAt: (reportingMonthKey: string) => string | null
  markReported: (reportingMonthKey: string) => void
  unmarkReported: (reportingMonthKey: string) => void
}

const VatReportingLogContext = createContext<UseVatReportingLogResult | null>(null)

function useVatReportingLogState(): UseVatReportingLogResult {
  const [reportingLog, setReportingLog] = useState<VatReportingLog>(
    () => readJSON<VatReportingLog>(STORAGE_KEY) ?? {},
  )

  useEffect(() => {
    writeJSON(STORAGE_KEY, reportingLog)
  }, [reportingLog])

  const isReported = useCallback(
    (reportingMonthKey: string) => reportingMonthKey in reportingLog,
    [reportingLog],
  )

  const getReportedAt = useCallback(
    (reportingMonthKey: string) => reportingLog[reportingMonthKey] ?? null,
    [reportingLog],
  )

  const markReported = useCallback((reportingMonthKey: string) => {
    setReportingLog((prev) => ({ ...prev, [reportingMonthKey]: new Date().toISOString() }))
  }, [])

  const unmarkReported = useCallback((reportingMonthKey: string) => {
    setReportingLog((prev) => {
      const next = { ...prev }
      delete next[reportingMonthKey]
      return next
    })
  }, [])

  return { reportingLog, isReported, getReportedAt, markReported, unmarkReported }
}

export function VatReportingLogProvider({ children }: { children: ReactNode }) {
  const value = useVatReportingLogState()
  return <VatReportingLogContext.Provider value={value}>{children}</VatReportingLogContext.Provider>
}

export function useVatReportingLog(): UseVatReportingLogResult {
  const ctx = useContext(VatReportingLogContext)
  if (!ctx) {
    throw new Error('useVatReportingLog חייב לפעול בתוך VatReportingLogProvider')
  }
  return ctx
}
