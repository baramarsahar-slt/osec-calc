import type { ReactNode } from 'react'

interface InfoNoteProps {
  children: ReactNode
}

/** קופסת הסבר קצרה בתוך סעיף שאלון — רקע בהיר, קו אקצנט טרקוטה בצד. */
export default function InfoNote({ children }: InfoNoteProps) {
  return (
    <div className="rounded-brand-sm border-r-4 border-terra bg-beige p-3 text-sm leading-relaxed text-brown">
      {children}
    </div>
  )
}
