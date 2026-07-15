import { useState } from 'react'
import { COMMUNITY_MODELS } from '@/data/mock'
import type { CommunityModel } from '@/data/types'
import { SectionHead } from '@/components/ui'
import { cn } from '@/lib/cn'

const FILTERS = ['全部', '玩具', '摆件', '钥匙扣', '实用', '已验证可打印'] as const
const SORTS = ['热度', '最多打印', '最新'] as const

export default function Community() {
  const [filter, setFilter] = useState<string>('全部')
  const [sort, setSort] = useState<string>('热度')
  const [forked, setForked] = useState<string | null>(null)

  let models = COMMUNITY_MODELS.filter((m) => {
    if (filter === '全部') return true
    if (filter === '已验证可打印') return m.printableVerified
    return m.tags.includes(filter)
  })
  models = [...models].sort((a, b) =>
    sort === '最多打印' ? b.prints - a.prints : sort === '最新' ? 0 : b.likes - a.likes,
  )

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7">
      <SectionHead
        eyebrow="COMMUNITY · 灵感与模型"
        title="社区"
        right={
          <div className="relative">
            <input
              placeholder="搜索模型、标签、作者…"
              className="w-[260px] rounded-[4px] border border-[var(--color-line-2)] bg-[var(--color-surface-2)] py-2 pl-9 pr-3 text-[13px] outline-none focus:border-[var(--color-coral)]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-3)]" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="9" cy="9" r="6" /><path d="m14 14 3 3" strokeLinecap="round" />
            </svg>
          </div>
        }
      />

      {/* Filter + sort bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-[4px] border px-3 py-1.5 text-[12.5px] transition-colors',
                filter === f
                  ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface-2)]'
                  : 'border-[var(--color-line-2)] text-[var(--color-ink-2)] hover:border-[var(--color-ink-3)]',
                f === '已验证可打印' && filter !== f && 'border-[var(--color-jade)]/40 text-[var(--color-jade)]',
              )}
            >
              {f === '已验证可打印' && '✓ '}
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[12px]">
          <span className="text-[var(--color-ink-3)]">排序</span>
          {SORTS.map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn('rounded px-2 py-1 transition-colors', sort === s ? 'font-medium text-[var(--color-coral-deep)]' : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink)]')}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
        {models.map((m) => (
          <ModelCard key={m.id} model={m} justForked={forked === m.id} onFork={() => setForked(m.id)} />
        ))}
      </div>
    </div>
  )
}

function ModelCard({ model, justForked, onFork }: { model: CommunityModel; justForked: boolean; onFork: () => void }) {
  return (
    <article className="card-raised group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-20px_rgba(26,24,21,0.5)]">
      {/* thumb */}
      <div className="relative h-[168px] overflow-hidden" style={{ background: `linear-gradient(155deg, ${model.thumbnail}, ${model.thumbnail}cc)` }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 4px, rgba(255,255,255,0.45) 4px 5px)' }} />
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          {model.printableVerified ? (
            <span className="pill pill-pass shadow-sm">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 5 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              可打印验证
            </span>
          ) : (
            <span className="pill pill-neutral bg-white/80 shadow-sm">未验证</span>
          )}
        </div>
        <div className="absolute bottom-2.5 right-2.5 rounded bg-black/35 px-1.5 py-0.5 font-mono text-[10px] text-white backdrop-blur-sm">
          {model.sizeMm.x}×{model.sizeMm.y}×{model.sizeMm.z}
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="text-[14.5px] font-medium leading-snug">{model.title}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--color-ink-3)]">
          <span className="text-[14px]">{model.authorAvatar}</span>
          {model.author}
          <span className="ml-auto rounded border border-[var(--color-line)] px-1.5 py-px font-mono text-[9.5px] tracking-wide">{model.license}</span>
        </div>

        {/* stats */}
        <div className="mt-2.5 flex items-center gap-3 border-t border-[var(--color-line)] pt-2.5 font-mono text-[11px] text-[var(--color-ink-2)]">
          <span className="flex items-center gap-1" title="点赞">♥ {fmt(model.likes)}</span>
          <span className="flex items-center gap-1" title="Fork">⑂ {fmt(model.forks)}</span>
          <span className="flex items-center gap-1" title="打印次数">⎙ {fmt(model.prints)}</span>
        </div>

        <button
          onClick={onFork}
          className={cn('btn mt-3 w-full justify-center text-[13px]', justForked ? 'btn-ghost text-[var(--color-jade)]' : 'btn-primary')}
        >
          {justForked ? '✓ 已 Fork 到工作台' : 'Fork 到工作台'}
        </button>
      </div>
    </article>
  )
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}
