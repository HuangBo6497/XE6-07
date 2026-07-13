import type { StageNode } from '@/data/types'
import { cn } from '@/lib/cn'

// ── The signature element ────────────────────────────────────────────────
// The print lifecycle rendered as an extrusion track. Done stages are
// "printed" (filled, layer-line texture); the active stage glows molten
// coral at the nozzle; pending stages are ghosted; blocked stages break
// the line in brick. This is the product's promise made visible:
// every step is legible, reversible, and confirmable.

const STATE_STYLE: Record<
  StageNode['state'],
  { node: string; label: string; connector: string }
> = {
  done: {
    node: 'bg-[var(--color-ink)] text-[var(--color-surface-2)] border-[var(--color-ink)]',
    label: 'text-[var(--color-ink)]',
    connector: 'bg-[var(--color-ink)]',
  },
  active: {
    node: 'bg-[var(--color-coral)] text-white border-[var(--color-coral-deep)] shadow-[0_0_0_4px_var(--color-coral-soft)]',
    label: 'text-[var(--color-coral-deep)] font-semibold',
    connector: 'bg-[var(--color-line-2)]',
  },
  blocked: {
    node: 'bg-[var(--color-brick-soft)] text-[var(--color-brick)] border-[var(--color-brick)]',
    label: 'text-[var(--color-brick)] font-semibold',
    connector: 'bg-[var(--color-line-2)]',
  },
  pending: {
    node: 'bg-transparent text-[var(--color-ink-3)] border-[var(--color-line-2)] border-dashed',
    label: 'text-[var(--color-ink-3)]',
    connector: 'bg-[var(--color-line)]',
  },
  skipped: {
    node: 'bg-[var(--color-line)] text-[var(--color-ink-3)] border-[var(--color-line-2)]',
    label: 'text-[var(--color-ink-3)] line-through',
    connector: 'bg-[var(--color-line)]',
  },
}

function StageGlyph({ state, index }: { state: StageNode['state']; index: number }) {
  if (state === 'done') {
    return (
      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden fill="none">
        <path d="M2.5 6.2 L5 8.5 L9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (state === 'blocked') {
    return (
      <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden fill="none">
        <path d="M4 4 L8 8 M8 4 L4 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }
  return <span className="font-mono text-[10px] leading-none tnum">{String(index + 1).padStart(2, '0')}</span>
}

// Layer-line texture overlay for "printed" (done) nodes.
const printedTexture: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(0deg, transparent 0, transparent 1px, rgba(255,255,255,0.14) 1px, rgba(255,255,255,0.14) 2px)',
}

export function PipelineRail({
  stages,
  orientation = 'vertical',
  className,
}: {
  stages: StageNode[]
  orientation?: 'vertical' | 'horizontal'
  className?: string
}) {
  if (orientation === 'horizontal') {
    return (
      <div className={cn('flex items-center', className)} role="list" aria-label="打印流程进度">
        {stages.map((s, i) => {
          const st = STATE_STYLE[s.state]
          return (
            <div key={s.stage} className="flex flex-1 items-center last:flex-none" role="listitem">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'grid h-6 w-6 place-items-center rounded-full border transition-all',
                    st.node,
                  )}
                  style={s.state === 'done' ? printedTexture : undefined}
                  title={s.label}
                >
                  <StageGlyph state={s.state} index={i} />
                </div>
                <span className={cn('whitespace-nowrap text-[10.5px] leading-none', st.label)}>{s.label}</span>
              </div>
              {i < stages.length - 1 && (
                <div className="mx-1 h-[2px] flex-1 self-start mt-3 overflow-hidden rounded-full">
                  <div className={cn('h-full w-full', st.connector)} style={s.state === 'done' ? printedTexture : undefined} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // vertical
  return (
    <ol className={cn('relative', className)} aria-label="打印流程进度">
      {stages.map((s, i) => {
        const st = STATE_STYLE[s.state]
        const isLast = i === stages.length - 1
        return (
          <li key={s.stage} className="relative flex gap-3 pb-1">
            {/* rail column */}
            <div className="relative flex w-6 flex-none flex-col items-center">
              <div
                className={cn('z-10 grid h-6 w-6 place-items-center rounded-full border transition-all', st.node)}
                style={s.state === 'done' ? printedTexture : undefined}
              >
                <StageGlyph state={s.state} index={i} />
              </div>
              {!isLast && (
                <div className="w-[2px] flex-1 overflow-hidden rounded-full my-0.5" style={{ minHeight: 22 }}>
                  <div
                    className={cn('h-full w-full', st.connector)}
                    style={s.state === 'done' ? printedTexture : undefined}
                  />
                </div>
              )}
            </div>
            {/* label */}
            <div className={cn('pb-3 pt-0.5', isLast && 'pb-0')}>
              <div className={cn('text-[13px] leading-tight', st.label)}>{s.label}</div>
              {s.note && <div className="mt-0.5 text-[11.5px] leading-snug text-[var(--color-ink-3)]">{s.note}</div>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
