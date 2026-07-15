import { PRINTERS, SPOOLS, PRINT_JOBS } from '@/data/mock'
import type { PrinterDevice, PrinterStatus } from '@/data/types'
import { SectionHead, DataRow, Meter } from '@/components/ui'
import { cn } from '@/lib/cn'

const STATUS: Record<PrinterStatus, { label: string; dot: string; pill: string }> = {
  online: { label: '空闲', dot: 'var(--color-jade)', pill: 'pill-pass' },
  printing: { label: '打印中', dot: 'var(--color-coral)', pill: 'pill-coral' },
  offline: { label: '离线', dot: 'var(--color-ink-3)', pill: 'pill-neutral' },
  error: { label: '异常', dot: 'var(--color-brick)', pill: 'pill-block' },
  low_material: { label: '缺料', dot: 'var(--color-amber)', pill: 'pill-warn' },
}

export default function Devices() {
  return (
    <div className="mx-auto max-w-[1240px] px-6 py-7">
      <SectionHead
        eyebrow="DEVICES · 设备管理"
        title="打印机车间"
        right={
          <div className="flex gap-4 font-mono text-[12px] text-[var(--color-ink-2)]">
            <span>{PRINTERS.filter((p) => p.status === 'printing').length} 打印中</span>
            <span>{PRINTERS.filter((p) => p.status === 'online').length} 空闲</span>
            <span className="text-[var(--color-amber)]">{PRINTERS.filter((p) => p.status === 'low_material' || p.status === 'offline').length} 需关注</span>
          </div>
        }
      />

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {PRINTERS.map((p) => (
          <PrinterCard key={p.id} printer={p} />
        ))}
      </div>
    </div>
  )
}

function PrinterCard({ printer }: { printer: PrinterDevice }) {
  const s = STATUS[printer.status]
  const job = PRINT_JOBS.find((j) => j.id === printer.currentJobId)
  const loadedSpool = SPOOLS[Number(printer.id.slice(-1)) % SPOOLS.length]

  return (
    <article className="card-raised overflow-hidden">
      {/* header */}
      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-line)] p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'grid h-11 w-11 flex-none place-items-center rounded-[5px] border',
              printer.status === 'printing'
                ? 'border-[var(--color-coral)]/30 bg-[var(--color-coral-soft)] text-[var(--color-coral-deep)]'
                : 'border-[var(--color-line)] bg-[var(--color-canvas)] text-[var(--color-ink-2)]',
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="5" width="16" height="14" rx="1.5" /><path d="M8 9h8M8 13h5" />
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-medium leading-tight">{printer.name}</h3>
            <div className="mt-0.5 font-mono text-[11.5px] text-[var(--color-ink-3)]">
              {printer.provider} · {printer.model}
            </div>
          </div>
        </div>
        <span className={cn('pill', s.pill)}>
          <span className="dot" style={{ background: s.dot }}>
            {printer.status === 'printing' && <span className="block h-full w-full animate-ping rounded-full" style={{ background: s.dot, opacity: 0.6 }} />}
          </span>
          {s.label}
        </span>
      </div>

      {/* body */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-0 p-4">
        <DataRow label="构建板" value={`${printer.buildVolumeMm.x}×${printer.buildVolumeMm.y}×${printer.buildVolumeMm.z}`} />
        <DataRow label="喷嘴" value={`⌀ ${printer.nozzleMm} mm`} />
        <DataRow label="装载耗材" value={<span className="inline-flex items-center gap-1.5"><span className="dot" style={{ background: loadedSpool.colorHex, width: 9, height: 9 }} />{loadedSpool.material} {loadedSpool.color}</span>} mono={false} />
        <DataRow label="连接" value={printer.status === 'offline' ? '— 未连接' : 'OctoPrint'} />
      </div>

      {/* current job / action strip */}
      {job && printer.status === 'printing' ? (
        <div className="border-t border-[var(--color-line)] bg-[var(--color-canvas)]/50 p-4">
          <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
            <span className="text-[var(--color-ink-2)]">正在打印 · {job.projectTitle}</span>
            <span className="font-mono tnum text-[var(--color-coral-deep)]">{job.progressPct}% · 剩 {job.etaMinutes}min</span>
          </div>
          <Meter value={job.progressPct} color="var(--color-coral)" height={7} />
        </div>
      ) : printer.status === 'offline' ? (
        <div className="flex items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-canvas)]/50 p-4 text-[12.5px] text-[var(--color-ink-3)]">
          设备离线，任务将以导出文件方式兜底
          <button className="btn btn-ghost text-[12.5px]">重新连接</button>
        </div>
      ) : printer.status === 'low_material' ? (
        <div className="flex items-center justify-between border-t border-[var(--color-amber)]/30 bg-[var(--color-amber-soft)]/40 p-4 text-[12.5px] text-[#8a5a0f]">
          耗材余量偏低，建议换料后再排任务
          <button className="btn btn-ghost text-[12.5px]">去换料</button>
        </div>
      ) : (
        <div className="flex items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-canvas)]/50 p-4 text-[12.5px] text-[var(--color-ink-3)]">
          空闲中，可接收新任务
          <button className="btn btn-primary text-[12.5px]">发送任务</button>
        </div>
      )}
    </article>
  )
}
