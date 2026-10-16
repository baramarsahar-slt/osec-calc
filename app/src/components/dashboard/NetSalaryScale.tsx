const currency = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 })

export interface DrawStop {
  key: string
  label: string
  description: string
  value: number
}

interface NetSalaryScaleProps {
  stops: DrawStop[]
  selectedIndex: number
  onSelect: (index: number) => void
}

/**
 * סרגל אינטראקטיבי לבחירת מודל המשיכה החודשי. stops ממוינים מראש לפי ערך
 * עולה (lowest→highest), כדי שהסרגל עצמו תמיד יזוז בכיוון הגיוני.
 */
export function NetSalaryScale({ stops, selectedIndex, onSelect }: NetSalaryScaleProps) {
  if (stops.length === 0) return null

  const selected = stops[selectedIndex] ?? stops[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-brand-md bg-beige p-4 text-center">
        <p className="text-sm font-semibold text-brown">{selected.label}</p>
        <p className="mt-1 font-heading text-3xl font-bold text-terra-deep" dir="ltr">
          {currency.format(selected.value)}
        </p>
        <p className="mt-1 text-sm text-brown">{selected.description}</p>
      </div>

      <input
        type="range"
        min={0}
        max={stops.length - 1}
        step={1}
        value={selectedIndex}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-beige-2 accent-terra-deep"
        aria-label="בחירת מודל משיכת שכר"
        aria-valuetext={`${selected.label}: ${currency.format(selected.value)}`}
      />

      <div className="flex justify-between text-xs text-taupe">
        {stops.map((stop, index) => (
          <button
            key={stop.key}
            type="button"
            onClick={() => onSelect(index)}
            className={[
              'rounded-brand-sm px-2 py-1.5 font-medium transition-colors',
              index === selectedIndex ? 'bg-terra-deep text-white' : 'text-brown hover:bg-beige-2',
            ].join(' ')}
          >
            {stop.label}
          </button>
        ))}
      </div>
    </div>
  )
}
