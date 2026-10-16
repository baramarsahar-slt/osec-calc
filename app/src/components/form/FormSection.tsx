import type { ReactNode } from 'react'

interface FormSectionProps {
  step: number
  title: string
  description?: string
  children: ReactNode
}

/** כרטיס-סעיף בשאלון: כותרת ממוספרת + תיאור + שדות. עוטף כל סעיף ב-Onboarding. */
export default function FormSection({ step, title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-brand-lg bg-beige-2 p-5 sm:p-6">
      <header className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-terra-deep font-heading text-sm font-bold text-white">
          {step}
        </span>
        <div>
          <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm text-brown">{description}</p>}
        </div>
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}
