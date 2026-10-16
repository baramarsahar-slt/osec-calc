import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
}

/** עטיפת תווית + שדה אחת, עקבית לכל השאלון. */
export default function Field({ label, htmlFor, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-brown">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-taupe">{hint}</p>}
    </div>
  )
}
