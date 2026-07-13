import { Link } from 'react-router-dom'
import { PROJECTS, SOURCE_LABELS } from '@/data/mock'
import type { Project, ProjectStatus } from '@/data/types'
import { PipelineRail } from '@/components/PipelineRail'
import { SectionHead } from '@/components/ui'
import { cn } from '@/lib/cn'

// Status → chip color, novice-facing label. Grouped by lifecycle phase.
const STATUS_META: Record<string, { label: string; cls: string }> = {
  needs_repair: { label: '待修复', cls: 'pill-block' },
  ready_to_slice: { label: '可切片', cls: 'pill-steel' },
  queued: { label: '排队中', cls: 'pill-neutral' },
  printing: { label: '打印中', cls: 'pill-coral' },
  picked_up: { label: '已取件', cls: 'pill-pass' },
  completed: { label: '已完成', cls: 'pill-pass' },
  failed: { label: '已失败', cls: 'pill-block' },
}

export default function Projects() {
  return (
    <div className="mx-auto max-w-[1160px] px-6 py-7">
      <SectionHead
        eyebrow="MY PROJECTS · 创作项目"
        title={<>我的项目<span className="ml-2 font-mono text-[15px] text-[var(--color-ink-3)] tnum">{PROJECTS.length}</span></>}
        right={
          <Link to="/" className="btn btn-primary">
            新建创作
          </Link>
        }
      />

      <p className="mt-2 max-w-[560px] text-[13.5px] text-[var(--color-ink-2)]">
        每个项目都保留完整的版本历史与流程轨迹。修改需求会创建新版本，旧版本随时可回退。
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {PROJECTS.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const src = SOURCE_LABELS[project.sourceType]
  const status = STATUS_META[project.status] ?? { label: project.status, cls: 'pill-neutral' }
  const revCount = project.revisions.length

  return (
    <div className="card-raised flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5">
      <div className="flex gap-4 p-4">
        {/* thumbnail — the model's signature color as a printed swatch */}
        <div
          className="relative h-[92px] w-[92px] flex-none overflow-hidden rounded-[3px] border border-[var(--color-line)]"
          style={{
            background: `linear-gradient(150deg, ${project.thumbnail}, ${project.thumbnail}cc)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.4) 3px 4px)',
            }}
          />
          <span className="absolute bottom-1 right-1.5 font-mono text-[9px] text-white/80">{project.id}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[15.5px] font-display font-semibold leading-tight">{project.title}</h3>
            <span className={cn('pill flex-none', status.cls)}>{status.label}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--color-ink-3)]">
            <span>{src.icon}</span>
            <span>{src.label}</span>
            <span className="text-[var(--color-line-2)]">·</span>
            <span className="font-mono">{project.updatedAt}</span>
          </div>
          {revCount > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              {project.revisions.map((r) => (
                <span
                  key={r.id}
                  className={cn(
                    'font-mono text-[10px] px-1.5 py-0.5 rounded border',
                    r.id === project.activeRevisionId
                      ? 'border-[var(--color-coral)] text-[var(--color-coral-deep)] bg-[var(--color-coral-soft)]'
                      : 'border-[var(--color-line-2)] text-[var(--color-ink-3)]',
                  )}
                  title={r.note}
                >
                  {r.label}
                </span>
              ))}
              <span className="text-[11px] text-[var(--color-ink-3)]">{revCount} 个版本</span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
        <PipelineRail stages={project.stages} orientation="horizontal" />
      </div>

      <div className="flex border-t border-[var(--color-line)]">
        <CardAction to={cardLink(project.status)} primary>
          {cardCta(project.status)}
        </CardAction>
        <CardAction to="/projects">查看版本</CardAction>
      </div>
    </div>
  )
}

function cardLink(status: ProjectStatus): string {
  if (status === 'needs_repair') return '/audit'
  if (status === 'ready_to_slice') return '/slice'
  if (status === 'queued' || status === 'printing' || status === 'failed') return '/jobs'
  return '/'
}

function cardCta(status: ProjectStatus): string {
  if (status === 'needs_repair') return '去修复'
  if (status === 'ready_to_slice') return '去切片'
  if (status === 'queued' || status === 'printing') return '看打印'
  if (status === 'failed') return '排查失败'
  if (status === 'picked_up') return '再打一版'
  return '继续'
}

function CardAction({ to, children, primary }: { to: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        'flex-1 py-2.5 text-center text-[13px] font-medium transition-colors border-r border-[var(--color-line)] last:border-r-0',
        primary
          ? 'text-[var(--color-coral-deep)] hover:bg-[var(--color-coral-soft)]'
          : 'text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)]',
      )}
    >
      {children}
    </Link>
  )
}
