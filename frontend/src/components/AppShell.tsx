import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { PRINTERS, SPOOLS } from '@/data/mock'

const PRIMARY_NAV = [
  { to: '/', label: '创作台', shape: 'spark' },
  { to: '/projects', label: '项目', shape: 'stack' },
  { to: '/community', label: '社区', shape: 'share' },
]

const ACCOUNT_NAV = [
  { to: '/slices', label: '切片任务', caption: '准备与检查模型', shape: 'layers' },
  { to: '/prints', label: '打印任务', caption: '查看进度与队列', shape: 'print' },
  { to: '/devices', label: '设备管理', caption: '管理打印机状态', shape: 'printer' },
  { to: '/materials', label: '耗材管理', caption: '库存、批次与预警', shape: 'spool' },
]

export function AppShell() {
  const loc = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const printing = PRINTERS.filter((printer) => printer.status === 'printing').length
  const online = PRINTERS.filter((printer) => printer.status === 'online').length
  const lowSpools = SPOOLS.filter((spool) => spool.warning).length

  useEffect(() => {
    setMenuOpen(false)
  }, [loc.pathname])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/72 px-5 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-5">
          <NavLink to="/" className="mr-3 flex-none" aria-label="灵构AI首页">
            <Wordmark />
          </NavLink>

          <nav className="flex min-w-0 flex-1 items-center gap-1" aria-label="主导航">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-medium transition-all duration-200',
                    isActive
                      ? 'bg-white text-[var(--color-ink)] shadow-[0_10px_30px_-18px_rgba(90,74,230,.75)] ring-1 ring-[var(--color-line-2)]'
                      : 'text-[var(--color-ink-2)] hover:bg-white/70 hover:text-[var(--color-ink)]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('transition-colors', isActive ? 'text-[var(--color-coral)]' : 'text-[var(--color-ink-3)] group-hover:text-[var(--color-coral)]')}>
                      <Glyph shape={item.shape} />
                    </span>
                    {item.label}
                    {isActive && <span className="absolute inset-x-4 -bottom-[14px] h-[3px] rounded-full bg-gradient-to-r from-[#6d5dfc] via-[#8a6df2] to-[#4ba7ff]" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 rounded-full border border-white bg-white/60 px-3 py-2 shadow-sm xl:flex">
            <StatChip dot="var(--color-coral)" label={`${printing} 打印中`} pulse />
            <span className="h-3 w-px bg-[var(--color-line)]" />
            <StatChip dot="var(--color-jade)" label={`${online} 空闲`} />
            {lowSpools > 0 && (
              <>
                <span className="h-3 w-px bg-[var(--color-line)]" />
                <StatChip dot="var(--color-amber)" label={`${lowSpools} 缺料`} />
              </>
            )}
          </div>

          <NavLink to="/" className="btn btn-primary hidden sm:inline-flex">
            <Glyph shape="plus" /> 新建创作
          </NavLink>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-full border bg-white/85 p-1.5 pr-2.5 transition-all hover:-translate-y-0.5 hover:shadow-lg',
                menuOpen ? 'border-[var(--color-coral)] shadow-[0_14px_40px_-22px_rgba(90,74,230,.75)]' : 'border-white shadow-sm',
              )}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#6d5dfc] via-[#8a6df2] to-[#4ba7ff] text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.4)]">
                U
              </span>
              <svg className={cn('text-[var(--color-ink-3)] transition-transform', menuOpen && 'rotate-180')} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 8 5 5 5-5" /></svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-[330px] overflow-hidden rounded-[22px] border border-white/80 bg-white/92 p-2 shadow-[0_28px_80px_-30px_rgba(61,55,123,.45)] backdrop-blur-2xl" role="menu">
                <div className="rounded-[16px] bg-gradient-to-br from-[#f2efff] via-[#f6f9ff] to-[#eaf7ff] p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#6d5dfc] to-[#4ba7ff] font-semibold text-white">U</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[14px] font-semibold">账号</span>
                        <span className="pill pill-pass">Pro</span>
                      </div>
                      <div className="truncate text-[12px] text-[var(--color-ink-3)]">user@xe6studio.com</div>
                    </div>
                    <button className="rounded-full border border-white bg-white/80 px-2.5 py-1.5 text-[11px] text-[var(--color-coral-deep)] shadow-sm hover:bg-white">个人资料</button>
                  </div>
                </div>

                <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-3)]">工作与资源</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {ACCOUNT_NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      role="menuitem"
                      className={({ isActive }) => cn(
                        'group rounded-[15px] border p-3 transition-all',
                        isActive
                          ? 'border-[var(--color-coral)]/25 bg-[var(--color-coral-soft)] text-[var(--color-coral-deep)]'
                          : 'border-transparent hover:border-[var(--color-line)] hover:bg-[var(--color-surface-2)]',
                      )}
                    >
                      <span className="mb-2 grid h-8 w-8 place-items-center rounded-[10px] bg-white text-[var(--color-coral)] shadow-sm ring-1 ring-[var(--color-line)]">
                        <Glyph shape={item.shape} />
                      </span>
                      <span className="block text-[13px] font-semibold">{item.label}</span>
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-[var(--color-ink-3)]">{item.caption}</span>
                    </NavLink>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-[var(--color-line)] px-2 pb-1 pt-3">
                  <span className="text-[11px] text-[var(--color-ink-3)]">灵构AI Cloud · 已同步</span>
                  <button className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[var(--color-coral-deep)] hover:bg-[var(--color-coral-soft)]">登录</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="min-w-0"><Outlet /></main>
    </div>
  )
}

function StatChip({ dot, label, pulse }: { dot: string; label: string; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[10.5px] text-[var(--color-ink-2)]">
      <span className="dot" style={{ background: dot }}>
        {pulse && <span className="block h-full w-full animate-ping rounded-full" style={{ background: dot, opacity: 0.45 }} />}
      </span>
      {label}
    </span>
  )
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-11 w-11 flex-none place-items-center" aria-hidden>
        <img
          src={`${import.meta.env.BASE_URL}brand-final/logo-black.svg`}
          alt=""
          className="h-full w-full scale-[1.16] object-contain"
        />
      </span>
      <div className="hidden leading-none sm:block">
        <div className="font-display text-[18px] font-bold tracking-[0.12em] text-black">灵构AI</div>
        <div className="mt-1.5 font-mono text-[8px] tracking-[0.14em] text-[var(--color-ink-3)]">AI 3D PRINTING</div>
      </div>
    </div>
  )
}

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
    case 'plus':
      return <svg {...p}><path d="M10 4v12M4 10h12" /></svg>
    default:
      return <svg {...p}><circle cx="10" cy="10" r="6" /></svg>
  }
}
