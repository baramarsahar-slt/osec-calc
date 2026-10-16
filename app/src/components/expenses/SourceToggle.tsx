import type { PaymentSource } from '../../types/expense'

interface SourceToggleProps {
  value: PaymentSource
  onChange: (value: PaymentSource) => void
  idPrefix: string
}

/**
 * מתג "שולם מהעסק / שולם מהפרטי". הצבע תמיד מלווה בטקסט (לא נושא מידע לבדו),
 * ושתי האפשרויות נגישות גם למקלדת/קורא מסך (role="radiogroup" עם שני role="radio").
 */
export function SourceToggle({ value, onChange, idPrefix }: SourceToggleProps) {
  const isPrivate = value === 'private'

  return (
    <div
      role="radiogroup"
      aria-label="מקור תשלום"
      className="inline-flex overflow-hidden rounded-brand-sm border border-taupe-light"
    >
      <button
        type="button"
        id={`${idPrefix}-business`}
        role="radio"
        aria-checked={!isPrivate}
        onClick={() => onChange('business')}
        className={[
          'px-3 py-2 text-sm font-semibold transition-colors',
          !isPrivate ? 'bg-terra-deep text-white' : 'bg-beige text-brown hover:bg-beige-2',
        ].join(' ')}
      >
        עסקי
      </button>
      <button
        type="button"
        id={`${idPrefix}-private`}
        role="radio"
        aria-checked={isPrivate}
        onClick={() => onChange('private')}
        className={[
          'px-3 py-2 text-sm font-semibold transition-colors',
          isPrivate ? 'bg-terra-deep text-white' : 'bg-beige text-brown hover:bg-beige-2',
        ].join(' ')}
      >
        פרטי
      </button>
    </div>
  )
}
