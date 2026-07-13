import { NavLink, useLocation, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { PRINTERS, SPOOLS } from '@/data/mock'

// ── Navigation model — mirrors PRD §13.1 first-level nav ───────────────────
const NAV: { to: string; label: string; glyph: ReactNode; group: string }[] = [
  { to: '/', label: '创作台', glyph: <Glyph shape="spark" />, group: '创作' },
  { to: '/projects', label: '我的项目', glyph: <Glyph shape="stack" />, group: '创作' },
  { to: '/community', label: '模型社区', glyph: <Glyph shape="share" />, group: '创作' },
  { to: '/slices', label: '切片任务', glyph: <Glyph shape="layers" />, group: '生产' },
  { to: '/prints', label: '打印任务', glyph: <Glyph shape="print" />, group: '生产' },
  { to: '/devices', label: '设备管理', glyph: <Glyph shape="printer" />, group: '车间' },
  { to: '/materials', label: '耗材管理', glyph: <Glyph shape="spool" />, group: '车间' },
]

export function AppShell() {
  const loc = useLocation()
  const printing = PRINTERS.filter((p) => p.status === 'printing').length
  const online = PRINTERS.filter((p) => p.status === 'online').length
  const lowSpools = SPOOLS.filter((s) => s.warning).length

  const groups = Array.from(new Set(NAV.map((n) => n.group)))

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-[224px] flex-none border-r border-[var(--color-line)] bg-[var(--color-surface)] flex flex-col sticky top-0 h-screen">
        <div className="px-5 h-[60px] flex items-center gap-2.5 border-b border-[var(--color-line)]">
          <Wordmark />
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {groups.map((g) => (
            <div key={g} className="mb-5">
              <div className="eyebrow px-2.5 mb-1.5">{g}</div>
              {NAV.filter((n) => n.group === g).map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-2.5 px-2.5 py-2 rounded-[4px] mb-0.5 text-[13.5px] transition-colors relative',
                      isActive
                        ? 'bg-[var(--color-canvas)] text-[var(--color-ink)] font-medium'
                        : 'text-[var(--color-ink-2)] hover:bg-[var(--color-canvas)]/60 hover:text-[var(--color-ink)]',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[var(--color-coral)]" />
                      )}
                      <span className={cn('transition-colors', isActive ? 'text-[var(--color-coral)]' : 'text-[var(--color-ink-3)] group-hover:text-[var(--color-ink-2)]')}>
                        {n.glyph}
                      </span>
                      {n.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Workshop status footer — live-ish shop telemetry */}
        <div className="border-t border-[var(--color-line)] p-3 space-y-2">
          <div className="eyebrow px-1">车间状态</div>
          <div className="flex items-center gap-1.5 flex-wrap px-1">
            <StatChip dot="var(--color-coral)" label={`${printing} 打印中`} pulse />
            <StatChip dot="var(--color-jade)" label={`${online} 空闲`} />
            {lowSpools > 0 && <StatChip dot="var(--color-amber)" label={`${lowSpools} 缺料`} />}
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar path={loc.pathname} />
        <main className="flex-1 min-w-0"><Outlet /></main>
      </div>
    </div>
  )
}

function TopBar({ path }: { path: string }) {
  const current = NAV.find((n) => n.to === path) ?? (path.startsWith('/projects') ? NAV[1] : NAV[0])
  return (
    <header className="h-[60px] flex-none border-b border-[var(--color-line)] bg-[var(--color-surface)]/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-2.5">
        <h1 className="text-[15px] font-display font-semibold tracking-tight">{current?.label}</h1>
        <span className="pill pill-neutral">MVP · Draft v0.2</span>
      </div>
      <div className="flex items-center gap-3">
        <NavLink to="/" className="btn btn-primary text-[13px] py-2">
          <Glyph shape="spark" /> 新建创作
        </NavLink>
        <div className="w-8 h-8 rounded-full bg-[var(--color-ink)] text-[var(--color-surface-2)] grid place-items-center font-display text-[13px] font-semibold">
          U
        </div>
      </div>
    </header>
  )
}

function StatChip({ dot, label, pulse }: { dot: string; label: string; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-ink-2)] font-mono">
      <span className="dot" style={{ background: dot }}>
        {pulse && <span className="block w-full h-full rounded-full animate-ping" style={{ background: dot, opacity: 0.6 }} />}
      </span>
      {label}
    </span>
  )
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      {/* extrusion mark: a nozzle laying a coral bead */}
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <rect x="7" y="2" width="12" height="9" rx="1.5" fill="var(--color-ink)" />
        <path d="M10 11 L13 16 L16 11 Z" fill="var(--color-ink)" />
        <circle cx="13" cy="20" r="2.4" fill="var(--color-coral)" />
        <path d="M4 24 Q13 21 22 24" stroke="var(--color-coral)" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      <div className="leading-none">
        <div className="font-display font-bold text-[15px] tracking-tight">XE6-07</div>
        <div className="font-mono text-[9px] text-[var(--color-ink-3)] tracking-[0.14em] mt-0.5">3D PRINT STUDIO</div>
      </div>
    </div>
  )
}

// ── Line-art glyph set (2px, matches hairline aesthetic) ───────────────────
function Glyph({ shape }: { shape: string }) {
  const p = { width: 17, height: 17, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (shape) {
    case 'spark':
      return <svg {...p}><path d="M10 3v3M10 14v3M3 10h3M14 10h3M5 5l2 2M13 13l2 2M15 5l-2 2M7 13l-2 2" /><circle cx="10" cy="10" r="2.3" fill="currentColor" stroke="none" /></svg>
    case 'stack':
      return <svg {...p}><path d="M10 3l6 3.2-6 3.2-6-3.2L10 3zM4 10l6 3.2 6-3.2M4 13.6l6 3.2 6-3.2" /></svg>
    case 'share':
      return <svg {...p}><circle cx="6" cy="10" r="2" /><circle cx="15" cy="5" r="2" /><circle cx="15" cy="15" r="2" /><path d="M7.8 9l5.4-3M7.8 11l5.4 3" /></svg>
    case 'layers':
      return <svg {...p}><path d="M3 7h14M3 10h14M3 13h14M3 4h14" /></svg>
    case 'print':
      return <svg {...p}><path d="M6 8V3h8v5M6 15h8v3H6zM4 8h12v5H4z" /><circle cx="13.5" cy="10.5" r=".6" fill="currentColor" /></svg>
    case 'printer':
      return <svg {...p}><rect x="3.5" y="4" width="13" height="12" rx="1" /><path d="M7 8h6M7 11h6" /></svg>
    case 'spool':
      return <svg {...p}><circle cx="10" cy="10" r="6.5" /><circle cx="10" cy="10" r="2" /><path d="M10 3.5v3M10 13.5v3" /></svg>
    default:
      return <svg {...p}><circle cx="10" cy="10" r="6" /></svg>
  }
}
