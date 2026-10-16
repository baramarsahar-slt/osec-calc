import type { Child } from '../../types/profile'
import { TextInput } from './inputs'

interface ChildrenEditorProps {
  children: Child[]
  onChange: (children: Child[]) => void
}

const currentYear = new Date().getFullYear()

/** עריכת רשימת ילדים (שנת לידה בלבד — הגיל בשנת המס קובע את נקודות הזיכוי). */
export function ChildrenEditor({ children, onChange }: ChildrenEditorProps) {
  const addChild = () => {
    onChange([...children, { id: crypto.randomUUID(), birthYear: currentYear }])
  }

  const updateChild = (id: string, birthYear: number) => {
    onChange(children.map((c) => (c.id === id ? { ...c, birthYear } : c)))
  }

  const removeChild = (id: string) => {
    onChange(children.filter((c) => c.id !== id))
  }

  return (
    <div className="flex flex-col gap-2">
      {children.length === 0 && <p className="text-sm text-taupe">אין ילדים רשומים.</p>}
      {children.map((child, index) => (
        <div key={child.id} className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-sm text-brown">ילד/ה {index + 1}</span>
          <TextInput
            type="number"
            inputMode="numeric"
            value={child.birthYear}
            min={currentYear - 30}
            max={currentYear}
            onChange={(e) => updateChild(child.id, Number(e.target.value))}
            aria-label={`שנת לידה — ילד/ה ${index + 1}`}
          />
          <button
            type="button"
            onClick={() => removeChild(child.id)}
            className="shrink-0 rounded-brand-sm px-3 py-2 text-sm font-medium text-terra-deep hover:bg-beige"
            aria-label={`הסרת ילד/ה ${index + 1}`}
          >
            הסרה
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addChild}
        className="self-start rounded-brand-sm border border-terra-deep px-4 py-2 text-sm font-semibold text-terra-deep hover:bg-beige"
      >
        + הוספת ילד/ה
      </button>
    </div>
  )
}
