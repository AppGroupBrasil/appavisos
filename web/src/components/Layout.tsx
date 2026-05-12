import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function ShellSindico({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const links = [
    ['/painel', 'Avisos'],
    ['/painel/blocos', 'Blocos'],
    ['/painel/moradores', 'Moradores'],
    ['/painel/timeline', 'Timeline'],
    ['/painel/reportes', 'Reportes'],
    ['/painel/canais-reporte', 'Canais de reporte'],
    ['/painel/documentos', 'Documentos'],
    ['/painel/areas', 'Áreas'],
    ['/painel/identidade', 'Identidade'],
    ['/painel/qr', 'QR Codes'],
  ]
  return (
    <div className="min-h-full grid md:grid-cols-[240px_1fr]">
      <aside className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col">
        <div className="font-bold text-lg mb-1">App Avisos</div>
        <div className="text-xs text-slate-500 mb-6">{user?.nome}</div>
        <nav className="flex-1 space-y-1">
          {links.map(([to, label]) => (
            <Link key={to} to={to}
              className={`block px-3 py-2 rounded-lg text-sm ${loc.pathname === to ? 'bg-slate-100 dark:bg-slate-800 font-medium' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={() => { logout(); nav('/login') }} className="text-sm text-slate-500 hover:text-slate-700 text-left px-3 py-2">Sair</button>
      </aside>
      <main className="p-6 max-w-5xl w-full">{children}</main>
    </div>
  )
}
