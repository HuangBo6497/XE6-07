import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { AuditSeverity } from '@/data/types'

// ── Section header with mono eyebrow (structure encodes the pipeline) ──────
export function SectionHead({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string
  title: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h2 className="text-[19px] leading-tight">{title}</h2>
      </div>
      {right}
    </div>
  )
}

// ── Severity pill ──────────────────────────────────────────────────────────
const SEV: Record<AuditSeverity, { cls: string; label: string; dot: string }> = {
  pass: { cls: 'pill-pass', label: '通过', dot: 'var(--color-jade)' },
  warn: { cls: 'pill-warn', label: '警告', dot: 'var(--color-amber)' },
  block: { cls: 'pill-block', label: '阻断', dot: 'var(--color-brick)' },
}

export function SeverityPill({ severity, children }: { severity: AuditSeverity; children?: ReactNode }) {
  const s = SEV[severity]
  return (
    <span className={cn('pill', s.cls)}>
      <span className="dot" style={{ background: s.dot }} />
      {children ?? s.label}
    </span>
  )
}

// ── Horizontal meter (remaining material, progress, infill) ────────────────
export function Meter({
  value,
  max = 100,
  color = 'var(--color-ink)',
  height = 6,
  track = 'var(--color-line)',
}: {
  value: number
  max?: number
  color?: string
  height?: number
  track?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div style={{ height, background: track, borderRadius: 999 }} className="w-full overflow-hidden">
      <div
        style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 999, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }}
      />
    </div>
  )
}

// ── Labeled data row, mono value (mm, counts, ids) ─────────────────────────
export function DataRow({ label, value, mono = true }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-line)] last:border-0">
      <span className="text-[13px] text-[var(--color-ink-3)]">{label}</span>
      <span className={cn('text-[13px] text-[var(--color-ink)]', mono && 'font-mono tnum')}>{value}</span>
    </div>
  )
}

// ── Key cap for keyboard hints ─────────────────────────────────────────────
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-line-2)] bg-[var(--color-surface-2)] text-[var(--color-ink-2)]">
      {children}
    </kbd>
  )
}
