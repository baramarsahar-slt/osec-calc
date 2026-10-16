/**
 * מודל הנתונים של "פרופיל המשתמש" — תוצר שאלון ההקמה (ראו spec.md, סעיף 3).
 * כל שדה כאן הוא קלט בלבד (מה שהמשתמשת הצהירה עליו). חישובי מס/ביטוח לאומי/פנסיה
 * בפועל נעשים בשלב מאוחר יותר (מנוע החישוב), לא כאן.
 */

/** 1. סטטוס עסקי */
export type BusinessStatus = 'exempt' | 'licensed' | 'micro'
// exempt  = עוסק פטור
// licensed = עוסק מורשה
// micro   = בעל עסק זעיר

/** 2. מצב אישי ונקודות זיכוי */
export type Gender = 'female' | 'male'

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'single_parent'

/** ילד/ה — לצורך חישוב נקודות זיכוי לפי גיל בשנת המס */
export interface Child {
  id: string
  birthYear: number
}

export interface PersonalInfo {
  gender: Gender
  maritalStatus: MaritalStatus
  birthYear: number
  isIsraeliResident: boolean
  children: Child[]
  /** מגורים ביישוב מזכה (תושבות המזכה בזיכוי אזורי) */
  livesInEligibleSettlement: boolean
  isNewImmigrant: boolean
  immigrationYear: number | null
  hasDisability: boolean
  /** ימי מילואים כלוחם/ת בשנה הקודמת לשנת המס — רלוונטי לנקודות זיכוי מילואים */
  reserveDutyDaysPriorYear: number
  /** זכאות זמנית לבוגרי תואר אקדמי/תעודה מקצועית — תלוית שנת סיום */
  isRecentGraduate: boolean
  graduationYear: number | null
  /**
   * סה"כ נקודות זיכוי, אם כבר נבדק במחשבון הרשמי של רשות המסים או מול רו"ח —
   * כשמוגדר, דורס לגמרי את החישוב האוטומטי (תושבות + ילדים) שבקובץ incomeTax.ts.
   * זה נמנע ממצב שבו המשתמשת צריכה לחשב בעצמה "דלתא" בין החישוב האוטומטי
   * לתוצאה המלאה מהמחשבון הרשמי — היא פשוט מזינה את המספר הסופי.
   */
  creditPointsOverride: number | null
}

/** 3. הכנסות — נקודת פתיחה בלבד (לא תחליף להזנה חודשית אמיתית ב"קלט חודשי") */
export type RevenueTrend = 'same' | 'increase' | 'decrease'

export interface RevenueForecast {
  /**
   * הכנסה חודשית ממוצעת ידועה (לא כולל הוצאות, לא כולל מע"מ) — מתוך נתונים
   * שכבר יש למשתמשת (למשל סגירת שנה קודמת, או כמה חודשים אחרונים שנסגרו
   * במערכת הנהלת החשבונות). לא ניחוש — מספר שכבר קיים.
   */
  knownAverageMonthlyRevenue: number | null
  /** צפי כיוון קדימה ביחס לממוצע הידוע */
  revenueTrend: RevenueTrend
  /** באחוזים, רלוונטי רק כש-revenueTrend הוא increase/decrease */
  revenueTrendPercent: number
  /**
   * אחוז המקדמה שנקבע בפועל בתיק ברשות המסים (אם כבר ידוע). זהו האחוז הרשמי,
   * הנקבע מנהלית לפי שומת עבר/ענף — לא ניתן לחשב אותו באופן מדויק מהמדרגות בלבד.
   * אם לא הוזן, מנוע החישוב מציג הערכה בלבד (מסומנת ככזו) לפי רווח צפוי.
   */
  assignedAdvanceRatePercent: number | null
}

/** 4. מעמד בביטוח לאומי */
export interface BituachLeumiStatus {
  /** עומדת בהגדרת "עצמאי" לפי חוק ביטוח לאומי (שעות/הכנסה) */
  meetsSelfEmployedDefinition: boolean
  /** האם יש גם הכנסה כשכירה, המחייבת תיאום דמי ביטוח */
  hasEmployeeIncome: boolean
  employeeMonthlyGrossIncome: number | null
}

/** 5. יעדי פנסיה וחיסכון */
export interface PensionGoals {
  /** אחוז יעד להפקדה פנסיונית, מעבר למינימום החוקי (4.45%/12.55%) */
  pensionTargetPercent: number
  /** סכום הפקדה חודשי קבוע, אם הוגדר ידנית (גובר על האחוז) */
  monthlyPensionAmount: number | null
  monthlyStudyFundAmount: number | null
}

/** 6. אסטרטגיית מקדמות (סיכון) */
export type AdvanceStrategy = 'precise' | 'conservative' | 'aggressive'
// precise      = חישוב מדויק (שאיפה לאפס הפרשים)
// conservative = זהיר/שמרני (תשלום יתר)
// aggressive   = אגרסיבי (תשלום בחסר, נזילות)

/** 7. כרית ביטחון עסקית */
export interface SafetyNetGoals {
  /** יעד בחודשי הוצאות (ברירת מחדל 3, טווח מקובל 2–6) */
  targetMonthsOfExpenses: number
  currentBalance: number
}

/** 8. העדפת משיכת שכר */
export type SalaryDrawModel = 'fixed' | 'performance'
// fixed       = סכום אחיד קבוע מדי חודש, עודפים נשמרים בכרית
// performance = משיכת מלוא הנטו הזמין מדי חודש

export interface SalaryPreference {
  drawModel: SalaryDrawModel
  /** רלוונטי רק כש-drawModel === 'fixed' */
  fixedMonthlyAmount: number | null
}

/** הפרופיל המלא, כפי שהוא נשמר ב-localStorage */
export interface UserProfile {
  schemaVersion: 1
  onboardingCompletedAt: string | null
  updatedAt: string

  businessStatus: BusinessStatus
  personal: PersonalInfo
  revenueForecast: RevenueForecast
  bituachLeumi: BituachLeumiStatus
  pensionGoals: PensionGoals
  advanceStrategy: AdvanceStrategy
  safetyNet: SafetyNetGoals
  salaryPreference: SalaryPreference
}

export const createDefaultProfile = (): UserProfile => ({
  schemaVersion: 1,
  onboardingCompletedAt: null,
  updatedAt: new Date().toISOString(),

  businessStatus: 'exempt',

  personal: {
    gender: 'female',
    maritalStatus: 'single',
    birthYear: 1990,
    isIsraeliResident: true,
    children: [],
    livesInEligibleSettlement: false,
    isNewImmigrant: false,
    immigrationYear: null,
    hasDisability: false,
    reserveDutyDaysPriorYear: 0,
    isRecentGraduate: false,
    graduationYear: null,
    creditPointsOverride: null,
  },

  revenueForecast: {
    knownAverageMonthlyRevenue: null,
    revenueTrend: 'same',
    revenueTrendPercent: 0,
    assignedAdvanceRatePercent: null,
  },

  bituachLeumi: {
    meetsSelfEmployedDefinition: true,
    hasEmployeeIncome: false,
    employeeMonthlyGrossIncome: null,
  },

  pensionGoals: {
    pensionTargetPercent: 12.55,
    monthlyPensionAmount: null,
    monthlyStudyFundAmount: null,
  },

  advanceStrategy: 'conservative',

  safetyNet: {
    targetMonthsOfExpenses: 3,
    currentBalance: 0,
  },

  salaryPreference: {
    drawModel: 'performance',
    fixedMonthlyAmount: null,
  },
})
