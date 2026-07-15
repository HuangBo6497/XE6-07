import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModelViewer } from '@/components/ModelViewer'
import { PipelineRail } from '@/components/PipelineRail'
import { DataRow, Meter } from '@/components/ui'
import type { StageNode, StageState } from '@/data/types'
import { HERO_PROJECT, PRINTERS } from '@/data/mock'
import { cn } from '@/lib/cn'

type FlowStatus = 'style_select' | 'image_review' | 'concept_select' | 'generating' | 'review' | 'refine_input' | 'refining' | 'final' | 'confirm_print' | 'queued'
type ModelVersionId = 'v0' | 'v1' | 'v2'
type ChatRole = 'user' | 'assistant'
type PendingAiReply = 'style' | 'variants' | 'generation' | 'refine' | null

interface DemoModelVersion {
  id: ModelVersionId
  label: string
  name: string
  note: string
  color: string
  score: number
  triangles: number
  fileSize: string
  createdAt: string
}

interface ExtraMessage {
  id: number
  role: ChatRole
  text: string
  time: string
}

const STYLES = [
  { name: '未来机甲', note: '硬表面装甲、冷色灯带、战术切面', color: '#7468ef' },
  { name: '圆润潮玩', note: '亲和比例、软边曲面、收藏玩具质感', color: '#5abbdc' },
  { name: '极简几何', note: '清晰大轮廓、低面结构、适合快速打印', color: '#8895d7' },
  { name: '生物仿生', note: '有机骨骼、鳞片层次、机械与生命融合', color: '#65bfae' },
  { name: '复古未来', note: '太空时代曲线、乳白外壳、暖色点缀', color: '#e29f75' },
  { name: '透明晶体', note: '半透明外壳、发光核心、晶体切割细节', color: '#78a9ef' },
]

const CONCEPTS = [
  { id: 'A', name: '装甲先锋', note: '锐利头冠与外露装甲，战斗感最强', colors: ['#6256de', '#63c8f4', '#eef0ff'] },
  { id: 'B', name: '流光核心', note: '结构均衡、发光胸腔，适合桌面摆件', colors: ['#7567e8', '#75ddf0', '#eeeaff'] },
  { id: 'C', name: '模块幼龙', note: '比例更可爱、四足更稳，打印成功率更高', colors: ['#4f91df', '#74ddc7', '#ecf9ff'] },
]

const MODEL_VERSIONS: DemoModelVersion[] = [
  { id: 'v0', label: 'V0', name: 'AI 引导草模', note: '会话开始时的可旋转结构示意', color: '#9A91D7', score: 78, triangles: 21840, fileSize: '4.2 MB', createdAt: '14:21' },
  { id: 'v1', label: 'V1', name: '流光核心模型', note: 'B 版图片生成 · 当前方案', color: '#7567E8', score: 92, triangles: 68420, fileSize: '8.6 MB', createdAt: '14:28' },
  { id: 'v2', label: 'V2', name: '科技环优化模型', note: '圆润头部 · 加粗尾巴', color: '#55AFC5', score: 96, triangles: 76840, fileSize: '9.4 MB', createdAt: '14:34' },
]

const DEMO_SESSION = {
  id: 'AI-3D-0714-0286',
  owner: '林默',
  savedAt: '刚刚自动保存',
  imageJob: 'IMG-240714-018',
  modelJob: 'MESH-240714-052',
}

const STATUS_META: Record<FlowStatus, { label: string; detail: string; tone: string }> = {
  style_select: { label: '等待用户选择风格', detail: 'AI 已理解主体和用途，正在等待用户选择推荐风格或输入自定义风格。', tone: 'pill-coral' },
  image_review: { label: '等待确认概念图', detail: '首张 3D 风格预览已生成，用户可以接受、要求三版重绘或补充修改意见。', tone: 'pill-warn' },
  concept_select: { label: '等待选择图片方案', detail: '三版差异化概念图已生成，选定一版后才会开始构建模型。', tone: 'pill-coral' },
  generating: { label: '正在生成 3D 模型', detail: '正在解析轮廓、建立结构并进行可打印性检测。', tone: 'pill-steel' },
  review: { label: '等待确认模型', detail: '模型已生成。确认打印或继续补充要求，系统不会自动开始打印。', tone: 'pill-warn' },
  refine_input: { label: '等待补充优化要求', detail: '请在当前模型下方描述需要调整的细节。', tone: 'pill-coral' },
  refining: { label: '正在生成优化版', detail: '保留已确认结构，仅重算用户指定的局部细节。', tone: 'pill-steel' },
  final: { label: '优化版已完成', detail: '最新模型已同步到右侧预览和“我的模型”。', tone: 'pill-pass' },
  confirm_print: { label: '等待打印确认', detail: '需要再次确认设备、材料和模型版本后才会进入队列。', tone: 'pill-warn' },
  queued: { label: '已加入打印队列', detail: '已完成用户确认，可前往打印任务查看排队状态。', tone: 'pill-pass' },
}

const timeNow = () => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())

export default function Workbench() {
  const nav = useNavigate()
  const project = HERO_PROJECT
  const revision = project.revisions.find((item) => item.id === project.activeRevisionId)!
  const printer = PRINTERS[0]
  const chatEndRef = useRef<HTMLDivElement>(null)
  const aiReplyTimerRef = useRef<number | null>(null)
  const [selectedStyle, setSelectedStyle] = useState(0)
  const [styleBatch, setStyleBatch] = useState(0)
  const [customStyle, setCustomStyle] = useState('')
  const [confirmedStyle, setConfirmedStyle] = useState('')
  const [selectedConcept, setSelectedConcept] = useState(1)
  const [status, setStatus] = useState<FlowStatus>('style_select')
  const [progress, setProgress] = useState(0)
  const [hasV1, setHasV1] = useState(false)
  const [hasV2, setHasV2] = useState(false)
  const [activeModel, setActiveModel] = useState<ModelVersionId>('v0')
  const [refineSource, setRefineSource] = useState<ModelVersionId>('v1')
  const [printTarget, setPrintTarget] = useState<ModelVersionId>('v1')
  const [refineText, setRefineText] = useState('头部更圆润一点，尾巴加粗，底座改成半透明的科技环。')
  const [submittedRefineText, setSubmittedRefineText] = useState('')
  const [extraMessages, setExtraMessages] = useState<ExtraMessage[]>([])
  const [composerText, setComposerText] = useState('')
  const [replying, setReplying] = useState(false)
  const [pendingAiReply, setPendingAiReply] = useState<PendingAiReply>(null)
  const [variantRequested, setVariantRequested] = useState(false)
  const [generationRequested, setGenerationRequested] = useState(false)

  useEffect(() => () => {
    if (aiReplyTimerRef.current !== null) window.clearTimeout(aiReplyTimerRef.current)
  }, [])

  useEffect(() => {
    if (status !== 'generating' && status !== 'refining') return
    setProgress(6)
    const timer = window.setInterval(() => {
      setProgress((value) => {
        const next = Math.min(value + Math.ceil(Math.random() * 9), 100)
        if (next >= 100) {
          window.clearInterval(timer)
          window.setTimeout(() => {
            if (status === 'refining') {
              setHasV2(true)
              setActiveModel('v2')
              setStatus('final')
            } else {
              setHasV1(true)
              setActiveModel('v1')
              setStatus('review')
            }
          }, 450)
        }
        return next
      })
    }, 260)
    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' })
  }, [status, extraMessages.length, replying])

  const availableModels = useMemo(
    () => MODEL_VERSIONS.filter((model) => model.id === 'v0' || (model.id === 'v1' && hasV1) || (model.id === 'v2' && hasV2)),
    [hasV1, hasV2],
  )
  const activeModelMeta = availableModels.find((model) => model.id === activeModel) ?? MODEL_VERSIONS[0]
  const latestModel = hasV2 ? MODEL_VERSIONS[2] : hasV1 ? MODEL_VERSIONS[1] : MODEL_VERSIONS[0]
  const printModel = MODEL_VERSIONS.find((model) => model.id === printTarget) ?? latestModel
  const stages = useMemo(() => buildStages(status, hasV1, hasV2), [status, hasV1, hasV2])
  const statusMeta = STATUS_META[status]
  const busy = status === 'generating' || status === 'refining' || replying || pendingAiReply !== null
  const hasStyleResult = Boolean(confirmedStyle)
  const hasVariants = !['style_select', 'image_review'].includes(status)
  const hasGeneration = !['style_select', 'image_review', 'concept_select'].includes(status)

  const scheduleAiReply = (kind: Exclude<PendingAiReply, null>, action: () => void) => {
    if (busy) return
    if (aiReplyTimerRef.current !== null) window.clearTimeout(aiReplyTimerRef.current)
    setPendingAiReply(kind)
    aiReplyTimerRef.current = window.setTimeout(() => {
      action()
      setPendingAiReply(null)
      aiReplyTimerRef.current = null
    }, 4000)
  }

  const confirmRecommendedStyle = () => {
    if (busy) return
    setConfirmedStyle(STYLES[selectedStyle].name)
    scheduleAiReply('style', () => setStatus('image_review'))
  }

  const confirmCustomStyle = () => {
    const value = customStyle.trim()
    if (!value || busy) return
    setConfirmedStyle(value)
    scheduleAiReply('style', () => setStatus('image_review'))
  }

  const requestVariants = () => {
    if (busy) return
    setVariantRequested(true)
    scheduleAiReply('variants', () => setStatus('concept_select'))
  }

  const startModelGeneration = () => {
    if (busy) return
    setGenerationRequested(true)
    scheduleAiReply('generation', () => {
      setSubmittedRefineText('')
      setHasV1(false)
      setHasV2(false)
      setActiveModel('v0')
      setStatus('generating')
    })
  }

  const requestRefine = (version: ModelVersionId) => {
    setRefineSource(version)
    setActiveModel(version)
    setStatus('refine_input')
  }

  const requestPrint = (version: ModelVersionId) => {
    setPrintTarget(version)
    setActiveModel(version)
    setStatus('confirm_print')
  }

  const startRefining = () => {
    const content = refineText.trim()
    if (!content || busy) return
    setSubmittedRefineText(content)
    scheduleAiReply('refine', () => setStatus('refining'))
  }

  const sendComposerMessage = () => {
    const text = composerText.trim()
    if (!text || busy) return
    const userMessage: ExtraMessage = { id: Date.now(), role: 'user', text, time: timeNow() }
    setExtraMessages((items) => [...items, userMessage])
    setComposerText('')
    setReplying(true)
    window.setTimeout(() => {
      const reply = text.includes('风格')
        ? '可以。你可以直接描述想要的风格、上传参考图，或者点击“换一批风格”。我会保留机械龙和桌面摆件这两个已确认条件。'
        : text.includes('打印')
          ? '打印不会自动开始。模型生成并通过检测后，我会再让你确认设备、材料和模型版本。'
          : '收到，我已经把这条补充记录到当前创作会话。你可以继续描述，也可以使用上方卡片推进下一步。'
      setExtraMessages((items) => [...items, { id: Date.now() + 1, role: 'assistant', text: reply, time: timeNow() }])
      setReplying(false)
    }, 4000)
  }

  return (
    <div className="grid h-[calc(100vh-72px)] grid-cols-[258px_minmax(0,1fr)_400px] grid-rows-[minmax(0,1fr)] gap-4 overflow-hidden p-4 max-[1260px]:grid-cols-[235px_minmax(0,1fr)] max-[900px]:h-auto max-[900px]:grid-cols-1 max-[900px]:grid-rows-none max-[900px]:overflow-visible">
      <aside className="card-raised overflow-y-auto rounded-[22px] p-5 max-[900px]:order-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="eyebrow mb-1">当前项目</div>
            <h2 className="text-[17px] leading-tight">{project.title}</h2>
            <div className="mt-1 font-mono text-[10.5px] text-[var(--color-ink-3)]">{DEMO_SESSION.id} · {DEMO_SESSION.savedAt}</div>
          </div>
          <span className={cn('pill flex-none', statusMeta.tone)}>{statusMeta.label}</span>
        </div>

        <div className="my-4 rounded-[16px] border border-white bg-gradient-to-br from-[#f1edff] via-white to-[#ebf7ff] p-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-semibold">最后一步状态</span>
            <span className="font-mono text-[10px] text-[var(--color-coral-deep)]">LIVE</span>
          </div>
          <div className="mt-2 text-[13px] font-semibold text-[var(--color-coral-deep)]">{statusMeta.label}</div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--color-ink-2)]">{statusMeta.detail}</p>
          {(status === 'generating' || status === 'refining') && <div className="mt-3"><Meter value={progress} color="linear-gradient(90deg,#806cf6,#51b7f7)" height={7} /></div>}
        </div>

        <div className="eyebrow mb-3">AI 创作流程</div>
        <PipelineRail stages={stages} />

        <div className="mt-6 flex items-center justify-between">
          <div className="eyebrow">我的模型</div>
          <span className="font-mono text-[10px] text-[var(--color-ink-3)]">{availableModels.length} 个版本</span>
        </div>
        <div className="mt-2.5 space-y-2">
          {availableModels.map((model) => (
            <ModelVersionItem key={model.id} label={`${model.label} · ${model.name}`} note={`${model.createdAt} · ${model.fileSize}`} color={model.color} active={activeModel === model.id} onClick={() => setActiveModel(model.id)} />
          ))}
        </div>
        <button className="btn btn-ghost mt-3 w-full" onClick={() => nav('/projects')}>查看全部项目与模型</button>
      </aside>

      <section className="card-raised flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[22px] max-[900px]:order-1 max-[900px]:h-[820px]">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-white/60 px-6 py-3.5">
          <div>
            <div className="eyebrow">AI DESIGN COPILOT</div>
            <div className="mt-0.5 text-[13px] font-semibold">真实对话式 3D 创作工作台</div>
          </div>
          <span className={cn('pill', statusMeta.tone)}><span className="dot" style={{ background: status === 'queued' || status === 'final' ? 'var(--color-jade)' : 'var(--color-coral)' }} />{statusMeta.label}</span>
        </div>

        <div className="isolate flex-1 overflow-y-auto bg-gradient-to-b from-white/35 via-[#fafaff]/55 to-[#f0f7ff]/62 px-6 py-6">
          <div className="mx-auto max-w-[760px] space-y-5">
            <ConversationDivider label="今天 14:20 · 用户发起新创作" />

            <UserMessage time="14:20">我想做一个桌面机械龙摆件，整体要有科技感，但我还没想好具体风格和细节。</UserMessage>

            <AgentMessage time="14:20" badge="AI 需求理解" text="我先确认一下：你想做一只适合桌面陈列、能够 3D 打印的机械龙。主体和用途已经明确，现在只差视觉风格与配色。你可以选一个推荐方向，也可以完全按自己的想法描述。">
              <IntentInsight />
              <StyleGuide
                selected={selectedStyle}
                batch={styleBatch}
                customStyle={customStyle}
                onSelect={setSelectedStyle}
                onBatchChange={() => setStyleBatch((value) => (value + 1) % 2)}
                onCustomStyle={setCustomStyle}
                onConfirm={confirmRecommendedStyle}
                onConfirmCustom={confirmCustomStyle}
                disabled={Boolean(confirmedStyle) || busy}
              />
            </AgentMessage>

            {hasStyleResult && (
              <>
                <UserMessage time="14:21">我想要“{confirmedStyle}”，主色用蓝紫色，尺寸控制在 15 厘米左右。如果后面效果不对，我还会继续调整。</UserMessage>
                {pendingAiReply === 'style'
                  ? <TypingMessage label="AI 正在理解风格并准备图片…" />
                  : <AgentMessage time="14:21" badge="3D 图片预览" text="收到。下面是第一张造型预览，它只用于确认视觉方向，不会直接生成模型或自动打印。你可以接受，也可以让我重新生成三版，或者直接在输入框里补充修改意见。">
                      <SingleConceptPreview />
                      {status === 'image_review' && (
                        <div className="mt-3 grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
                          <button className="btn btn-primary" onClick={startModelGeneration}><SparkIcon />这版可以，生成模型</button>
                          <button className="btn btn-ghost" onClick={requestVariants}>不够满意，重新生成 3 版</button>
                        </div>
                      )}
                    </AgentMessage>}
              </>
            )}

            {(variantRequested || hasVariants) && (
              <>
                <UserMessage time="14:23">第一版的轮廓太普通了，不够像真正的 3D 产品渲染。保留蓝紫色，再给我三版差异更大的方案。</UserMessage>
                {pendingAiReply === 'variants'
                  ? <TypingMessage label="AI 正在重新构思并生成 3 个方向…" />
                  : <AgentMessage time="14:23" badge="3 版 3D 概念图" text="已保留机械龙、蓝紫配色与桌面摆件尺寸，并强化材质、灯光和空间感。三版分别偏战斗、均衡和可爱，你可以点击大图选择。">
                      <ConceptGrid selected={selectedConcept} onSelect={setSelectedConcept} />
                      {status === 'concept_select' && (
                        <button className="btn btn-primary mt-3 w-full" onClick={startModelGeneration}>
                          <SparkIcon />确定 {CONCEPTS[selectedConcept].id} 版并生成 3D 模型
                        </button>
                      )}
                    </AgentMessage>}
              </>
            )}

            {(generationRequested || hasGeneration) && (
              <>
                <UserMessage time="14:25">{variantRequested ? `我选择 ${CONCEPTS[selectedConcept].id} 版“${CONCEPTS[selectedConcept].name}”，继续生成可打印的 3D 模型。` : '第一张方向预览可以，就按这一版继续生成可打印的 3D 模型。'}</UserMessage>
                {pendingAiReply === 'generation'
                  ? <TypingMessage label="AI 正在分析图片结构，准备开始建模…" />
                  : <AgentMessage time="14:25" badge="模型生成进度" text={status === 'generating' ? '正在把二维概念图转换成可编辑、可打印的模型，并同步执行结构检测。' : '模型生成流程已完成，每一步都保留了状态记录。'}>
                      <GenerationProgress progress={status === 'generating' ? progress : 100} mode="generate" />
                    </AgentMessage>}
              </>
            )}

            {hasV1 && status !== 'generating' && (
              <AgentMessage time="14:28" badge="3D 模型结果" text="V1 已生成：聊天中展示模型结果，右上方模型版型区也已同步。右侧模型可以按住拖动旋转、滚轮缩放。只有你主动确认后，系统才会准备打印。">
                <ModelResultCard version="V1" modelVersion="v1" color="#7567E8" selectedConcept={CONCEPTS[selectedConcept].name} compact={hasV2} onConfirm={() => requestPrint('v1')} onRefine={() => requestRefine('v1')} actions={status === 'review'} />
                {status === 'refine_input' && refineSource === 'v1' && <RefineComposer value={refineText} onChange={setRefineText} onSubmit={startRefining} />}
                {status === 'confirm_print' && printTarget === 'v1' && <PrintConfirmCard printer={printer.name} version={printModel.label} onCancel={() => setStatus(hasV2 ? 'final' : 'review')} onConfirm={() => setStatus('queued')} />}
              </AgentMessage>
            )}

            {(pendingAiReply === 'refine' || status === 'refining' || hasV2) && (
              <>
                <UserMessage time="14:31">{submittedRefineText || refineText}</UserMessage>
                {pendingAiReply === 'refine'
                  ? <TypingMessage label="AI 正在理解你的修改要求…" />
                  : <AgentMessage time="14:32" badge={status === 'refining' ? '模型优化进度' : '优化模型结果'} text={status === 'refining' ? `已收到补充要求，正在基于 ${refineSource.toUpperCase()} 创建新版本，原模型会完整保留。` : 'V2 已完成：主体结构不变，头部、尾巴和科技环底座已按你的要求调整。'}>
                      {status === 'refining'
                        ? <GenerationProgress progress={progress} mode="refine" />
                        : <>
                            <ModelResultCard version="V2 · 最终版" modelVersion="v2" color="#55AFC5" selectedConcept="局部优化完成" onConfirm={() => requestPrint('v2')} onRefine={() => requestRefine('v2')} actions={status === 'final'} />
                            {status === 'refine_input' && refineSource === 'v2' && <RefineComposer value={refineText} onChange={setRefineText} onSubmit={startRefining} />}
                            {status === 'confirm_print' && printTarget === 'v2' && <PrintConfirmCard printer={printer.name} version={printModel.label} onCancel={() => setStatus('final')} onConfirm={() => setStatus('queued')} />}
                          </>}
                    </AgentMessage>}
              </>
            )}

            {status === 'queued' && (
              <AgentMessage time="14:35" badge="打印任务" text={`已完成二次确认，${printModel.label} 模型已加入打印队列。现在可以前往打印任务查看排队、设备和材料状态。`}>
                <div className="rounded-[16px] border border-[var(--color-jade)]/20 bg-[var(--color-jade-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div><div className="text-[13px] font-semibold text-[#08795a]">打印任务已创建</div><div className="mt-1 font-mono text-[10.5px] text-[var(--color-ink-3)]">JOB-2026-0714 · {printModel.label} · PLA · 02h 18m · ¥18.60</div></div>
                    <button className="btn btn-ghost" onClick={() => nav('/prints')}>查看任务</button>
                  </div>
                </div>
              </AgentMessage>
            )}

            {extraMessages.map((message) => message.role === 'user'
              ? <UserMessage key={message.id} time={message.time}>{message.text}</UserMessage>
              : <AgentMessage key={message.id} time={message.time} badge="AI 回复" text={message.text} />)}
            {replying && <TypingMessage />}
            <div ref={chatEndRef} />
          </div>
        </div>

        <GlobalComposer value={composerText} onChange={setComposerText} onSubmit={sendComposerMessage} disabled={busy} />
      </section>

      <aside className="card-raised flex flex-col overflow-y-auto rounded-[22px] max-[1260px]:hidden">
        <div className="flex h-[58px] flex-none items-center justify-between border-b border-[var(--color-line)] bg-white/72 px-4">
          <div><div className="eyebrow">模型版型区</div><div className="mt-0.5 text-[12px] font-semibold">真实 3D 几何 · 支持拖动旋转</div></div>
          <span className="pill pill-steel"><span className="dot" style={{ background: 'var(--color-steel)' }} />3D LIVE</span>
        </div>
        <div className="relative h-[330px] flex-none overflow-hidden border-b border-[var(--color-line)] bg-gradient-to-br from-[#f1efff] via-[#eef6ff] to-[#eafaff]">
          <ModelViewer color={activeModelMeta.color} version={activeModel} />
          <div className="pointer-events-none absolute left-3 top-3 pill pill-neutral">按住拖动旋转 · 滚轮缩放</div>
          <div className="pointer-events-none absolute right-3 top-3 pill pill-coral">{activeModelMeta.label} · {activeModelMeta.score} 分</div>
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-[14px] border border-white/75 bg-white/76 px-3 py-2.5 shadow-sm backdrop-blur-xl">
            <div><div className="text-[12px] font-semibold">{activeModelMeta.name}</div><div className="font-mono text-[9.5px] text-[var(--color-ink-3)]">{activeModelMeta.triangles.toLocaleString()} TRI · {activeModelMeta.fileSize} · {activeModelMeta.createdAt}</div></div>
            <span className={cn('pill', statusMeta.tone)}>{statusMeta.label}</span>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <DesignImageRail selected={selectedConcept} onSelect={setSelectedConcept} />

          <div>
            <div className="mb-2 flex items-center justify-between"><div className="eyebrow">我的模型</div><button className="text-[11px] font-medium text-[var(--color-coral-deep)]" onClick={() => nav('/projects')}>管理全部</button></div>
            <div className="grid grid-cols-3 gap-2">
              {availableModels.map((model) => <ModelLibraryCard key={model.id} label={model.label} note={model.name.replace('模型', '')} color={model.color} active={activeModel === model.id} onClick={() => setActiveModel(model.id)} />)}
              {!hasV1 && <div className="grid min-h-[94px] place-items-center rounded-[15px] border border-dashed border-[var(--color-line-2)] bg-white/35 text-center text-[9.5px] text-[var(--color-ink-3)]">对话确认后<br />生成 V1</div>}
              {hasV1 && !hasV2 && <div className="grid min-h-[94px] place-items-center rounded-[15px] border border-dashed border-[var(--color-line-2)] bg-white/35 text-center text-[9.5px] text-[var(--color-ink-3)]">优化后<br />生成 V2</div>}
            </div>
          </div>

          <div>
            <div className="eyebrow mb-2">模型尺寸 · MM</div>
            <div className="grid grid-cols-3 gap-2.5">
              {(['x', 'y', 'z'] as const).map((axis) => (
                <div key={axis} className="rounded-[14px] border border-white bg-gradient-to-b from-white to-[#f4f5fb] p-2.5 text-center shadow-sm">
                  <div className="font-mono text-[10px] uppercase text-[var(--color-ink-3)]">{axis}</div>
                  <div className="font-display text-[19px] tnum">{activeModel === 'v0' ? Math.round(revision.meshStats.bboxMm[axis] * 0.94) : activeModel === 'v2' && axis === 'z' ? revision.meshStats.bboxMm[axis] + 4 : revision.meshStats.bboxMm[axis]}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow mb-2">模型检测结果</div>
            <div className="rounded-[16px] border border-white bg-white/65 px-3 shadow-sm">
              <DataRow label="当前版本" value={activeModelMeta.label} />
              <DataRow label="可打印评分" value={`${activeModelMeta.score} / 100`} />
              <DataRow label="三角面" value={activeModelMeta.triangles.toLocaleString()} />
              <DataRow label="水密 / 流形" value={hasV1 ? '是 / 是' : '待生成后检测'} />
            </div>
          </div>

          <div className="rounded-[16px] border border-white bg-gradient-to-br from-[#f3efff] via-white to-[#eaf8ff] p-3.5 shadow-sm">
            <div className="eyebrow mb-2">演示数据</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10.5px]">
              <DemoDatum label="会话" value={DEMO_SESSION.id} /><DemoDatum label="创建者" value={DEMO_SESSION.owner} /><DemoDatum label="图片任务" value={DEMO_SESSION.imageJob} /><DemoDatum label="模型任务" value={DEMO_SESSION.modelJob} />
            </div>
          </div>

          <div className="rounded-[16px] border border-white bg-gradient-to-br from-white to-[#eef5ff] p-3.5 shadow-sm">
            <div className="eyebrow mb-2">目标设备</div>
            <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-[12px] bg-white shadow-sm"><span className="dot" style={{ background: 'var(--color-jade)' }} /></div><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{printer.name}</div><div className="truncate font-mono text-[10.5px] text-[var(--color-ink-3)]">{printer.provider} {printer.model} · 在线</div></div></div>
          </div>
        </div>
      </aside>
    </div>
  )
}

function buildStages(status: FlowStatus, hasV1: boolean, hasV2: boolean): StageNode[] {
  const isGenerating = status === 'generating'
  const isRefining = status === 'refining'
  const isQueued = status === 'queued'
  const styleDone = status !== 'style_select'
  const imageDone = !['style_select', 'image_review', 'concept_select'].includes(status)
  const stage = (done: boolean, active: boolean): StageState => done ? 'done' : active ? 'active' : 'pending'

  return [
    { stage: 'input', label: '描述需求', state: 'done', note: '用户：机械龙桌面摆件' },
    { stage: 'intent', label: 'AI 风格引导', state: stage(styleDone, status === 'style_select'), note: styleDone ? '已由用户确认风格' : '等待选择或自定义风格' },
    { stage: 'generate', label: '图片方案选择', state: stage(imageDone, status === 'image_review' || status === 'concept_select'), note: status === 'concept_select' ? '等待用户选择三版之一' : imageDone ? '图片方向已确认' : '等待首图反馈' },
    { stage: 'audit', label: '模型生成与检测', state: stage(hasV1, isGenerating), note: isGenerating ? '结构建模与风险检测中' : hasV1 ? 'V1 已生成并通过检测' : '尚未开始' },
    { stage: 'repair', label: '继续优化', state: stage(hasV2, status === 'refine_input' || isRefining), note: hasV2 ? 'V2 优化版已完成' : status === 'refine_input' ? '等待补充修改要求' : '可选步骤' },
    { stage: 'confirm', label: '用户确认', state: stage(isQueued, status === 'review' || status === 'final' || status === 'confirm_print'), note: isQueued ? '已确认打印' : '未确认前不会打印' },
    { stage: 'print', label: '打印任务', state: isQueued ? 'active' : 'pending', note: isQueued ? '已加入任务队列' : '等待用户确认' },
  ]
}

function StyleGuide({ selected, batch, customStyle, onSelect, onBatchChange, onCustomStyle, onConfirm, onConfirmCustom, disabled }: { selected: number; batch: number; customStyle: string; onSelect: (value: number) => void; onBatchChange: () => void; onCustomStyle: (value: string) => void; onConfirm: () => void; onConfirmCustom: () => void; disabled: boolean }) {
  const visibleStyles = STYLES.slice(batch * 3, batch * 3 + 3)
  return (
    <div className={cn('mt-3 transition-opacity', disabled && 'pointer-events-none opacity-65')}>
      <div className="grid grid-cols-3 gap-2 max-[620px]:grid-cols-1">
        {visibleStyles.map((style) => {
          const index = STYLES.indexOf(style)
          return (
            <button key={style.name} className={cn('group min-w-0 rounded-[15px] border p-3 text-left transition-all', selected === index ? 'border-[var(--color-coral)]/35 bg-gradient-to-br from-[#eeeaff] to-[#e9f6ff] shadow-sm ring-2 ring-[#eeeaff]' : 'border-white bg-white/68 hover:-translate-y-0.5 hover:border-[var(--color-line-2)]')} onClick={() => onSelect(index)}>
              <span className="mb-3 block h-1.5 w-9 rounded-full" style={{ background: `linear-gradient(90deg, ${style.color}, #83dbef)` }} />
              <span className="flex items-center justify-between gap-1"><span className="truncate text-[12px] font-semibold">{style.name}</span>{selected === index && <span className="pill pill-coral px-2 py-0.5">已选</span>}</span>
              <span className="mt-1.5 block text-[9.8px] leading-relaxed text-[var(--color-ink-3)]">{style.note}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <button className="btn btn-quiet px-1" onClick={onBatchChange}>↻ 都不喜欢，换一批风格</button>
        <button className="btn btn-primary px-4 py-2" onClick={onConfirm}>使用“{STYLES[selected].name}”</button>
      </div>
      <div className="mt-3 rounded-[15px] border border-dashed border-[var(--color-line-2)] bg-white/52 p-3">
        <div className="mb-2 flex items-center justify-between"><div><div className="text-[11.5px] font-semibold">推荐里没有你想要的？</div><div className="text-[9.8px] text-[var(--color-ink-3)]">直接描述、粘贴关键词，或上传参考图片。</div></div><button className="rounded-full border border-white bg-white px-2.5 py-1 text-[10px] text-[var(--color-ink-2)] shadow-sm">＋参考图</button></div>
        <div className="flex gap-2 max-[560px]:flex-col"><input value={customStyle} onChange={(event) => onCustomStyle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && onConfirmCustom()} className="min-w-0 flex-1 rounded-[12px] border border-white bg-white px-3 py-2 text-[11.5px] outline-none focus:border-[var(--color-coral)]" placeholder="例如：敦煌飞天 × 生物机械，哑光陶瓷材质…" /><button className="btn btn-ghost px-3 py-2" disabled={!customStyle.trim()} onClick={onConfirmCustom}>使用我的风格</button></div>
      </div>
    </div>
  )
}

function IntentInsight() {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 max-[560px]:grid-cols-1">
      {[
        ['已识别主体', '机械龙'], ['已识别用途', '桌面摆件'], ['需要补充', '风格与配色'],
      ].map(([label, value], index) => <div key={label} className={cn('rounded-[12px] border px-3 py-2.5', index === 2 ? 'border-[var(--color-amber)]/20 bg-[var(--color-amber-soft)]' : 'border-[var(--color-jade)]/15 bg-[var(--color-jade-soft)]')}><div className="text-[9.5px] text-[var(--color-ink-3)]">{label}</div><div className="mt-0.5 text-[11.5px] font-semibold">{value}</div></div>)}
    </div>
  )
}

function SingleConceptPreview() {
  return (
    <div className="mt-3 overflow-hidden rounded-[16px] border border-white bg-white shadow-sm">
      <div className="h-[205px]"><ConceptArtwork colors={['#7364df', '#79d4ef', '#efeaff']} variant={0} /></div>
      <div className="flex items-center justify-between gap-3 px-3.5 py-3"><div><div className="text-[12.5px] font-semibold">初稿 · 机械龙 3D 产品渲染</div><div className="text-[10.5px] text-[var(--color-ink-3)]">1536 × 1024 · 生成 11.8 秒 · {DEMO_SESSION.imageJob}</div></div><span className="pill pill-neutral">方向预览</span></div>
    </div>
  )
}

function ConceptGrid({ selected, onSelect }: { selected: number; onSelect: (value: number) => void }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2.5 max-[620px]:grid-cols-1">
      {CONCEPTS.map((concept, index) => (
        <button key={concept.id} className={cn('group overflow-hidden rounded-[16px] border bg-white text-left transition-all', selected === index ? 'border-[var(--color-coral)] shadow-[0_14px_34px_-24px_rgba(84,70,217,.65)] ring-2 ring-[var(--color-coral-soft)]' : 'border-white hover:-translate-y-0.5 hover:border-[var(--color-line-2)]')} onClick={() => onSelect(index)}>
          <div className="relative h-[148px]"><ConceptArtwork colors={concept.colors} variant={index + 1} /><span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-white/80 bg-white/78 font-display text-[11px] font-bold text-[var(--color-coral-deep)] backdrop-blur">{concept.id}</span>{selected === index && <span className="absolute right-2 top-2 pill pill-coral">已选择</span>}</div>
          <div className="p-3"><div className="text-[12px] font-semibold">{concept.name}</div><div className="mt-1 text-[10px] leading-relaxed text-[var(--color-ink-3)]">{concept.note}</div></div>
        </button>
      ))}
    </div>
  )
}

function DesignImageRail({ selected, onSelect }: { selected: number; onSelect: (value: number) => void }) {
  const images = [
    { key: 'draft', label: '首轮探索', note: '方向预览', colors: ['#7364df', '#79d4ef', '#efeaff'], variant: 0, conceptIndex: -1 },
    ...CONCEPTS.map((concept, index) => ({ key: concept.id, label: `${concept.id} · ${concept.name}`, note: index === selected ? '当前选择' : 'AI 生成方案', colors: concept.colors, variant: index + 1, conceptIndex: index })),
  ]
  const loopImages = [...images, ...images]
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div><div className="eyebrow">AI 设计图片</div><div className="mt-1 text-[10.5px] text-[var(--color-ink-3)]">自动浏览本次对话生成的概念图</div></div>
        <span className="pill pill-neutral">{images.length} 张</span>
      </div>
      <div className="design-image-rail rounded-[16px] border border-white bg-gradient-to-br from-[#f3efff] via-white to-[#eaf8ff] py-3 shadow-sm">
        <div className="design-image-track">
          {loopImages.map((image, index) => (
            <button key={`${image.key}-${index}`} className={cn('design-image-card group', image.conceptIndex === selected && image.conceptIndex >= 0 && 'is-active')} onClick={() => image.conceptIndex >= 0 && onSelect(image.conceptIndex)}>
              <div className="relative h-[94px] overflow-hidden rounded-[11px]">
                <ConceptArtwork colors={image.colors} variant={image.variant} />
                <span className="absolute left-2 top-2 rounded-full border border-white/80 bg-white/75 px-2 py-0.5 text-[8.5px] font-semibold text-[var(--color-coral-deep)] backdrop-blur">{image.note}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2"><span className="truncate text-[10.5px] font-semibold">{image.label}</span>{image.conceptIndex === selected && image.conceptIndex >= 0 && <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--color-coral)]" />}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ConceptArtwork({ colors, variant }: { colors: string[]; variant: number }) {
  const uniqueId = useId().replace(/:/g, '')
  const id = `render-${variant}-${uniqueId}`
  const shifts = [0, -8, 7, -2]
  const shift = shifts[variant] ?? 0
  return (
    <svg viewBox="0 0 420 250" className="h-full w-full" role="img" aria-label="高质感机械龙 3D 概念渲染" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${id}-bg`} cx="58%" cy="32%" r="78%"><stop stopColor="#ffffff" /><stop offset=".42" stopColor={colors[2]} /><stop offset="1" stopColor="#dbe8f7" /></radialGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d9d7ff" /><stop offset=".2" stopColor={colors[0]} /><stop offset=".54" stopColor="#3f3c75" /><stop offset=".76" stopColor={colors[1]} /><stop offset="1" stopColor="#effdff" /></linearGradient>
        <linearGradient id={`${id}-dark`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5b5c7f" /><stop offset="1" stopColor="#20243e" /></linearGradient>
        <radialGradient id={`${id}-glow`}><stop stopColor="#ffffff" /><stop offset=".25" stopColor="#b8f7ff" /><stop offset="1" stopColor={colors[1]} stopOpacity="0" /></radialGradient>
        <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="18" stdDeviation="15" floodColor="#38406a" floodOpacity=".3" /></filter>
        <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="12" /></filter>
      </defs>
      <rect width="420" height="250" fill={`url(#${id}-bg)`} />
      <circle cx="330" cy="54" r="92" fill={colors[1]} opacity=".16" filter={`url(#${id}-blur)`} />
      <circle cx="78" cy="204" r="100" fill={colors[0]} opacity=".14" filter={`url(#${id}-blur)`} />
      <path d="M35 210 L210 142 L402 210 L226 251Z" fill="#fff" opacity=".38" />
      <g opacity=".22" stroke="#7e88aa" strokeWidth=".7"><path d="M48 211H395M74 222H370M104 234H340" /><path d="M110 180L76 244M164 160L147 250M220 146V250M276 158L297 248M330 179L369 241" /></g>
      <g transform={`translate(${shift} 0)`} filter={`url(#${id}-shadow)`}>
        <ellipse cx="213" cy="208" rx="128" ry="17" fill="#323751" opacity=".18" />
        <path d="M101 151 C119 96 166 71 225 88 C269 101 294 124 315 155 C282 144 254 145 228 160 C181 186 136 185 101 151Z" fill={`url(#${id}-metal)`} />
        <path d="M130 136 C152 111 184 102 218 112 L196 153 L149 166Z" fill={`url(#${id}-dark)`} opacity=".9" />
        <path d="M218 93 L247 48 L260 100 L293 66 L283 128Z" fill={`url(#${id}-metal)`} />
        <path d="M273 118 L334 94 L362 121 L315 155Z" fill={`url(#${id}-dark)`} />
        <path d="M321 99 L367 105 L385 130 L334 132Z" fill={`url(#${id}-metal)`} />
        <path d="M156 160 L137 210 L169 205 L190 158Z" fill={`url(#${id}-metal)`} />
        <path d="M239 157 L243 212 L279 204 L276 148Z" fill={`url(#${id}-metal)`} />
        <path d="M103 151 C72 153 50 174 34 199" fill="none" stroke={`url(#${id}-metal)`} strokeWidth={variant === 3 ? 22 : 16} strokeLinecap="round" />
        <path d="M146 108 L158 73 L176 105M181 92 L201 55 L213 94" fill={colors[1]} opacity=".88" />
        <circle cx="338" cy="113" r="22" fill={`url(#${id}-glow)`} />
        <circle cx="338" cy="113" r="5" fill="#eaffff" />
        <path d="M174 123 C206 109 236 115 258 138" fill="none" stroke="#bff8ff" strokeWidth="4" strokeLinecap="round" opacity=".78" />
        <path d="M116 143 C145 102 184 89 226 99" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".42" />
      </g>
      <g fill="#fff" opacity=".78"><circle cx="64" cy="54" r="2" /><circle cx="92" cy="76" r="1.4" /><circle cx="356" cy="64" r="1.8" /><circle cx="379" cy="83" r="1.2" /></g>
    </svg>
  )
}

function GenerationProgress({ progress, mode }: { progress: number; mode: 'generate' | 'refine' }) {
  const items = mode === 'generate' ? ['轮廓重建', '结构建模', '网格细化', '打印检测'] : ['保留主体', '局部重算', '拓扑融合', '自动复检']
  return (
    <div className="mt-3 rounded-[16px] border border-white bg-white/82 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3"><div><div className="text-[12.5px] font-semibold">{mode === 'generate' ? '3D 模型生成进度' : '优化版本生成进度'}</div><div className="mt-0.5 font-mono text-[10px] text-[var(--color-ink-3)]">{progress < 100 ? 'AI MODELING · PROCESSING' : 'AI MODELING · COMPLETE'}</div></div><span className="font-display text-[22px] font-semibold text-[var(--color-coral-deep)] tnum">{progress}%</span></div>
      <div className="mt-3"><Meter value={progress} color="linear-gradient(90deg,#806cf6,#51b7f7,#65d3c1)" height={8} track="#edf0f7" /></div>
      <div className="mt-3 grid grid-cols-4 gap-1.5 max-[560px]:grid-cols-2">
        {items.map((item, index) => { const threshold = (index + 1) * 25; const complete = progress >= threshold; const active = progress < threshold && progress >= index * 25; return <div key={item} className={cn('rounded-[10px] border px-2 py-2 text-center text-[9.5px]', complete ? 'border-[var(--color-jade)]/15 bg-[var(--color-jade-soft)] text-[#08795a]' : active ? 'border-[var(--color-coral)]/20 bg-[var(--color-coral-soft)] text-[var(--color-coral-deep)]' : 'border-[var(--color-line)] bg-[#f8f9fc] text-[var(--color-ink-3)]')}>{complete ? '✓ ' : active ? '● ' : '○ '}{item}</div> })}
      </div>
    </div>
  )
}

function ModelResultCard({ version, modelVersion, color, selectedConcept, onConfirm, onRefine, actions, compact = false }: { version: string; modelVersion: 'v1' | 'v2'; color: string; selectedConcept: string; onConfirm: () => void; onRefine: () => void; actions: boolean; compact?: boolean }) {
  const isV2 = version.startsWith('V2')
  return (
    <div className="mt-3 overflow-hidden rounded-[17px] border border-white bg-white shadow-sm">
      <div className={cn('relative bg-gradient-to-br from-[#efedff] via-[#eef6ff] to-[#ebfbf8]', compact ? 'h-[140px]' : 'h-[210px]')}>
        <ModelViewer color={color} version={modelVersion} showBuildPlate={false} interactive={false} autoRotate />
        <span className="pointer-events-none absolute left-3 top-3 pill pill-pass"><span className="dot" style={{ background: 'var(--color-jade)' }} />模型生成完成</span>
        <span className="pointer-events-none absolute right-3 top-3 pill pill-neutral">{version}</span>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3"><div><div className="text-[13px] font-semibold">机械龙桌面摆件 · {version}</div><div className="mt-1 text-[10.5px] text-[var(--color-ink-3)]">{selectedConcept} · 水密模型 · 可继续编辑</div></div><span className="pill pill-pass">可打印 {isV2 ? 96 : 92}</span></div>
        <div className="mt-3 grid grid-cols-4 gap-1.5 max-[560px]:grid-cols-2"><ModelMetric label="生成耗时" value={isV2 ? '01:16' : '01:48'} /><ModelMetric label="模型文件" value={isV2 ? '9.4 MB' : '8.6 MB'} /><ModelMetric label="三角面" value={isV2 ? '76,840' : '68,420'} /><ModelMetric label="检测项" value="6 / 6" /></div>
        {actions && <div className="mt-3 grid grid-cols-2 gap-2"><button className="btn btn-primary" onClick={onConfirm}>确认并准备打印</button><button className="btn btn-ghost" onClick={onRefine}>继续优化模型</button></div>}
        {actions && <div className="mt-2 text-center text-[10px] text-[var(--color-ink-3)]">安全规则：未经过你的再次确认，系统不会发送打印任务。</div>}
      </div>
    </div>
  )
}

function ModelMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-[10px] bg-[var(--color-surface-2)] px-2 py-2 text-center"><div className="text-[9px] text-[var(--color-ink-3)]">{label}</div><div className="mt-0.5 font-mono text-[10px] font-semibold text-[var(--color-ink-2)]">{value}</div></div> }

function RefineComposer({ value, onChange, onSubmit }: { value: string; onChange: (value: string) => void; onSubmit: () => void }) {
  return (
    <div className="mt-3 rounded-[16px] border border-[var(--color-coral)]/20 bg-gradient-to-br from-[#f5f2ff] to-[#edf8ff] p-3.5">
      <div className="text-[12.5px] font-semibold">在本次模型下面补充优化内容</div><div className="mt-1 text-[10.5px] text-[var(--color-ink-3)]">系统会创建新版本，V1 会保留在“我的模型”中。</div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 min-h-[82px] w-full resize-none rounded-[14px] border border-white bg-white/90 px-3 py-2.5 text-[12.5px] leading-relaxed outline-none shadow-sm focus:border-[var(--color-coral)]" placeholder="例如：头部更圆润、尾巴加粗、底座改成半透明科技环…" />
      <div className="mt-2 flex flex-wrap gap-1.5">{['头部更圆润', '尾巴加粗', '底座更稳定', '减少支撑'].map((item) => <button key={item} onClick={() => onChange(value ? `${value} ${item}。` : `${item}。`)} className="rounded-full border border-white bg-white/75 px-2.5 py-1 text-[10px] text-[var(--color-ink-2)] shadow-sm hover:text-[var(--color-coral-deep)]">+ {item}</button>)}</div>
      <button className="btn btn-primary mt-3 w-full" onClick={onSubmit} disabled={!value.trim()}><SparkIcon />生成优化版模型</button>
    </div>
  )
}

function PrintConfirmCard({ printer, version, onCancel, onConfirm }: { printer: string; version: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="mt-3 rounded-[16px] border border-[var(--color-amber)]/25 bg-gradient-to-br from-[#fffaf0] to-white p-4 shadow-sm"><div className="flex items-start gap-3"><div className="grid h-9 w-9 flex-none place-items-center rounded-[12px] bg-[var(--color-amber-soft)] text-[#9a620b]">!</div><div><div className="text-[13px] font-semibold">确认创建打印任务？</div><p className="mt-1 text-[11px] leading-relaxed text-[var(--color-ink-2)]">模型：{version} · 设备：{printer} · 材料：PLA · 预计 2 小时 18 分。点击确认后只会加入任务队列，不会跳过设备安全检测。</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button className="btn btn-ghost" onClick={onCancel}>返回检查</button><button className="btn btn-primary" onClick={onConfirm}>再次确认打印</button></div></div>
}

function ModelVersionItem({ label, note, color, active, onClick }: { label: string; note: string; color: string; active?: boolean; onClick: () => void }) { return <button onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-[14px] border p-2.5 text-left transition-all', active ? 'border-[var(--color-coral)]/25 bg-[var(--color-coral-soft)]' : 'border-white bg-white/60 hover:border-[var(--color-line-2)]')}><ModelMini color={color} /><span className="min-w-0 flex-1"><span className="block truncate text-[11.5px] font-semibold">{label}</span><span className="block truncate text-[9.5px] text-[var(--color-ink-3)]">{note}</span></span>{active && <span className="pill pill-coral">当前</span>}</button> }
function ModelLibraryCard({ label, note, color, active, onClick }: { label: string; note: string; color: string; active?: boolean; onClick: () => void }) { return <button onClick={onClick} className={cn('overflow-hidden rounded-[15px] border text-left transition-all', active ? 'border-[var(--color-coral)]/28 bg-[var(--color-coral-soft)] shadow-sm' : 'border-white bg-white/65 hover:border-[var(--color-line-2)]')}><div className="grid h-[62px] place-items-center bg-gradient-to-br from-[#f2efff] to-[#edf8ff]"><ModelMini color={color} large /></div><div className="flex items-center justify-between gap-1 px-2.5 py-2"><div className="min-w-0"><div className="text-[10.5px] font-semibold">{label}</div><div className="truncate text-[9px] text-[var(--color-ink-3)]">{note}</div></div>{active && <span className="h-2 w-2 flex-none rounded-full bg-[var(--color-coral)]" />}</div></button> }
function ModelMini({ color, large }: { color: string; large?: boolean }) { return <span className={cn('relative grid flex-none place-items-center rounded-[10px] bg-gradient-to-br from-[#efedff] to-[#e8f7ff]', large ? 'h-11 w-16 bg-transparent' : 'h-9 w-11')}><span className="h-[56%] w-[58%] rotate-[-12deg] rounded-[45%_55%_42%_58%] shadow-sm" style={{ background: `linear-gradient(135deg,${color},#6bc8e9)` }} /><span className="absolute right-[19%] top-[22%] h-1.5 w-1.5 rounded-full bg-[#d8fbff] shadow-[0_0_6px_#7de8ff]" /><span className="absolute bottom-[18%] h-[3px] w-[65%] rounded-full bg-[#74708d]/10" /></span> }

function AgentMessage({ text, badge, time, children }: { text: string; badge?: string; time?: string; children?: ReactNode }) {
  return <div className="flex items-start gap-2.5"><AgentAvatar /><div className="min-w-0 max-w-[94%] flex-1"><div className="mb-1.5 flex items-center gap-2"><span className="text-[10.5px] font-semibold text-[var(--color-ink-2)]">灵构AI</span><span className="font-mono text-[9px] text-[var(--color-ink-3)]">{time ?? timeNow()}</span></div><div className="chat-agent-bubble rounded-[18px] rounded-tl-[5px] px-4 py-3.5 text-[13px] leading-relaxed text-[var(--color-ink)]">{badge && <div className="mb-2 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--color-coral-deep)]"><span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#806cf6] to-[#55b5ee]" />{badge}</div>}<div>{text}</div>{children}</div></div></div>
}

function UserMessage({ children, time }: { children: ReactNode; time?: string }) {
  return <div className="flex items-start justify-end gap-2.5"><div className="max-w-[78%]"><div className="mb-1.5 flex items-center justify-end gap-2"><span className="font-mono text-[9px] text-[var(--color-ink-3)]">{time ?? timeNow()} · 已发送</span><span className="text-[10.5px] font-semibold text-[var(--color-ink-2)]">林默</span></div><div className="chat-user-bubble rounded-[18px] rounded-tr-[5px] px-4 py-3 text-[13px] leading-relaxed text-[var(--color-ink)]">{children}</div></div><UserAvatar /></div>
}

function TypingMessage({ label = 'AI 正在输入…' }: { label?: string }) { return <div className="flex items-start gap-2.5"><AgentAvatar /><div><div className="mb-1.5 text-[10.5px] font-semibold text-[var(--color-ink-2)]">灵构AI</div><div className="flex items-center gap-2 rounded-[16px] rounded-tl-[5px] border border-white bg-white px-4 py-3 shadow-sm"><span className="typing-dot" /><span className="typing-dot [animation-delay:.14s]" /><span className="typing-dot [animation-delay:.28s]" /><span className="ml-1 text-[10px] text-[var(--color-ink-3)]">{label}</span></div></div></div> }
function ConversationDivider({ label }: { label: string }) { return <div className="flex items-center gap-2.5 py-1"><div className="h-px flex-1 bg-[var(--color-line)]" /><span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-[var(--color-ink-3)]">{label}</span><div className="h-px flex-1 bg-[var(--color-line)]" /></div> }

function GlobalComposer({ value, onChange, onSubmit, disabled }: { value: string; onChange: (value: string) => void; onSubmit: () => void; disabled: boolean }) {
  return <div className="flex-none border-t border-[var(--color-line)] bg-white/78 px-6 py-3.5 backdrop-blur-xl"><div className="mx-auto max-w-[760px]"><div className="mb-2 flex items-center gap-2 text-[9.5px] text-[var(--color-ink-3)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-jade)]" />这是可输入的演示对话框，发送后 AI 会真实回复</div><div className="flex items-center gap-2 rounded-[16px] border border-white bg-white px-3 py-2 shadow-[0_16px_40px_-30px_rgba(53,49,112,.5)] ring-1 ring-[var(--color-line)]"><button className="grid h-8 w-8 place-items-center rounded-[10px] text-[18px] text-[var(--color-ink-3)] hover:bg-[#f3f1ff]" aria-label="上传参考图">＋</button><input value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && onSubmit()} disabled={disabled} className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-[var(--color-ink-3)]" placeholder={disabled ? 'AI 正在处理，请稍候…' : '继续和 AI 对话，例如：这些风格我都不喜欢…'} /><button className="btn btn-primary px-3 py-1.5" onClick={onSubmit} disabled={disabled || !value.trim()}>发送</button></div></div></div>
}

function DemoDatum({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><div className="text-[9px] text-[var(--color-ink-3)]">{label}</div><div className="truncate font-mono text-[9.5px] font-semibold text-[var(--color-ink-2)]">{value}</div></div> }
function AgentAvatar() { return <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-[#806cf6] to-[#55b5ee] shadow-sm"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden><circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.5" /><circle cx="10" cy="10" r="2.5" fill="white" /></svg></div> }
function UserAvatar() { return <div className="grid h-8 w-8 flex-none place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#ffd9c8] to-[#b9c9ff] text-[11px] font-bold text-[#524b78] shadow-sm">林</div> }
function SparkIcon() { return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M10 2v4M10 14v4M2 10h4M14 10h4M4.5 4.5l2.8 2.8M12.7 12.7l2.8 2.8M15.5 4.5l-2.8 2.8M7.3 12.7l-2.8 2.8" /></svg> }
