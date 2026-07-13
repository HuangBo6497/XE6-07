import { useState } from 'react'
import { PRINT_JOBS, PRINTERS, SPOOLS } from '@/data/mock'
import type { PrintJob, PrintJobStatus } from '@/data/types'
import { SectionHead, Meter } from '@/components/ui'
import { cn } from '@/lib/cn'

const JOB_STATUS: Record<PrintJobStatus, { label: string; cls: string; dot: string }> = {
  printing: { label: '打印中', cls: 'pill-coral', dot: 'var(--color-coral)' },
  queued: { label: '排队中', cls: 'pill-neutral', dot: 'var(--color-ink-3)' },
  paused: { label: '已暂停', cls: 'pill-warn', dot: 'var(--color-amber)' },
  completed: { label: '已完成', cls: 'pill-pass', dot: 'var(--color-jade)' },
  failed: { label: '已失败', cls: 'pill-block', dot: 'var(--color-brick)' },
}

export default function PrintJobs() {
  const [activeId, setActiveId] = useState(PRINT_JOBS[0].id)
  const active = PRINT_JOBS.find((j) => j.id === activeId)!

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7">
      <SectionHead
        eyebrow="PRINT JOBS · 打印任务与取件"
        title="打印任务"
        right={
          <div className="flex items-center gap-2 text-[12px] text-[var(--color-ink-3)]">
            <span className="font-mono">{PRINT_JOBS.filter((j) => j.status === 'printing').length} 打印中</span>
            <span className="text-[var(--color-line-2)]">·</span>
            <span className="font-mono">{PRINT_JOBS.filter((j) => j.status === 'queued').length} 排队</span>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Job list */}
        <div className="space-y-3">
          {PRINT_JOBS.map((job) => (
            <JobRow key={job.id} job={job} active={job.id === activeId} onSelect={() => setActiveId(job.id)} />
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-[84px] lg:self-start">
          <JobDetail job={active} />
        </div>
      </div>
    </div>
  )
}

function JobRow({ job, active, onSelect }: { job: PrintJob; active: boolean; onSelect: () => void }) {
  const st = JOB_STATUS[job.status]
  return (
    <button
      onClick={onSelect}
      className={cn(
        'card w-full text-left flex items-center gap-4 p-3.5 transition-all',
        active ? 'border-[var(--color-coral)] bg-[var(--color-surface-2)] shadow-[0_8px_24px_-18px_rgba(26,24,21,0.4)]' : 'hover:border-[var(--color-line-2)]',
      )}
    >
      <div
        className="relative h-14 w-14 flex-none overflow-hidden rounded-[3px]"
        style={{ background: job.thumbnail }}
      >
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.5) 3px 4px)' }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-medium">{job.projectTitle}</span>
          <span className={cn('pill flex-none', st.cls)}>{st.label}</span>
        </div>
        <div className="mt-0.5 text-[12px] text-[var(--color-ink-3)]">{job.printerName}</div>
        {job.status === 'printing' && (
          <div className="mt-2 flex items-center gap-2">
            <Meter value={job.progressPct} color="var(--color-coral)" height={5} />
            <span className="font-mono text-[11px] tnum text-[var(--color-ink-2)]">{job.progressPct}%</span>
          </div>
        )}
        {job.status === 'completed' && job.pickupCode && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11.5px]">
            <span className="text-[var(--color-ink-3)]">取件码</span>
            <span className="font-mono font-semibold tracking-wider text-[var(--color-jade)]">{job.pickupCode}</span>
          </div>
        )}
        {job.status === 'failed' && (
          <div className="mt-1.5 text-[11.5px] text-[var(--color-brick)]">
            {job.events[job.events.length - 1].label}
          </div>
        )}
      </div>

      {job.status === 'printing' && job.etaMinutes && (
        <div className="flex-none text-right">
          <div className="font-mono text-[15px] font-semibold tnum">{job.etaMinutes}</div>
          <div className="text-[10px] text-[var(--color-ink-3)]">分钟剩余</div>
        </div>
      )}
    </button>
  )
}

function JobDetail({ job }: { job: PrintJob }) {
  const printer = PRINTERS.find((p) => p.id === job.printerId)
  const spool = SPOOLS.find((s) => s.id === job.materialId)
  const st = JOB_STATUS[job.status]

  return (
    <div className="card-raised overflow-hidden">
      {/* Big preview */}
      <div className="relative h-[180px]" style={{ background: `linear-gradient(160deg, ${job.thumbnail}, ${job.thumbnail}bb)` }}>
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 4px, rgba(255,255,255,0.4) 4px 5px)' }} />
        <div className="absolute left-4 top-4">
          <span className={cn('pill', st.cls)}>
            <span className="dot" style={{ background: st.dot }} />
            {st.label}
          </span>
        </div>
        {job.status === 'printing' && (
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="mb-1.5 flex items-baseline justify-between text-white">
              <span className="font-mono text-[26px] font-bold tnum leading-none">{job.progressPct}%</span>
              <span className="font-mono text-[12px] text-white/80">约 {job.etaMinutes} 分钟</span>
            </div>
            <Meter value={job.progressPct} color="#fff" track="rgba(255,255,255,0.3)" height={5} />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-[16px] font-display font-semibold">{job.projectTitle}</h3>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-0 text-[13px]">
          <DetailItem label="打印机" value={printer?.name ?? '—'} />
          <DetailItem label="机型" value={printer?.model ?? '—'} />
          <DetailItem label="耗材" value={spool ? `${spool.material} · ${spool.color}` : '—'} swatch={spool?.colorHex} />
          <DetailItem label="喷嘴" value={`${printer?.nozzleMm ?? '—'} mm`} />
          {job.startedAt && <DetailItem label="开始" value={job.startedAt} />}
          <DetailItem label="任务号" value={job.id} />
        </div>

        {/* Pickup card when completed */}
        {job.status === 'completed' && job.pickupCode && (
          <div className="mt-4 rounded-[4px] border border-dashed border-[var(--color-jade)] bg-[var(--color-jade-soft)]/50 p-3.5 text-center">
            <div className="eyebrow text-[var(--color-jade)]">PICKUP CODE · 取件码</div>
            <div className="my-1 font-mono text-[30px] font-bold tracking-[0.12em] text-[#235c45]">{job.pickupCode}</div>
            <div className="text-[12px] text-[var(--color-ink-2)]">到车间 A 前台报出此码即可取件</div>
          </div>
        )}

        {/* Failure guidance — Agent voice */}
        {job.status === 'failed' && (
          <div className="mt-4 rounded-[4px] border border-[var(--color-brick)]/40 bg-[var(--color-brick-soft)]/40 p-3.5">
            <div className="eyebrow text-[var(--color-brick)]">AGENT · 失败原因</div>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink)]">
              打印到 23% 时耗材耗尽了。这卷薄荷绿只剩 70g，不够完成这次打印。建议换一卷余量充足的耗材，从头重新打印。
            </p>
            <div className="mt-2.5 flex gap-2">
              <button className="btn btn-primary text-[12.5px] py-1.5">换耗材重打</button>
              <button className="btn btn-ghost text-[12.5px] py-1.5">查看日志</button>
            </div>
          </div>
        )}

        {/* Event timeline */}
        <div className="mt-4">
          <div className="eyebrow mb-2">任务日志 · TRACE</div>
          <ol className="relative space-y-0">
            {job.events.map((e, i) => (
              <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
                <div className="relative flex flex-none flex-col items-center">
                  <span
                    className="z-10 mt-1 h-2 w-2 rounded-full"
                    style={{ background: e.kind === 'error' ? 'var(--color-brick)' : e.kind === 'warn' ? 'var(--color-amber)' : e.kind === 'ok' ? 'var(--color-jade)' : 'var(--color-ink-3)' }}
                  />
                  {i < job.events.length - 1 && <span className="absolute top-3 h-full w-px bg-[var(--color-line)]" />}
                </div>
                <div className="flex-1 pb-0.5">
                  <div className="text-[13px] leading-snug text-[var(--color-ink)]">{e.label}</div>
                  <div className="font-mono text-[10.5px] text-[var(--color-ink-3)]">{e.at}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {job.status === 'printing' && (
          <div className="mt-3 flex gap-2">
            <button className="btn btn-ghost flex-1 justify-center text-[13px]">暂停</button>
            <button className="btn btn-ghost flex-1 justify-center text-[13px] text-[var(--color-brick)]">取消打印</button>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailItem({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-line)] py-1.5">
      <span className="text-[12.5px] text-[var(--color-ink-3)]">{label}</span>
      <span className="flex items-center gap-1.5 font-mono text-[12.5px] text-[var(--color-ink)]">
        {swatch && <span className="h-2.5 w-2.5 rounded-full border border-[var(--color-line-2)]" style={{ background: swatch }} />}
        {value}
      </span>
    </div>
  )
}
