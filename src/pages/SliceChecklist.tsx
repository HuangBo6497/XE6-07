import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModelViewer } from '@/components/ModelViewer'
import { DataRow, Meter } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SLICE_PROFILES, PRINTERS, SPOOLS, HERO_PROJECT } from '@/data/mock'
import type { SliceProfile } from '@/data/types'

// 切片与打印清单 — PRD §15.3. Choose 省时间/省材料/稳妥, review the slice
// report, then confirm the PrintChecklist. No confirmation → no send (§8.1
// P0-F18). Offline printers can only export a file (§15.3).

function fmtMin(m: number) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}h ${min}m` : `${min}m`
}

export default function SliceChecklist() {
  const nav = useNavigate()
  const [mode, setMode] = useState<SliceProfile['mode']>('safe')
  const [printerId, setPrinterId] = useState('prn-02')
  const [confirmed, setConfirmed] = useState(false)
  const [risksAck, setRisksAck] = useState(false)

  const profile = SLICE_PROFILES.find((p) => p.mode === mode)!
  const printer = PRINTERS.find((p) => p.id === printerId)!
  const spool = SPOOLS[0]
  const printerOffline = printer.status === 'offline'
  const enoughMaterial = spool.remainingGram >= profile.filamentGram
  const canConfirm = risksAck && enoughMaterial && !printerOffline

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_380px] max-[1000px]:grid-cols-1">
      {/* ── Left: slice options + report ────────────────────────────── */}
      <div className="p-6">
        <div className="eyebrow mb-1.5">切片方案 · SliceJob v0 · Bambu Studio CLI</div>
        <h2 className="text-[20px] leading-tight mb-1">{HERO_PROJECT.title}</h2>
        <p className="text-[13px] text-[var(--color-ink-2)] mb-5">
          不用懂参数，选一个偏好就行。三档都基于保守模板，Agent 已经帮你调好。
        </p>

        {/* three profiles */}
        <div className="grid grid-cols-3 gap-3 mb-6 max-[560px]:grid-cols-1">
          {SLICE_PROFILES.map((p) => {
            const on = p.mode === mode
            return (
              <button
                key={p.mode}
                onClick={() => setMode(p.mode)}
                className={cn(
                  'text-left rounded-[4px] border p-4 transition-all relative overflow-hidden',
                  on
                    ? 'border-[var(--color-coral)] bg-[var(--color-surface-2)] shadow-[0_0_0_3px_var(--color-coral-soft)]'
                    : 'border-[var(--color-line-2)] bg-[var(--color-surface)] hover:border-[var(--color-ink-3)]',
                )}
              >
                {p.recommended && (
                  <span className="absolute top-0 right-0 pill pill-coral rounded-none rounded-bl-[4px] text-[10px] py-1">
                    新手推荐
                  </span>
                )}
                <div className="font-display text-[17px] font-semibold">{p.label}</div>
                <div className="text-[12px] text-[var(--color-ink-3)] mb-3">{p.tagline}</div>
                <div className="space-y-1 font-mono text-[12px] text-[var(--color-ink-2)] tnum">
                  <div className="flex justify-between"><span>耗时</span><span>{fmtMin(p.estMinutes)}</span></div>
                  <div className="flex justify-between"><span>耗材</span><span>{p.filamentGram}g</span></div>
                  <div className="flex justify-between"><span>费用</span><span>¥{p.costYuan.toFixed(1)}</span></div>
                </div>
              </button>
            )
          })}
        </div>

        {/* slice report */}
        <div className="eyebrow mb-2">切片报告 · 切片审计已通过</div>
        <div className="card p-4 grid grid-cols-2 gap-x-8 gap-y-0 max-[560px]:grid-cols-1">
          <DataRow label="层高" value={`${profile.layerHeightMm} mm`} />
          <DataRow label="填充率" value={`${profile.infillPct}%`} />
          <DataRow label="支撑" value={profile.supports ? '需要（自动生成）' : '免支撑'} />
          <DataRow label="预计耗时" value={fmtMin(profile.estMinutes)} />
          <DataRow label="预计耗材" value={`${profile.filamentGram} g`} />
          <DataRow label="首层附着" value="良好" />
          <DataRow label="构建板范围" value="48×32mm / 在范围内" />
          <DataRow label="G-code" value="已生成 · 校验通过" />
        </div>

        <div className="flex items-start gap-2 mt-4 text-[12.5px] text-[var(--color-ink-3)]">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="flex-none mt-0.5">
            <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          切片仅在通过可打印审计的模型上运行；几何若有改动，此报告会自动失效并要求重新切片。
        </div>
      </div>

      {/* ── Right: PrintChecklist ───────────────────────────────────── */}
      <div className="border-l border-[var(--color-line)] bg-[var(--color-surface)] flex flex-col">
        <div className="relative h-[240px] flex-none border-b border-[var(--color-line)]">
          <ModelViewer color="#5B7C99" />
          <div className="absolute left-3 bottom-3 pill pill-neutral font-mono">构建板预览 · {printer.model}</div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="eyebrow mb-3">打印清单 · PrintChecklist</div>

          {/* printer picker */}
          <label className="block text-[12px] text-[var(--color-ink-3)] mb-1.5">打印机</label>
          <div className="space-y-1.5 mb-4">
            {PRINTERS.map((p) => {
              const on = p.id === printerId
              const off = p.status === 'offline'
              return (
                <button
                  key={p.id}
                  onClick={() => setPrinterId(p.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-[4px] border px-3 py-2 text-left transition-all',
                    on ? 'border-[var(--color-ink)] bg-[var(--color-surface-2)]' : 'border-[var(--color-line)] hover:border-[var(--color-ink-3)]',
                    off && 'opacity-60',
                  )}
                >
                  <span
                    className="dot flex-none"
                    style={{
                      background:
                        p.status === 'online' ? 'var(--color-jade)'
                        : p.status === 'printing' ? 'var(--color-coral)'
                        : p.status === 'low_material' ? 'var(--color-amber)'
                        : 'var(--color-ink-3)',
                    }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] truncate">{p.name}</span>
                    <span className="block font-mono text-[10.5px] text-[var(--color-ink-3)]">{p.provider} {p.model}</span>
                  </span>
                  {off && <span className="pill pill-neutral text-[10px]">离线</span>}
                </button>
              )
            })}
          </div>

          {/* checklist rows */}
          <div className="card-raised p-3.5 space-y-0 mb-4">
            <DataRow label="打印机" value={printer.name} mono={false} />
            <DataRow label="耗材" value={`${spool.material} · ${spool.color}`} mono={false} />
            <DataRow label="耗材余量" value={`${spool.remainingGram}g / 需 ${profile.filamentGram}g`} />
            <DataRow label="预计耗时" value={fmtMin(profile.estMinutes)} />
            <DataRow label="预计费用" value={`¥${profile.costYuan.toFixed(1)}`} />
          </div>

          {/* risks */}
          <div className="eyebrow mb-2">风险提示</div>
          <ul className="space-y-1.5 mb-4">
            <RiskItem tone={enoughMaterial ? 'ok' : 'block'}>
              {enoughMaterial ? '耗材余量充足' : `耗材不足，剩 ${spool.remainingGram}g`}
            </RiskItem>
            {profile.supports && <RiskItem tone="warn">含支撑结构，取件后需手动剥离</RiskItem>}
            <RiskItem tone={printerOffline ? 'block' : 'ok'}>
              {printerOffline ? '打印机离线，只能导出文件' : '打印机在线，可发送'}
            </RiskItem>
            <RiskItem tone="warn">成品为玩具/摆件级，不承诺承重与安全用途</RiskItem>
          </ul>

          {/* material meter */}
          <div className="mb-1 flex justify-between text-[11.5px] font-mono text-[var(--color-ink-3)]">
            <span>{spool.color} 余量</span>
            <span className={enoughMaterial ? '' : 'text-[var(--color-brick)]'}>{spool.remainingGram}g</span>
          </div>
          <Meter
            value={spool.remainingGram}
            max={spool.totalGram}
            color={enoughMaterial ? spool.colorHex : 'var(--color-brick)'}
          />
        </div>

        {/* confirmation gate */}
        <div className="border-t border-[var(--color-line)] p-4 bg-[var(--color-surface-2)]">
          {!confirmed ? (
            <>
              <label className="flex items-start gap-2.5 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={risksAck}
                  onChange={(e) => setRisksAck(e.target.checked)}
                  className="mt-0.5 accent-[var(--color-coral)]"
                  style={{ width: 16, height: 16 }}
                />
                <span className="text-[12.5px] text-[var(--color-ink-2)] leading-snug">
                  我已确认打印机、耗材、耗时、费用与风险，同意开始物理打印。
                </span>
              </label>
              {printerOffline ? (
                <button className="btn btn-ghost w-full justify-center">
                  ↓ 导出切片文件（设备离线）
                </button>
              ) : (
                <button
                  className={cn('btn w-full justify-center', canConfirm ? 'btn-primary' : 'btn-ghost opacity-50 cursor-not-allowed')}
                  disabled={!canConfirm}
                  onClick={() => setConfirmed(true)}
                >
                  确认清单并发送打印
                </button>
              )}
              <p className="text-[11px] text-[var(--color-ink-3)] text-center mt-2 font-mono">
                无确认记录不允许发送到设备
              </p>
            </>
          ) : (
            <div className="text-center py-1">
              <div className="flex items-center justify-center gap-2 text-[var(--color-jade)] mb-1.5">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                  <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-display font-semibold text-[14px]">已确认，任务已发送</span>
              </div>
              <p className="text-[11.5px] text-[var(--color-ink-3)] font-mono mb-3">
                confirmedAt · {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · 已记录
              </p>
              <button className="btn btn-primary w-full justify-center" onClick={() => nav('/prints')}>
                查看打印任务 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RiskItem({ tone, children }: { tone: 'ok' | 'warn' | 'block'; children: React.ReactNode }) {
  const color =
    tone === 'ok' ? 'var(--color-jade)' : tone === 'warn' ? 'var(--color-amber)' : 'var(--color-brick)'
  return (
    <li className="flex items-start gap-2 text-[12.5px] text-[var(--color-ink-2)]">
      <span className="dot mt-1.5 flex-none" style={{ background: color }} />
      {children}
    </li>
  )
}
