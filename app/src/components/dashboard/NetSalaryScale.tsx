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
  const trackFillPercent = stops.length > 1 ? (selectedIndex / (stops.length - 1)) * 100 : 0

  return (
    <div className="flex flex-col gap-4">
      <div key={selected.key} className="animate-fade-in rounded-brand-md bg-beige p-5 text-center shadow-sm">
        <p className="text-sm font-semibold text-brown">{selected.label}</p>
        <p className="mt-1 font-heading text-4xl font-extrabold text-terra-deep" dir="ltr">
          {currency.format(selected.value)}
        </p>
        <p className="mt-1 text-sm text-brown">{selected.description}</p>
      </div>

      <div className="relative py-2">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-beige-2">
          <div
            className="h-full rounded-full bg-terra-deep transition-[width] duration-200 ease-out"
            style={{ width: `${trackFillPercent}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={stops.length - 1}
          step={1}
          value={selectedIndex}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="relative h-2 w-full cursor-pointer appearance-none bg-transparent accent-terra-deep"
          aria-label="בחירת מודל משיכת שכר"
          aria-valuetext={`${selected.label}: ${currency.format(selected.value)}`}
        />
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}>
        {stops.map((stop, index) => {
          const isActive = index === selectedIndex
          return (
            <button
              key={stop.key}
              type="button"
              onClick={() => onSelect(index)}
              aria-pressed={isActive}
              className={[
                'flex flex-col items-center gap-0.5 rounded-brand-sm px-2 py-2 text-xs font-medium transition-all duration-150',
                isActive
                  ? 'scale-105 bg-terra-deep text-white shadow-sm'
                  : 'text-brown hover:scale-[1.02] hover:bg-beige',
              ].join(' ')}
            >
              {isActive && <span aria-hidden="true">●</span>}
              {stop.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
