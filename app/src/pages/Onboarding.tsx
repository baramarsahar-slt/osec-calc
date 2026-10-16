import { useUserProfile } from '../hooks/useUserProfile'
import type {
  AdvanceStrategy,
  BusinessStatus,
  Gender,
  MaritalStatus,
  RevenueTrend,
  SalaryDrawModel,
} from '../types/profile'
import FormSection from '../components/form/FormSection'
import Field from '../components/form/Field'
import { CheckboxRow, RadioCards, SelectInput, TextInput } from '../components/form/inputs'
import { ChildrenEditor } from '../components/form/ChildrenEditor'
import InfoNote from '../components/form/InfoNote'
import { CreditPointsSummary } from '../components/form/CreditPointsSummary'

const businessStatusOptions: { value: BusinessStatus; label: string; description: string }[] = [
  { value: 'exempt', label: 'עוסק פטור', description: 'ללא חיוב במע״מ' },
  { value: 'licensed', label: 'עוסק מורשה', description: 'גביית מע״מ ודיווח' },
  { value: 'micro', label: 'עסק זעיר', description: 'מסלול שומה מקוצר' },
]

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'female', label: 'אישה' },
  { value: 'male', label: 'גבר' },
]

const maritalStatusOptions: { value: MaritalStatus; label: string }[] = [
  { value: 'single', label: 'רווק/ה' },
  { value: 'married', label: 'נשוי/אה' },
  { value: 'divorced', label: 'גרוש/ה' },
  { value: 'widowed', label: 'אלמן/ה' },
  { value: 'single_parent', label: 'הורה עצמאי/ת' },
]

const revenueTrendOptions: { value: RevenueTrend; label: string }[] = [
  { value: 'same', label: 'דומה' },
  { value: 'increase', label: 'עולה' },
  { value: 'decrease', label: 'יורד' },
]

const advanceStrategyOptions: { value: AdvanceStrategy; label: string; description: string }[] = [
  { value: 'precise', label: 'מדויק', description: 'שאיפה לאפס הפרשים' },
  { value: 'conservative', label: 'שמרני', description: 'תשלום יתר, החזר בסוף שנה' },
  { value: 'aggressive', label: 'אגרסיבי', description: 'תשלום בחסר, נזילות גבוהה יותר' },
]

const salaryDrawModelOptions: { value: SalaryDrawModel; label: string; description: string }[] = [
  { value: 'fixed', label: 'מודל קבוע', description: 'סכום אחיד כל חודש, עודפים לכרית' },
  { value: 'performance', label: 'מודל ביצועים', description: 'משיכת מלוא הנטו הזמין' },
]

export default function Onboarding() {
  const { profile, updateProfile, updateSection, markOnboardingComplete, isLoaded } = useUserProfile()

  if (!isLoaded) {
    return <p className="text-brown">טוען פרופיל…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-terra">קליטה והקמת פרופיל</h1>
        <p className="mt-1 text-brown">
          השאלון הזה הוא "טופס 101 מורחב" — הנתונים כאן קובעים איך המערכת מחשבת עבורך מס,
          ביטוח לאומי, פנסיה ומשכורת מומלצת. אפשר לחזור ולעדכן בכל שלב.
        </p>
        {profile.onboardingCompletedAt && (
          <p className="mt-2 text-sm text-taupe">
            הושלם לראשונה בתאריך {new Date(profile.onboardingCompletedAt).toLocaleDateString('he-IL')}
          </p>
        )}
      </div>

      {/* 1. סטטוס עסקי */}
      <FormSection step={1} title="סטטוס עסקי" description="משפיע על חובת דיווח מע״מ ועל חישוב מס הכנסה.">
        <RadioCards
          name="businessStatus"
          value={profile.businessStatus}
          onChange={(v) => updateProfile({ businessStatus: v })}
          options={businessStatusOptions}
        />
        <InfoNote>
          לא בטוחה מה ההבדל בפועל? כדאי לבדוק את המשמעות של כל מעמד לפני שבוחרים — זה קובע אם גובים
          מע״מ מלקוחות, איך מדווחים, ואיך מחושב מס ההכנסה.
        </InfoNote>
      </FormSection>

      {/* 2. מצב אישי ונקודות זיכוי */}
      <FormSection step={2} title="מצב אישי ונקודות זיכוי" description="קובע את נקודות הזיכוי ממס ההכנסה.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="מגדר"
            htmlFor="gender"
            hint="כפי שרשום במרשם לצורכי מס — לא זהות מגדרית"
          >
            <SelectInput
              id="gender"
              options={genderOptions}
              value={profile.personal.gender}
              onChange={(e) => updateSection('personal', { gender: e.target.value as Gender })}
            />
          </Field>
          <Field label="מצב משפחתי" htmlFor="maritalStatus">
            <SelectInput
              id="maritalStatus"
              options={maritalStatusOptions}
              value={profile.personal.maritalStatus}
              onChange={(e) =>
                updateSection('personal', { maritalStatus: e.target.value as MaritalStatus })
              }
            />
          </Field>
          <Field
            label="שנת לידה"
            htmlFor="birthYear"
            hint="רלוונטי מגיל הפרישה — 67 לגברים; לנשים תלוי בשנת הלידה, עולה בהדרגה עד 65 לילידות 1970+ — ומשפיע על אחוזי הביטוח הלאומי"
          >
            <TextInput
              id="birthYear"
              type="number"
              value={profile.personal.birthYear}
              onChange={(e) => updateSection('personal', { birthYear: Number(e.target.value) })}
            />
          </Field>
          <Field label="ימי מילואים כלוחם/ת בשנה שעברה" htmlFor="reserveDutyDays">
            <TextInput
              id="reserveDutyDays"
              type="number"
              min={0}
              value={profile.personal.reserveDutyDaysPriorYear}
              onChange={(e) =>
                updateSection('personal', { reserveDutyDaysPriorYear: Number(e.target.value) })
              }
            />
          </Field>
        </div>

        <Field label="ילדים" htmlFor="children">
          <ChildrenEditor
            children={profile.personal.children}
            onChange={(children) => updateSection('personal', { children })}
          />
        </Field>

        <div className="flex flex-col gap-2">
          <CheckboxRow
            id="isIsraeliResident"
            checked={profile.personal.isIsraeliResident}
            onChange={(v) => updateSection('personal', { isIsraeliResident: v })}
          >
            תושבת/תושב ישראל
          </CheckboxRow>
          <CheckboxRow
            id="livesInEligibleSettlement"
            checked={profile.personal.livesInEligibleSettlement}
            onChange={(v) => updateSection('personal', { livesInEligibleSettlement: v })}
          >
            מגורים ביישוב המזכה בזיכוי מס אזורי
          </CheckboxRow>
          {profile.personal.livesInEligibleSettlement && (
            <InfoNote>
              אין לנו רשימת יישובים מעודכנת — רשות המסים מפרסמת ומעדכנת אותה. אפשר לחפש "יישובים
              מזכים במס הכנסה" באתר gov.il, או לבדוק מול המועצה המקומית/רו"ח אם היישוב שלך ברשימה
              לשנה הנוכחית.
            </InfoNote>
          )}
          <CheckboxRow
            id="hasDisability"
            checked={profile.personal.hasDisability}
            onChange={(v) => updateSection('personal', { hasDisability: v })}
          >
            זכאות לזיכוי/פטור בגין נכות (שלי או של ילד/ה)
          </CheckboxRow>

          <CheckboxRow
            id="isNewImmigrant"
            checked={profile.personal.isNewImmigrant}
            onChange={(v) =>
              updateSection('personal', {
                isNewImmigrant: v,
                immigrationYear: v ? profile.personal.immigrationYear : null,
              })
            }
          >
            עולה חדש/ה
          </CheckboxRow>
          {profile.personal.isNewImmigrant && (
            <Field label="שנת עלייה" htmlFor="immigrationYear">
              <TextInput
                id="immigrationYear"
                type="number"
                value={profile.personal.immigrationYear ?? ''}
                onChange={(e) =>
                  updateSection('personal', { immigrationYear: Number(e.target.value) })
                }
              />
            </Field>
          )}

          <CheckboxRow
            id="isRecentGraduate"
            checked={profile.personal.isRecentGraduate}
            onChange={(v) =>
              updateSection('personal', {
                isRecentGraduate: v,
                graduationYear: v ? profile.personal.graduationYear : null,
              })
            }
          >
            בוגר/ת תואר אקדמי/תעודה מקצועית (זכאות זמנית לנקודות זיכוי)
          </CheckboxRow>
          {profile.personal.isRecentGraduate && (
            <>
              <Field label="שנת סיום הלימודים" htmlFor="graduationYear">
                <TextInput
                  id="graduationYear"
                  type="number"
                  value={profile.personal.graduationYear ?? ''}
                  onChange={(e) =>
                    updateSection('personal', { graduationYear: Number(e.target.value) })
                  }
                />
              </Field>
              <InfoNote>
                אין לנו מידע מאומת על משך הזכאות (כמה שנים), האם זה חל רק על תואר ראשון, ואיך זה
                מתייחס לתואר שני/שלישי אחרי שכבר נוצלה הזכאות על תואר קודם. חשוב לשאול את זה
                במפורש את רו"ח/יועץ המס.
              </InfoNote>
            </>
          )}
        </div>

        <CreditPointsSummary personal={profile.personal} onUpdate={(patch) => updateSection('personal', patch)} />
      </FormSection>

      {/* 3. הכנסות — נקודת פתיחה בלבד */}
      <FormSection
        step={3}
        title="הכנסות"
        description="נקודת פתיחה בלבד — ברגע שמזינים נתונים אמיתיים בעמוד 'קלט חודשי', המערכת משתמשת בהם, לא בהערכה כאן."
      >
        <Field
          label="הכנסה חודשית ממוצעת ידועה (₪, לא כולל הוצאות ולא כולל מע״מ)"
          htmlFor="knownAverageRevenue"
          hint='לא ניחוש — מספר שכבר יש לך: מתוך סגירת שנה קודמת, או כמה חודשים אחרונים שכבר "סגרת" במערכת הנהלת החשבונות (לדוגמה Morning). אם יש לך כמה חודשים, אפשר לחשב ממוצע ולהזין אותו כאן. אפשר להשאיר ריק אם עוד אין נתונים.'
        >
          <TextInput
            id="knownAverageRevenue"
            type="number"
            min={0}
            value={profile.revenueForecast.knownAverageMonthlyRevenue ?? ''}
            onChange={(e) =>
              updateSection('revenueForecast', {
                knownAverageMonthlyRevenue: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </Field>

        {profile.revenueForecast.knownAverageMonthlyRevenue !== null && (
          <div className="flex flex-col gap-3">
            <Field label="הצפי קדימה, ביחס לממוצע שהזנת" htmlFor="revenueTrend">
              <RadioCards
                name="revenueTrend"
                value={profile.revenueForecast.revenueTrend}
                onChange={(v) => updateSection('revenueForecast', { revenueTrend: v })}
                options={revenueTrendOptions}
              />
            </Field>
            {profile.revenueForecast.revenueTrend !== 'same' && (
              <Field label="בכמה אחוזים בערך?" htmlFor="revenueTrendPercent">
                <TextInput
                  id="revenueTrendPercent"
                  type="number"
                  min={0}
                  max={100}
                  value={profile.revenueForecast.revenueTrendPercent}
                  onChange={(e) =>
                    updateSection('revenueForecast', { revenueTrendPercent: Number(e.target.value) })
                  }
                />
              </Field>
            )}
          </div>
        )}

        <Field
          label='אחוז מקדמה שנקבע בתיק ברשות המסים (%, אם ידוע)'
          htmlFor="assignedAdvanceRate"
          hint='זהו האחוז הרשמי שנקבע מנהלית לתיק שלך. ללא ערך כאן, המערכת תציג הערכה בלבד (מסומנת ככזו).'
        >
          <TextInput
            id="assignedAdvanceRate"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={profile.revenueForecast.assignedAdvanceRatePercent ?? ''}
            onChange={(e) =>
              updateSection('revenueForecast', {
                assignedAdvanceRatePercent: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </Field>
      </FormSection>

      {/* 4. מעמד בביטוח לאומי */}
      <FormSection step={4} title="מעמד בביטוח לאומי">
        <InfoNote>
          <p className="font-semibold text-ink">ב-2026, מספיק לעמוד באחת משלוש האפשרויות:</p>
          <ul className="mt-1 list-inside list-disc">
            <li>לפחות 20 שעות עבודה בשבוע בממוצע, או</li>
            <li>הכנסה חודשית ממוצעת ממשלח היד של לפחות 6,885 ₪, או</li>
            <li>לפחות 12 שעות שבוע בממוצע + הכנסה חודשית ממוצעת של לפחות 2,065 ₪.</li>
          </ul>
          <p className="mt-2">
            מי שלא עומדת באף אחת מהחלופות מסווגת כ"עצמאית שאינה עונה להגדרה" — ההכנסה מטופלת כהכנסה
            שלא מעבודה, וזה עלול לפגוע בזכאות להטבות מחליפות הכנסה כמו דמי לידה. לא בטוחה? כדאי לבדוק את
            המשמעות של כל מעמד לפני שבוחרים.
          </p>
        </InfoNote>
        <CheckboxRow
          id="meetsSelfEmployedDefinition"
          checked={profile.bituachLeumi.meetsSelfEmployedDefinition}
          onChange={(v) => updateSection('bituachLeumi', { meetsSelfEmployedDefinition: v })}
        >
          עומדת/ת בהגדרת "עצמאי" לפי חוק ביטוח לאומי (אחת משלוש החלופות למעלה)
        </CheckboxRow>
        <CheckboxRow
          id="hasEmployeeIncome"
          checked={profile.bituachLeumi.hasEmployeeIncome}
          onChange={(v) =>
            updateSection('bituachLeumi', {
              hasEmployeeIncome: v,
              employeeMonthlyGrossIncome: v ? profile.bituachLeumi.employeeMonthlyGrossIncome : null,
            })
          }
        >
          יש לי גם הכנסה כשכיר/ה (נדרש תיאום דמי ביטוח)
        </CheckboxRow>
        {profile.bituachLeumi.hasEmployeeIncome && (
          <>
            <Field label="שכר ברוטו חודשי כשכיר/ה (₪)" htmlFor="employeeIncome">
              <TextInput
                id="employeeIncome"
                type="number"
                min={0}
                value={profile.bituachLeumi.employeeMonthlyGrossIncome ?? ''}
                onChange={(e) =>
                  updateSection('bituachLeumi', {
                    employeeMonthlyGrossIncome: Number(e.target.value),
                  })
                }
              />
            </Field>
            <InfoNote>
              זה משפיע גם על ביטוח לאומי (תיאום הסף המופחת) וגם על מס הכנסה: אין שתי מדרגות נפרדות —
              המשכורת "תופסת" את המדרגות הנמוכות קודם, והרווח מהעסק ממוסה החל מהמדרגה שהמשכורת כבר
              הגיעה אליה.
            </InfoNote>
          </>
        )}
      </FormSection>

      {/* 5. יעדי פנסיה וחיסכון */}
      <FormSection step={5} title="יעדי פנסיה וחיסכון">
        <InfoNote>
          <p>
            חובת ההפקדה המזערית לעצמאי: <strong>4.45%</strong> על הרווח השנתי עד{' '}
            <strong>82,614 ₪</strong> (כ-6,885 ₪/חודש), ו-<strong>12.55%</strong> על החלק שבין זה
            לבין <strong>165,228 ₪</strong> לשנה (כ-13,769 ₪/חודש). מעבר לכך אין עוד חובה חוקית
            להפקיד — אפשר כמובן לחסוך יותר מרצון.
          </p>
          <p className="mt-2">
            פנסיה וקרן השתלמות הן שתי מטרות נפרדות — אפשר להגדיר אחוז יעד לכל אחת בנפרד (למשל 6%
            לפנסיה ו-2.5% לקה"ש), בלי שאחת "נגזרת" מהשנייה.
          </p>
        </InfoNote>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="אחוז יעד להפקדה פנסיונית (%)"
            htmlFor="pensionTargetPercent"
            hint="מעבר למינימום החוקי — המערכת לא תרד מתחת לחובה בכל מקרה"
          >
            <TextInput
              id="pensionTargetPercent"
              type="number"
              min={0}
              max={25}
              step={0.05}
              value={profile.pensionGoals.pensionTargetPercent}
              onChange={(e) =>
                updateSection('pensionGoals', { pensionTargetPercent: Number(e.target.value) })
              }
            />
          </Field>
          <Field
            label="סכום הפקדה חודשי קבוע לפנסיה (₪, רשות)"
            htmlFor="monthlyPension"
            hint="אם מוגדר, גובר על האחוז"
          >
            <TextInput
              id="monthlyPension"
              type="number"
              min={0}
              value={profile.pensionGoals.monthlyPensionAmount ?? ''}
              onChange={(e) =>
                updateSection('pensionGoals', {
                  monthlyPensionAmount: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </Field>
          <Field
            label="אחוז יעד להפקדה לקרן השתלמות (%)"
            htmlFor="studyFundTargetPercent"
            hint="עצמאי מאחוז הפנסיה — לא חלק ממנו"
          >
            <TextInput
              id="studyFundTargetPercent"
              type="number"
              min={0}
              max={15}
              step={0.05}
              value={profile.pensionGoals.studyFundTargetPercent}
              onChange={(e) =>
                updateSection('pensionGoals', { studyFundTargetPercent: Number(e.target.value) })
              }
            />
          </Field>
          <Field
            label="סכום הפקדה חודשי קבוע לקרן השתלמות (₪, רשות)"
            htmlFor="monthlyStudyFund"
            hint="אם מוגדר, גובר על האחוז"
          >
            <TextInput
              id="monthlyStudyFund"
              type="number"
              min={0}
              value={profile.pensionGoals.monthlyStudyFundAmount ?? ''}
              onChange={(e) =>
                updateSection('pensionGoals', {
                  monthlyStudyFundAmount: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </Field>
        </div>
      </FormSection>

      {/* 6. אסטרטגיית מקדמות */}
      <FormSection step={6} title="אסטרטגיית מקדמות (סיכון)">
        <RadioCards
          name="advanceStrategy"
          value={profile.advanceStrategy}
          onChange={(v) => updateProfile({ advanceStrategy: v })}
          options={advanceStrategyOptions}
        />
      </FormSection>

      {/* 7. כרית ביטחון עסקית */}
      <FormSection step={7} title="כרית ביטחון עסקית" description="יעד מקובל: 2–6 חודשי הוצאות, ברירת מחדל 3.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="יעד — חודשי הוצאות" htmlFor="targetMonths">
            <TextInput
              id="targetMonths"
              type="number"
              min={1}
              max={12}
              value={profile.safetyNet.targetMonthsOfExpenses}
              onChange={(e) =>
                updateSection('safetyNet', { targetMonthsOfExpenses: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="יתרה נוכחית בקרן (₪)" htmlFor="currentBalance">
            <TextInput
              id="currentBalance"
              type="number"
              min={0}
              value={profile.safetyNet.currentBalance}
              onChange={(e) =>
                updateSection('safetyNet', { currentBalance: Number(e.target.value) })
              }
            />
          </Field>
        </div>
      </FormSection>

      {/* 8. העדפת משיכת שכר */}
      <FormSection
        step={8}
        title="העדפת משיכת שכר"
        description='בוחרים כיוון כללי כאן — את הסכום הקבוע עצמו לא צריך לנחש: ברגע שיש נתונים בדשבורד, יהיה אפשר לקבוע אותו משם (למשל "קחי את הממוצע המומלץ כסכום הקבוע שלי"), לא כאן בשאלון.'
      >
        <RadioCards
          name="salaryDrawModel"
          value={profile.salaryPreference.drawModel}
          onChange={(v) => updateSection('salaryPreference', { drawModel: v })}
          options={salaryDrawModelOptions}
        />
      </FormSection>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={markOnboardingComplete}
          className="rounded-brand-md bg-terra-deep px-6 py-3 font-heading font-bold text-white hover:opacity-90"
        >
          שמירת הפרופיל
        </button>
        <span className="text-sm text-taupe">הנתונים נשמרים אוטומטית בדפדפן בכל שינוי.</span>
      </div>
    </div>
  )
}
