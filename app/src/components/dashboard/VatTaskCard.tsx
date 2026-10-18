import type { VatEstimate } from '../../utils/calculations'
import { useVatReportingLog } from '../../hooks/useVatReportingLog'
import { TaskCard } from './TaskCard'

const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })
const VAT_SERVICE_URL = 'https://www.gov.il/he/service/reporting-or-payment-of-vat-reports'

interface VatTaskCardProps {
  vat: VatEstimate
  /** מפתח חודש הדיווח (הזוגי) — רלוונטי רק כש-vat.isReportingMonth */
  reportingMonthKey: string
}

export function VatTaskCard({ vat, reportingMonthKey }: VatTaskCardProps) {
  const { isReported, getReportedAt, markReported, unmarkReported } = useVatReportingLog()

  if (!vat.isReportingMonth) {
    // חודש אי-זוגי: אין דרישת תשלום החודש — רק המלצה "להפריש בצד"
    return (
      <TaskCard title="מע״מ" amount={vat.accruedHoldAmount} badge={{ text: 'נצבר, לא לתשלום החודש', tone: 'neutral' }}>
        <p>נצבר עד חודש הדיווח הבא.</p>
        <p className="mt-1 text-xs text-taupe">
          טיפ: אפשר להפריש את הסכום הזה מהעו״ש לפיקדון יומי נזיל — ככה הוא לא "יושב" בחשבון ומבלבל כשמסתכלים על
          היתרה. לא להתפתות!
        </p>
      </TaskCard>
    )
  }

  const reported = isReported(reportingMonthKey)
  const reportedAt = getReportedAt(reportingMonthKey)

  return (
    <TaskCard
      title="מע״מ"
      amount={vat.netPayable}
      badge={reported ? { text: 'דווח ושולם', tone: 'neutral' } : { text: 'חודש דיווח', tone: 'warning' }}
    >
      <p>סכום סופי לתשלום/החזר לרשות המסים, מאוחד עם החודש הקודם.</p>
      {vat.previousMonthNetVat !== null && (
        <p className="mt-1 text-xs text-taupe">
          (<span dir="ltr">{currency.format(vat.currentMonthNetVat)}</span> מהחודש הנוכחי +{' '}
          <span dir="ltr">{currency.format(vat.previousMonthNetVat)}</span> מהחודש הקודם)
        </p>
      )}
      <a
        href={VAT_SERVICE_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs font-semibold text-terra-deep underline"
      >
        לדיווח ותשלום מע״מ באתר רשות המסים
      </a>

      {reported ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-taupe">
            סומן כדווח ושולם{reportedAt ? ` ב-${new Date(reportedAt).toLocaleDateString('he-IL')}` : ''}
          </p>
          <button
            type="button"
            onClick={() => unmarkReported(reportingMonthKey)}
            className="shrink-0 text-xs font-medium text-terra-deep underline"
          >
            ביטול סימון
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => markReported(reportingMonthKey)}
          className="mt-2 w-full rounded-brand-sm bg-terra-deep px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          ✓ דיווחתי ושילמתי
        </button>
      )}
    </TaskCard>
  )
}
