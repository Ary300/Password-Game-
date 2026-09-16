import { NavLink } from 'react-router-dom'

const theLinks = [
  { to: '/', label: 'Setup' },
  { to: '/teamup', label: 'Team up' },
  { to: '/live', label: 'Live' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/podium', label: 'Podium' },
]

export default function TopBar() {
  const theItems = []
  for (let n = 0; n < theLinks.length; n++) {
    const theLink = theLinks[n]
    theItems.push(
      <NavLink
        key={theLink.to}
        to={theLink.to}
        className={({ isActive }) =>
          'rounded-full px-3 py-1 text-sm font-medium transition ' +
          (isActive ? 'bg-accent text-accent-ink' : 'text-muted hover:text-text')
        }
      >
        {theLink.label}
      </NavLink>,
    )
  }
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4">
      <span className="font-display text-lg font-bold tracking-tight">Password</span>
      <nav className="ml-4 flex items-center gap-1">{theItems}</nav>
    </header>
  )
}
