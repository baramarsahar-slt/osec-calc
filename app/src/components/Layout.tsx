import { NavLink, Outlet } from 'react-router-dom'
import logo from '../assets/logos/logo-color.png'

const navItems = [
  { to: '/onboarding', label: 'פרופיל' },
  { to: '/monthly', label: 'החודש שלי' },
  { to: '/', label: 'דשבורד', end: true },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-beige text-ink">
      <header className="border-b border-beige-2">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="בר עמר־סהר" className="h-10 w-10 rounded-brand-sm" />
            <span className="font-heading text-lg font-bold text-terra">
              ניהול קליניקה
            </span>
          </div>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-brand-md px-4 py-2 font-medium transition-colors',
                    isActive
                      ? 'bg-terra-deep text-white'
                      : 'text-brown hover:bg-beige-2',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
