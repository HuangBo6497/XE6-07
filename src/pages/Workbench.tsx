import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PipelineRail } from '@/components/PipelineRail'
import { ModelViewer } from '@/components/ModelViewer'
import { DataRow, Meter } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  HERO_PROJECT,
  CHAT_SCRIPT,
  AUDIT_ISSUES,
  PRINTERS,
} from '@/data/mock'
import type { ChatMessage } from '@/data/types'

// 创作台 — PRD §15.1. Three columns: pipeline rail (left), Agent conversation
// (center), 3D preview + shop context (right). The CTA below the rail changes
// with project state; here the project is blocked at 可打印审计.

export default function Workbench() {
  const nav = useNavigate()
  const p = HERO_PROJECT
  const rev = p.revisions.find((r) => r.id === p.activeRevisionId)!
  const blocking = AUDIT_ISSUES.filter((i) => i.severity === 'block').length
  const warnings = AUDIT_ISSUES.filter((i) => i.severity === 'warn').length
  const printer = PRINTERS[0]

  return (
    <div className="grid grid-cols-[260px_minmax(0,1fr)_360px] max-[1180px]:grid-cols-[220px_minmax(0,1fr)] max-[860px]:grid-cols-1 grid-rows-[minmax(0,1fr)] max-[860px]:grid-rows-none h-[calc(100vh-60px)] max-[860px]:h-auto">
      {/* ── Left: pipeline rail ─────────────────────────────────────── */}
      <div className="border-r border-[var(--color-line)] bg-[var(--color-surface)] p-5 overflow-y-auto max-[860px]:border-r-0 max-[860px]:border-b">
        <div className="eyebrow mb-1">当前项目</div>
        <h2 className="text-[17px] leading-tight mb-1">{p.title}</h2>
        <div className="font-mono text-[11px] text-[var(--color-ink-3)] mb-5">
          文本创建 · {rev.label} · 已改 2 版
        </div>

        <div className="eyebrow mb-3">打印流程</div>
        <PipelineRail stages={p.stages} />

        <div className="mt-5 rounded-[4px] border border-dashed border-[var(--color-brick)] bg-[var(--color-brick-soft)]/40 p-3">
          <div className="flex items-center gap-1.5 text-[var(--color-brick)] font-medium text-[13px] mb-1">
            <span className="dot" style={{ background: 'var(--color-brick)' }} />
            审计未通过
          </div>
          <p className="text-[12.5px] text-[var(--color-ink-2)] leading-relaxed">
            发现 {blocking} 个会导致打印失败的问题，需要先修复才能切片。
          </p>
          <button className="btn btn-primary w-full justify-center mt-3" onClick={() => nav('/audit')}>
            查看审计并修复
          </button>
        </div>
      </div>

      {/* ── Center: Agent conversation ──────────────────────────────── */}
      <div className="flex flex-col min-w-0 min-h-0 bg-[var(--color-canvas)] max-[860px]:h-[600px]">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div className="mx-auto max-w-[640px] space-y-4">
            <AgentIntroCard />
            {CHAT_SCRIPT.map((m) => (
              <ChatBubble key={m.id} m={m} blocking={blocking} warnings={warnings} onAudit={() => nav('/audit')} />
            ))}
          </div>
        </div>
        <Composer />
      </div>

      {/* ── Right: 3D preview + context ─────────────────────────────── */}
      <div className="border-l border-[var(--color-line)] bg-[var(--color-surface)] flex flex-col overflow-y-auto max-[1180px]:hidden">
        <div className="relative h-[300px] flex-none border-b border-[var(--color-line)]">
          <ModelViewer color="#5B7C99" />
          <div className="absolute left-3 top-3 pill pill-steel">
            <span className="dot" style={{ background: 'var(--color-steel)' }} /> 拖动可旋转
          </div>
          <div className="absolute right-3 top-3 pill pill-block">
            <span className="dot" style={{ background: 'var(--color-brick)' }} /> 未通过审计
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="eyebrow mb-2">模型尺寸 · MM</div>
            <div className="grid grid-cols-3 gap-2">
              {(['x', 'y', 'z'] as const).map((axis) => (
                <div key={axis} className="rounded-[4px] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-2.5 text-center">
                  <div className="font-mono text-[10px] text-[var(--color-ink-3)] uppercase">{axis}</div>
                  <div className="font-display text-[19px] tnum">{rev.meshStats.bboxMm[axis]}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow mb-2">可打印评分</div>
            <div className="flex items-center gap-3">
              <div className="font-display text-[34px] leading-none tnum text-[var(--color-brick)]">{rev.printableScore}</div>
              <div className="flex-1">
                <Meter value={rev.printableScore} color="var(--color-brick)" height={8} />
                <div className="text-[11.5px] text-[var(--color-ink-3)] mt-1.5">
                  修复 {blocking} 个阻断项后预计升至 <span className="font-mono text-[var(--color-jade)]">92</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="eyebrow mb-2">网格数据</div>
            <div className="rounded-[4px] border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3">
              <DataRow label="三角面" value={rev.meshStats.triangles.toLocaleString()} />
              <DataRow label="顶点" value={rev.meshStats.vertices.toLocaleString()} />
              <DataRow label="体积" value={`${rev.meshStats.volumeCm3} cm³`} />
              <DataRow label="水密 / 流形" value={rev.meshStats.watertight ? '是 / 是' : '否'} />
            </div>
          </div>

          <div>
            <div className="eyebrow mb-2">目标打印机</div>
            <div className="rounded-[4px] border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[4px] bg-[var(--color-canvas)] grid place-items-center flex-none">
                <span className="dot" style={{ background: 'var(--color-coral)' }} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">{printer.name}</div>
                <div className="font-mono text-[11px] text-[var(--color-ink-3)] truncate">
                  {printer.provider} {printer.model} · {printer.status === 'printing' ? '打印中' : '在线'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentIntroCard() {
  return (
    <div className="flex items-center gap-2.5 justify-center py-2">
      <div className="h-px flex-1 bg-[var(--color-line)]" />
      <span className="font-mono text-[10.5px] text-[var(--color-ink-3)] tracking-[0.14em] uppercase">
        Workflow Agent 会全程解释每一步
      </span>
      <div className="h-px flex-1 bg-[var(--color-line)]" />
    </div>
  )
}

function ChatBubble({
  m,
  blocking,
  warnings,
  onAudit,
}: {
  m: ChatMessage
  blocking: number
  warnings: number
  onAudit: () => void
}) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[10px] rounded-tr-[3px] bg-[var(--color-ink)] text-[var(--color-surface-2)] px-3.5 py-2.5 text-[13.5px] leading-relaxed">
          {m.text}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2.5">
      <AgentAvatar />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="max-w-[85%] rounded-[10px] rounded-tl-[3px] card-raised px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[var(--color-ink)]">
          {m.text}
        </div>
        {m.kind === 'options' && <OptionRow m={m} />}
        {m.kind === 'intent_card' && <IntentCard />}
        {m.kind === 'audit_summary' && <AuditSummaryCard blocking={blocking} warnings={warnings} onAudit={onAudit} />}
      </div>
    </div>
  )
}

function OptionRow({ m }: { m: ChatMessage }) {
  const [picked, setPicked] = useState<number | null>(1)
  return (
    <div className="flex flex-wrap gap-2">
      {m.options?.map((o, i) => (
        <button
          key={o.label}
          onClick={() => setPicked(i)}
          className={cn(
            'rounded-[4px] border px-3 py-2 text-left transition-all',
            picked === i
              ? 'border-[var(--color-coral)] bg-[var(--color-coral-soft)]/50 ring-1 ring-[var(--color-coral)]'
              : 'border-[var(--color-line-2)] bg-[var(--color-surface-2)] hover:border-[var(--color-ink-3)]',
          )}
        >
          <div className="text-[13px] font-medium">{o.label}</div>
          {o.hint && <div className="font-mono text-[10.5px] text-[var(--color-ink-3)] mt-0.5">{o.hint}</div>}
        </button>
      ))}
    </div>
  )
}

function IntentCard() {
  const intent = HERO_PROJECT.intent!
  const rows: [string, string][] = [
    ['主体', intent.subject],
    ['风格', intent.style],
    ['用途', intent.useCase],
    ['尺寸', `${intent.sizeMm.x}×${intent.sizeMm.y}×${intent.sizeMm.z} mm`],
    ['颜色', intent.colorMode],
    ['面数偏好', '标准'],
  ]
  return (
    <div className="max-w-[92%] rounded-[6px] border border-[var(--color-line-2)] bg-[var(--color-surface-2)] overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/50">
        <span className="eyebrow">Design Intent · 结构化意图</span>
        <span className="pill pill-pass"><span className="dot" style={{ background: 'var(--color-jade)' }} />已确认</span>
      </div>
      <div className="grid grid-cols-2 gap-x-5 px-3.5 py-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-1.5 border-b border-[var(--color-line)] last:border-0 [&:nth-last-child(2)]:border-0">
            <span className="text-[12px] text-[var(--color-ink-3)]">{k}</span>
            <span className="text-[12.5px] font-mono text-right">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 px-3.5 py-2.5 border-t border-[var(--color-line)]">
        {intent.constraints.map((c) => (
          <span key={c} className="pill pill-coral">{c}</span>
        ))}
      </div>
    </div>
  )
}

function AuditSummaryCard({ blocking, warnings, onAudit }: { blocking: number; warnings: number; onAudit: () => void }) {
  return (
    <div className="max-w-[92%] rounded-[6px] border border-[var(--color-line-2)] bg-[var(--color-surface-2)] overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--color-line)]">
        <span className="eyebrow">可打印审计 · MeshReport</span>
        <span className="font-mono text-[11px] text-[var(--color-brick)]">score 61/100</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[var(--color-line)]">
        <SummaryStat n={blocking} label="阻断" color="var(--color-brick)" />
        <SummaryStat n={warnings} label="警告" color="var(--color-amber)" />
        <SummaryStat n={2} label="通过" color="var(--color-jade)" />
      </div>
      <div className="p-3 border-t border-[var(--color-line)]">
        <button className="btn btn-primary w-full justify-center" onClick={onAudit}>
          逐项查看并一键修复 →
        </button>
      </div>
    </div>
  )
}

function SummaryStat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="text-center py-3">
      <div className="font-display text-[24px] leading-none tnum" style={{ color }}>{n}</div>
      <div className="font-mono text-[10.5px] text-[var(--color-ink-3)] mt-1 uppercase tracking-wider">{label}</div>
    </div>
  )
}

function Composer() {
  return (
    <div className="flex-none border-t border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-3.5">
      <div className="mx-auto max-w-[640px]">
        <div className="flex items-center gap-2 rounded-[8px] border border-[var(--color-line-2)] bg-[var(--color-surface-2)] pl-3 pr-2 py-1.5 focus-within:border-[var(--color-coral)] transition-colors">
          <button className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)] transition-colors" title="上传图片或模型" aria-label="上传图片或模型">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4v12M4 10h12" /></svg>
          </button>
          <input
            className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[var(--color-ink-3)]"
            placeholder="告诉 Agent 你想改什么，比如“大一点”“换成蓝色”…"
          />
          <button className="btn btn-primary py-1.5 px-3" aria-label="发送">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h9M8 4l4 4-4 4" /></svg>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {['大一点', '加个挂孔', '换成积木风', '换台打印机'].map((s) => (
            <button key={s} className="font-mono text-[11px] text-[var(--color-ink-2)] px-2 py-1 rounded-[4px] border border-[var(--color-line)] bg-[var(--color-surface-2)] hover:border-[var(--color-ink-3)] transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentAvatar() {
  return (
    <div className="w-8 h-8 flex-none rounded-full bg-[var(--color-ink)] grid place-items-center">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="7" stroke="var(--color-coral)" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.5" fill="var(--color-coral)" />
      </svg>
    </div>
  )
}
