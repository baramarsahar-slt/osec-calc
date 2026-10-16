import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { readJSON, writeJSON } from '../utils/storage'
import { createDefaultProfile, type UserProfile } from '../types/profile'

const STORAGE_KEY = 'osec_calc_profile_v1'

/**
 * ממזג פרופיל שמור (שעשוי להיות חלקי, אם הסכמה התעדכנה מאז השמירה)
 * עם ברירת המחדל, כך ששדה חסר לא מפיל את האפליקציה.
 */
function mergeWithDefaults(saved: Partial<UserProfile> | null): UserProfile {
  const base = createDefaultProfile()
  if (!saved) return base

  return {
    ...base,
    ...saved,
    personal: { ...base.personal, ...saved.personal },
    revenueForecast: { ...base.revenueForecast, ...saved.revenueForecast },
    bituachLeumi: { ...base.bituachLeumi, ...saved.bituachLeumi },
    pensionGoals: { ...base.pensionGoals, ...saved.pensionGoals },
    safetyNet: { ...base.safetyNet, ...saved.safetyNet },
    salaryPreference: { ...base.salaryPreference, ...saved.salaryPreference },
  }
}

export interface UseUserProfileResult {
  profile: UserProfile
  /** עדכון חלקי — מקבל פונקציית updater כמו ב-setState, או אובייקט חלקי */
  updateProfile: (patch: Partial<UserProfile> | ((prev: UserProfile) => UserProfile)) => void
  /** עדכון נוח לתת-סעיף בודד בפרופיל (למשל personal, pensionGoals) */
  updateSection: <K extends keyof UserProfile>(
    section: K,
    patch: Partial<UserProfile[K]>,
  ) => void
  markOnboardingComplete: () => void
  resetProfile: () => void
  /** true לאחר שהטעינה הראשונית מ-localStorage הסתיימה (מונע הבהוב/דריסה) */
  isLoaded: boolean
}

/** המימוש בפועל של ניהול הפרופיל + ההתמדה ב-localStorage. נקרא פעם אחת, ב-Provider. */
function useUserProfileState(): UseUserProfileResult {
  // טעינה סינכרונית מ-localStorage כבר ב-initializer של useState (לא ב-useEffect).
  // חשוב: localStorage הוא API סינכרוני, ו-React 18/19 ב-StrictMode מריץ useEffect
  // פעמיים ב-dev — טעינה ב-effect יוצרת מרוץ שבו כתיבת ברירת המחדל "מנצחת" את
  // הטעינה האמיתית ומוחקת נתונים שמורים. initializer רץ פעם אחת בלבד, בלי הבעיה הזו.
  const [profile, setProfile] = useState<UserProfile>(() =>
    mergeWithDefaults(readJSON<UserProfile>(STORAGE_KEY)),
  )

  // שמירה אוטומטית בכל שינוי בפרופיל
  useEffect(() => {
    writeJSON(STORAGE_KEY, profile)
  }, [profile])

  const updateProfile = useCallback<UseUserProfileResult['updateProfile']>((patch) => {
    setProfile((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
      return { ...next, updatedAt: new Date().toISOString() }
    })
  }, [])

  const updateSection = useCallback<UseUserProfileResult['updateSection']>((section, patch) => {
    setProfile((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), ...patch },
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  const markOnboardingComplete = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      onboardingCompletedAt: prev.onboardingCompletedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  const resetProfile = useCallback(() => {
    setProfile(createDefaultProfile())
  }, [])

  // profile תמיד טעון סינכרונית מ-localStorage לפני הרנדר הראשון (ראו useState למעלה),
  // כך שאין יותר שלב-ביניים "לא טעון". השדה נשאר ב-API לתאימות קדימה.
  return { profile, updateProfile, updateSection, markOnboardingComplete, resetProfile, isLoaded: true }
}

const UserProfileContext = createContext<UseUserProfileResult | null>(null)

/** עוטף את כל האפליקציה; חובה כדי ש-useUserProfile יעבוד בכל עמוד. */
export function UserProfileProvider({ children }: { children: ReactNode }) {
  const value = useUserProfileState()
  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
}

/** ה-hook שבו משתמשים בכל קומפוננטה שצריכה לקרוא/לעדכן את פרופיל המשתמש. */
export function useUserProfile(): UseUserProfileResult {
  const ctx = useContext(UserProfileContext)
  if (!ctx) {
    throw new Error('useUserProfile חייב לפעול בתוך UserProfileProvider')
  }
  return ctx
}
