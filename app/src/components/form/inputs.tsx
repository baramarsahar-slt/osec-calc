import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

const baseControlClass =
  'w-full rounded-brand-sm border border-taupe-light bg-beige px-3 py-2 text-ink placeholder:text-taupe focus:border-terra'

type TextInputProps = InputHTMLAttributes<HTMLInputElement>

/** שדה טקסט/מספר רגיל. ל-type="number" מוסיפים אוטומטית dir="ltr" (מספרים נשארים LTR). */
export function TextInput(props: TextInputProps) {
  const isNumeric = props.type === 'number'
  return (
    <input
      {...props}
      dir={isNumeric ? 'ltr' : props.dir}
      className={`${baseControlClass} ${isNumeric ? 'text-left' : ''} ${props.className ?? ''}`}
    />
  )
}

interface SelectOption {
  value: string
  label: string
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
}

export function SelectInput({ options, className, ...rest }: SelectInputProps) {
  return (
    <select {...rest} className={`${baseControlClass} ${className ?? ''}`}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

interface CheckboxRowProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}

/** שורת תיוג כן/לא — הצבע לעולם מלווה בטקסט (לא נושא מידע לבדו). */
export function CheckboxRow({ id, checked, onChange, children }: CheckboxRowProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-brand-sm bg-beige px-3 py-2.5"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-terra-deep"
      />
      <span className="text-sm text-ink">{children}</span>
    </label>
  )
}

interface RadioCardsOption<T extends string> {
  value: T
  label: string
  description?: string
}

interface RadioCardsProps<T extends string> {
  name: string
  value: T
  onChange: (value: T) => void
  options: RadioCardsOption<T>[]
}

/** בחירה בין כמה אפשרויות בלעדיות, כל אחת ככרטיס לחיץ — למקרים כמו עוסק פטור/מורשה/זעיר. */
export function RadioCards<T extends string>({ name, value, onChange, options }: RadioCardsProps<T>) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={[
              'rounded-brand-sm border px-3 py-2.5 text-start transition-colors',
              isActive
                ? 'border-terra-deep bg-terra-deep text-white'
                : 'border-taupe-light bg-beige text-ink hover:bg-beige-2',
            ].join(' ')}
          >
            <span className="block text-sm font-semibold">{opt.label}</span>
            {opt.description && (
              <span className={`mt-0.5 block text-xs ${isActive ? 'text-white/85' : 'text-brown'}`}>
                {opt.description}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
