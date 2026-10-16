import type { ReactNode } from 'react'

const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

interface TaskCardProps {
  title: string
  amount: number
  /** תג קטן ליד הכותרת (למשל "הערכה בלבד" / "חודש דיווח") */
  badge?: { text: string; tone: 'neutral' | 'warning' }
  /** שורת הסבר אחת-שתיים מתחת לסכום */
  children?: ReactNode
}

/**
 * כרטיסיית "משימה לפעולה" גנרית — מע"מ / מקדמת מס הכנסה / ביטוח לאומי /
 * פנסיה כולן משתמשות באותו עיצוב, כדי שהדשבורד ייראה כמערכת אחת.
 */
export function TaskCard({ title, amount, badge, children }: TaskCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-brand-lg bg-beige-2 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
        {badge && (
          <span
            className={[
              'rounded-full px-2.5 py-1 text-xs font-medium',
              badge.tone === 'warning' ? 'bg-terra/20 text-terra-deep' : 'bg-beige text-brown',
            ].join(' ')}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="font-heading text-2xl font-bold text-terra-deep" dir="ltr">
        {currency.format(amount)}
      </p>
      {children && <div className="text-sm text-brown">{children}</div>}
    </div>
  )
}
