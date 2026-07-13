import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModelViewer } from '@/components/ModelViewer'
import { SeverityPill, Meter } from '@/components/ui'
import { cn } from '@/lib/cn'
import { AUDIT_ISSUES, REPAIR_OPTIONS, HERO_PROJECT } from '@/data/mock'
import type { AuditIssue, RepairKind } from '@/data/types'

// 可打印审计与修复 — PRD §15.2. Left: issue list grouped by severity, each
// expandable with the Agent's plain-language explanation. Right: 3D preview +
// one-click repairs. Applying repairs re-runs the audit (修复后复审).

const REPAIR_LABEL: Record<RepairKind, string> = {
  thicken: '加厚薄壁',
  add_base: '加底座',
  add_hole: '打挂孔',
  scale: '缩放',
  flatten: '切平',
  rotate: '旋转',
  decimate: '简化面数',
}

export default function AuditRepair() {
  const nav = useNavigate()
  const [applied, setApplied] = useState<Set<RepairKind>>(new Set())
  const [expanded, setExpanded] = useState<string | null>('iss-01')

  // an issue is resolved if its fix repair has been applied
  const isResolved = (i: AuditIssue) => i.fix != null && applied.has(i.fix)
  const issues = AUDIT_ISSUES
  const blocking = issues.filter((i) => i.severity === 'block')
  const unresolvedBlocking = blocking.filter((i) => !isResolved(i)).length
  const score = Math.min(96, HERO_PROJECT.auditScore! + applied.size * 11)
  const canSlice = unresolvedBlocking === 0

  const toggleRepair = (k: RepairKind) => {
    setApplied((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  const grouped: { sev: 'block' | 'warn' | 'pass'; label: string }[] = [
    { sev: 'block', label: '阻断项 · 必须修复' },
    { sev: 'warn', label: '警告项 · 建议处理' },
    { sev: 'pass', label: '已通过检查' },
  ]

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_400px] max-[1000px]:grid-cols-1">
      {/* ── Left: audit report ──────────────────────────────────────── */}
      <div className="p-6 max-[1000px]:order-2">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="eyebrow mb-1.5">可打印审计 · MeshReport v0</div>
            <h2 className="text-[20px] leading-tight">{HERO_PROJECT.title}</h2>
            <p className="text-[13px] text-[var(--color-ink-2)] mt-1 max-w-[520px]">
              Agent 已用大白话解释每个问题。修复会保存为新版本，且会
              <span className="text-[var(--color-ink)] font-medium">自动重新审计</span>，你随时能回退。
            </p>
          </div>
        </div>

        {/* score banner */}
        <div className="card-raised p-4 mb-5 flex items-center gap-5">
          <div className="text-center flex-none">
            <div
              className="font-display text-[40px] leading-none tnum transition-colors"
              style={{ color: canSlice ? 'var(--color-jade)' : 'var(--color-brick)' }}
            >
              {score}
            </div>
            <div className="eyebrow mt-1">评分</div>
          </div>
          <div className="flex-1 min-w-0">
            <Meter value={score} color={canSlice ? 'var(--color-jade)' : 'var(--color-brick)'} height={8} />
            <div className="text-[13px] text-[var(--color-ink-2)] mt-2">
              {canSlice ? (
                <span className="text-[var(--color-jade)] font-medium">所有阻断项已修复，可以进入切片。</span>
              ) : (
                <>还有 <span className="font-mono text-[var(--color-brick)]">{unresolvedBlocking}</span> 个阻断项未修复，切片被锁定。</>
              )}
            </div>
          </div>
        </div>

        {/* grouped issues */}
        <div className="space-y-5">
          {grouped.map((g) => {
            const list = issues.filter((i) => i.severity === g.sev)
            if (!list.length) return null
            return (
              <div key={g.sev}>
                <div className="eyebrow mb-2">{g.label} · {list.length}</div>
                <div className="space-y-2">
                  {list.map((iss) => (
                    <IssueRow
                      key={iss.id}
                      iss={iss}
                      resolved={isResolved(iss)}
                      expanded={expanded === iss.id}
                      onToggle={() => setExpanded(expanded === iss.id ? null : iss.id)}
                      onFix={iss.fix ? () => toggleRepair(iss.fix!) : undefined}
                      fixApplied={iss.fix ? applied.has(iss.fix) : false}
                      repairLabel={iss.fix ? REPAIR_LABEL[iss.fix] : undefined}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right: preview + repairs ────────────────────────────────── */}
      <div className="border-l border-[var(--color-line)] bg-[var(--color-surface)] max-[1000px]:order-1 max-[1000px]:border-l-0 max-[1000px]:border-b flex flex-col">
        <div className="relative h-[320px] flex-none border-b border-[var(--color-line)]">
          <ModelViewer color="#5B7C99" />
          <div className="absolute left-3 bottom-3 pill pill-neutral font-mono">
            {applied.size > 0 ? `v3 · 已应用 ${applied.size} 项修复` : 'v2 · 当前版本'}
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="eyebrow mb-3">一键修复 · RepairAction</div>
          <div className="space-y-2">
            {REPAIR_OPTIONS.map((r) => {
              const on = applied.has(r.kind)
              return (
                <button
                  key={r.kind}
                  onClick={() => toggleRepair(r.kind)}
                  className={cn(
                    'w-full text-left rounded-[4px] border p-3 transition-all flex items-start gap-3',
                    on
                      ? 'border-[var(--color-jade)] bg-[var(--color-jade-soft)]/40'
                      : 'border-[var(--color-line-2)] bg-[var(--color-surface-2)] hover:border-[var(--color-ink-3)]',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid h-4.5 w-4.5 place-items-center rounded-full border flex-none transition-colors',
                      on ? 'bg-[var(--color-jade)] border-[var(--color-jade)]' : 'border-[var(--color-line-2)]',
                    )}
                    style={{ width: 18, height: 18 }}
                  >
                    {on && (
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                        <path d="M2.5 6.2 5 8.5 9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[13.5px] font-medium">{r.label}</span>
                      {r.recommended && <span className="pill pill-coral text-[10px] py-0.5">推荐</span>}
                    </span>
                    <span className="block text-[12px] text-[var(--color-ink-3)] mt-0.5">{r.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-[var(--color-line)] p-4 bg-[var(--color-surface-2)]">
          {applied.size > 0 && (
            <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-jade)] mb-2.5 font-mono">
              <span className="dot" style={{ background: 'var(--color-jade)' }} />
              修复后已自动复审 · 新版本 v3 已存档
            </div>
          )}
          <button
            className={cn('btn w-full justify-center', canSlice ? 'btn-primary' : 'btn-ghost opacity-50 cursor-not-allowed')}
            disabled={!canSlice}
            onClick={() => canSlice && nav('/slice')}
          >
            {canSlice ? '进入切片 →' : `先修复 ${unresolvedBlocking} 个阻断项`}
          </button>
        </div>
      </div>
    </div>
  )
}

function IssueRow({
  iss,
  resolved,
  expanded,
  onToggle,
  onFix,
  fixApplied,
  repairLabel,
}: {
  iss: AuditIssue
  resolved: boolean
  expanded: boolean
  onToggle: () => void
  onFix?: () => void
  fixApplied: boolean
  repairLabel?: string
}) {
  return (
    <div
      className={cn(
        'rounded-[4px] border overflow-hidden transition-all',
        resolved ? 'border-[var(--color-jade)]/50 bg-[var(--color-jade-soft)]/20' : 'border-[var(--color-line)] bg-[var(--color-surface-2)]',
      )}
    >
      <button className="w-full flex items-center gap-3 px-3.5 py-3 text-left" onClick={onToggle}>
        {resolved ? (
          <SeverityPill severity="pass">已修复</SeverityPill>
        ) : (
          <SeverityPill severity={iss.severity} />
        )}
        <span className={cn('flex-1 text-[13.5px] font-medium', resolved && 'text-[var(--color-ink-3)] line-through')}>
          {iss.title}
        </span>
        {iss.measured && (
          <span className="font-mono text-[11.5px] text-[var(--color-ink-3)] tnum">{iss.measured}</span>
        )}
        <svg
          viewBox="0 0 12 12"
          className={cn('h-3 w-3 text-[var(--color-ink-3)] transition-transform', expanded && 'rotate-180')}
          fill="none"
        >
          <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div className="px-3.5 pb-3.5 pt-0">
          <div className="rounded-[4px] bg-[var(--color-canvas)]/60 border border-[var(--color-line)] p-3">
            <div className="flex gap-2">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="flex-none mt-0.5" aria-hidden>
                <circle cx="10" cy="10" r="7" stroke="var(--color-coral)" strokeWidth="1.5" />
                <circle cx="10" cy="10" r="2.5" fill="var(--color-coral)" />
              </svg>
              <p className="text-[13px] leading-relaxed text-[var(--color-ink-2)]">{iss.explain}</p>
            </div>
            {(iss.measured || iss.threshold) && (
              <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-[var(--color-line)]">
                {iss.measured && (
                  <div>
                    <div className="font-mono text-[10px] text-[var(--color-ink-3)] uppercase">实测</div>
                    <div className="font-mono text-[13px] text-[var(--color-brick)]">{iss.measured}</div>
                  </div>
                )}
                {iss.threshold && (
                  <div>
                    <div className="font-mono text-[10px] text-[var(--color-ink-3)] uppercase">要求</div>
                    <div className="font-mono text-[13px] text-[var(--color-jade)]">{iss.threshold}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          {onFix && (
            <button
              onClick={onFix}
              className={cn('btn mt-2.5 text-[12.5px] py-2', fixApplied ? 'btn-ghost' : 'btn-primary')}
            >
              {fixApplied ? `✓ 已${repairLabel}（点击撤销）` : `一键${repairLabel}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
