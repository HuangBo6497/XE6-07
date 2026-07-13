import { SPOOLS } from '@/data/mock'
import type { MaterialSpool } from '@/data/types'
import { SectionHead, Meter } from '@/components/ui'
import { cn } from '@/lib/cn'

export default function Materials() {
  const lowCount = SPOOLS.filter((s) => s.warning).length
  const totalRemaining = SPOOLS.reduce((a, s) => a + s.remainingGram, 0)

  // group by material family
  const families = Array.from(new Set(SPOOLS.map((s) => s.material)))

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7">
      <SectionHead
        eyebrow="MATERIALS · 耗材库存"
        title="耗材管理"
        right={
          <div className="flex items-center gap-4 font-mono text-[12px] text-[var(--color-ink-2)]">
            <span>{SPOOLS.length} 卷在库</span>
            <span className="tnum">{(totalRemaining / 1000).toFixed(2)} kg 余量</span>
            {lowCount > 0 && <span className="text-[var(--color-amber)]">{lowCount} 卷缺料</span>}
          </div>
        }
      />

      {lowCount > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-[4px] border border-[var(--color-amber)]/30 bg-[var(--color-amber-soft)]/40 px-4 py-3 text-[13px] text-[#8a5a0f]">
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M10 6v5M10 14h.01" /><path d="M8.6 3.2 2 15a1.6 1.6 0 0 0 1.4 2.4h13.2A1.6 1.6 0 0 0 18 15L11.4 3.2a1.6 1.6 0 0 0-2.8 0Z" /></svg>
          有 {lowCount} 卷耗材余量低于 15%，涉及珊瑚橙、薄荷绿。切片时若选到这些颜色，Agent 会在打印清单里提醒你先换料。
        </div>
      )}

      {families.map((fam) => (
        <div key={fam} className="mt-7">
          <div className="eyebrow mb-2.5 flex items-center gap-2">
            <span>{fam}</span>
            <span className="h-px flex-1 bg-[var(--color-line)]" />
            <span className="normal-case tracking-normal text-[var(--color-ink-3)]">
              {fam === 'PLA' ? '通用 · 玩具首选' : fam === 'PETG' ? '更韧 · 耐温' : '柔性 · 弹性件'}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SPOOLS.filter((s) => s.material === fam).map((s) => (
              <SpoolCard key={s.id} spool={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SpoolCard({ spool }: { spool: MaterialSpool }) {
  const pct = Math.round((spool.remainingGram / spool.totalGram) * 100)
  const isDark = ['#1A1815', '#3F8F6E', '#5B7C99'].includes(spool.colorHex)

  return (
    <article className={cn('card-raised p-4', spool.warning && 'ring-1 ring-[var(--color-amber)]/40')}>
      <div className="flex items-center gap-3">
        {/* spool disc */}
        <div className="relative grid h-14 w-14 flex-none place-items-center rounded-full" style={{ background: spool.colorHex }}>
          <div className="h-5 w-5 rounded-full border-[3px] border-[var(--color-surface-2)] bg-[var(--color-canvas)]" />
          <span className={cn('absolute inset-0 rounded-full ring-1 ring-inset', isDark ? 'ring-white/15' : 'ring-black/10')} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14.5px] font-medium">{spool.color}</h3>
            {spool.warning && <span className="pill pill-warn py-0.5">缺料</span>}
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-[var(--color-ink-3)]">
            {spool.material} · ⌀{spool.diameterMm} · 库位 {spool.location}
          </div>
        </div>
      </div>

      <div className="mt-3.5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-mono text-[11px] text-[var(--color-ink-3)]">剩余</span>
          <span className="font-mono tnum text-[13px] text-[var(--color-ink)]">
            {spool.remainingGram}
            <span className="text-[var(--color-ink-3)]"> / {spool.totalGram} g</span>
          </span>
        </div>
        <Meter
          value={pct}
          height={7}
          color={spool.warning ? 'var(--color-amber)' : pct < 40 ? 'var(--color-steel)' : 'var(--color-jade)'}
        />
        <div className="mt-1 text-right font-mono text-[10.5px] tnum text-[var(--color-ink-3)]">{pct}%</div>
      </div>
    </article>
  )
}
