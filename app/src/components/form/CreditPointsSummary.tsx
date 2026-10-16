import type { PersonalInfo } from '../../types/profile'
import { computeCreditPoints, resolveCreditPoints } from '../../utils/calculations'
import Field from './Field'
import { TextInput } from './inputs'
import InfoNote from './InfoNote'

interface CreditPointsSummaryProps {
  personal: PersonalInfo
  onUpdate: (patch: Partial<PersonalInfo>) => void
}

/**
 * מציגה את נקודות הזיכוי המחושבות אוטומטית (תושבות + ילדים — היחידות
 * שמאומתות במסמכי המחקר), עם קישור למחשבון הרשמי של רשות המסים לבדיקת
 * הסכום המלא, ושדה override שדורס את החישוב כשיש מספר מדויק יותר.
 */
export function CreditPointsSummary({ personal, onUpdate }: CreditPointsSummaryProps) {
  const autoPoints = computeCreditPoints(personal)
  const finalPoints = resolveCreditPoints(personal)
  const hasOverride = personal.creditPointsOverride !== null

  return (
    <div className="flex flex-col gap-3 rounded-brand-md bg-beige p-4">
      <div>
        <p className="text-sm font-semibold text-brown">נקודות זיכוי — לפי מה שמילאת למעלה</p>
        <p className="mt-1 font-heading text-xl font-bold text-terra-deep" dir="ltr">
          {autoPoints.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-taupe">
          מחושב מתושבות ({personal.gender === 'female' ? '2.75' : '2.25'}) + ילדים לפי גיל בלבד — הקטגוריות
          האחרות שסימנת למעלה (יישוב מזכה, נכות, עולה חדש, מילואים, תואר) לא נכנסות למספר הזה, כי אין
          לנו ערך מאומת שלהן.
        </p>
      </div>

      <InfoNote>
        <p>
          כדי לקבל את הסכום המלא והמדויק (כולל כל הקטגוריות), אפשר להשתמש ב
          <a
            href="https://secapp.taxes.gov.il/srsimulatorNZ/#/simulator"
            target="_blank"
            rel="noreferrer"
            className="mx-1 font-semibold text-terra-deep underline"
          >
            מחשבון נקודות הזיכוי הרשמי של רשות המסים
          </a>
          , או לקרוא הסבר מפורט ב
          <a
            href="https://www.kolzchut.org.il/he/נקודות_זיכוי_ממס_הכנסה"
            target="_blank"
            rel="noreferrer"
            className="mx-1 font-semibold text-terra-deep underline"
          >
            כל זכות
          </a>
          . שימו לב: המחשבון הרשמי עצמו מציין שהוא מחשב רק לפי מצב משפחתי/תושבות — יישוב מזכה, ילד עם
          צרכים מיוחדים ועוד לא כלולים שם, אז אם הם רלוונטיים לך יש להוסיף אותם בנפרד לתוצאה לפני שמזינים
          אותה למטה.
        </p>
      </InfoNote>

      <Field
        label='סה"כ נקודות זיכוי (אם כבר בדקת במחשבון הרשמי)'
        htmlFor="creditPointsOverride"
        hint="אופציונלי. אם תמלאי כאן, המספר הזה ישמש במקום החישוב האוטומטי למעלה — אין צורך לחשב ולחבר ידנית."
      >
        <TextInput
          id="creditPointsOverride"
          type="number"
          min={0}
          step={0.25}
          value={personal.creditPointsOverride ?? ''}
          onChange={(e) =>
            onUpdate({ creditPointsOverride: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
      </Field>

      {hasOverride && (
        <p className="text-sm font-semibold text-ink">
          בפועל נכנס לחישוב: <span dir="ltr">{finalPoints.toFixed(2)}</span> נקודות (הסכום שהזנת)
        </p>
      )}
    </div>
  )
}
