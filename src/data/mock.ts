import type {
  Project,
  CommunityModel,
  PrinterDevice,
  MaterialSpool,
  PrintJob,
  SliceProfile,
  AuditIssue,
  RepairOption,
  ChatMessage,
  PipelineStage,
} from './types'

// ── Pipeline stage metadata ─────────────────────────────────────────────
// The canonical rail. Every project's stage list is a projection of this.
export const STAGE_META: { stage: PipelineStage; label: string; sub: string }[] = [
  { stage: 'input', label: '输入', sub: '文本 / 图片 / 模型' },
  { stage: 'intent', label: '意图澄清', sub: 'Agent 补全需求' },
  { stage: 'generate', label: '生成', sub: '概念图 → 3D 模型' },
  { stage: 'audit', label: '可打印检测', sub: '几何风险检查' },
  { stage: 'repair', label: '修复', sub: '加厚 / 底座 / 挂孔' },
  { stage: 'slice', label: '切片', sub: '耗时 / 耗材 / 支撑' },
  { stage: 'confirm', label: '打印确认', sub: '人工确认清单' },
  { stage: 'print', label: '打印', sub: '发送到设备' },
  { stage: 'pickup', label: '取件', sub: '取件码 / 分享' },
]

// ── Printers (PRD §13.2 PrinterDevice) ──────────────────────────────────
export const PRINTERS: PrinterDevice[] = [
  {
    id: 'prn-01',
    name: '车间 A · 极速台',
    provider: 'Bambu Lab',
    model: 'X1-Carbon',
    buildVolumeMm: { x: 256, y: 256, z: 256 },
    nozzleMm: 0.4,
    status: 'printing',
    currentJobId: 'job-01',
    progressPct: 68,
  },
  {
    id: 'prn-02',
    name: '车间 A · 稳打台',
    provider: 'Prusa',
    model: 'MK4',
    buildVolumeMm: { x: 250, y: 210, z: 220 },
    nozzleMm: 0.4,
    status: 'online',
  },
  {
    id: 'prn-03',
    name: '车间 B · 开源台',
    provider: 'Voron / Moonraker',
    model: 'V2.4',
    buildVolumeMm: { x: 350, y: 350, z: 350 },
    nozzleMm: 0.6,
    status: 'low_material',
  },
  {
    id: 'prn-04',
    name: '车间 B · 备用台',
    provider: 'Creality',
    model: 'Ender-3 V3',
    buildVolumeMm: { x: 220, y: 220, z: 250 },
    nozzleMm: 0.4,
    status: 'offline',
  },
]

// ── Material spools (PRD §13.2 MaterialSpool) ───────────────────────────
export const SPOOLS: MaterialSpool[] = [
  { id: 'sp-01', material: 'PLA', color: '雾霾蓝', colorHex: '#5B7C99', diameterMm: 1.75, remainingGram: 640, totalGram: 1000, location: 'A-1', warning: false },
  { id: 'sp-02', material: 'PLA', color: '珊瑚橙', colorHex: '#E8552F', diameterMm: 1.75, remainingGram: 120, totalGram: 1000, location: 'A-2', warning: true },
  { id: 'sp-03', material: 'PLA', color: '奶油白', colorHex: '#EDE8DE', diameterMm: 1.75, remainingGram: 880, totalGram: 1000, location: 'A-3', warning: false },
  { id: 'sp-04', material: 'PETG', color: '墨黑', colorHex: '#1A1815', diameterMm: 1.75, remainingGram: 410, totalGram: 1000, location: 'B-1', warning: false },
  { id: 'sp-05', material: 'PLA', color: '薄荷绿', colorHex: '#3F8F6E', diameterMm: 1.75, remainingGram: 70, totalGram: 1000, location: 'B-2', warning: true },
  { id: 'sp-06', material: 'TPU', color: '柠檬黄', colorHex: '#C8871E', diameterMm: 1.75, remainingGram: 300, totalGram: 500, location: 'B-3', warning: false },
]

// ── Audit issues for the hero project (PRD §11 node 6, §15.2) ───────────
export const AUDIT_ISSUES: AuditIssue[] = [
  {
    id: 'iss-01',
    severity: 'block',
    key: 'wall_thickness',
    title: '尾巴太薄，打不出来',
    explain: '恐龙尾巴尖端只有 0.6mm，比喷嘴能稳定挤出的最小壁厚还薄。打印时这里会断丝或直接缺失。建议把薄壁加厚到 1.2mm 以上。',
    fix: 'thicken',
    measured: '0.6 mm',
    threshold: '≥ 1.2 mm',
  },
  {
    id: 'iss-02',
    severity: 'block',
    key: 'base_contact',
    title: '站不稳，底面接触太小',
    explain: '模型只靠两只脚尖接触打印板，接触面积过小，打印中途很容易被喷头带倒。加一个薄底座能让它稳稳站住。',
    fix: 'add_base',
    measured: '2 处点接触',
    threshold: '≥ 面接触',
  },
  {
    id: 'iss-03',
    severity: 'warn',
    key: 'overhang',
    title: '下巴悬空，可能需要支撑',
    explain: '下巴到脖子有一段 52° 的悬垂，略微超过免支撑角度。可以接受轻微毛糙，或让切片自动加支撑。',
    measured: '52°',
    threshold: '≤ 45°',
  },
  {
    id: 'iss-04',
    severity: 'warn',
    key: 'no_hole',
    title: '还没有挂孔',
    explain: '你想做的是钥匙扣，但当前模型没有挂孔。可以在头顶自动打一个 3mm 的挂孔。',
    fix: 'add_hole',
  },
  {
    id: 'iss-05',
    severity: 'pass',
    key: 'watertight',
    title: '模型封闭完整',
    explain: '网格是水密且流形的，没有破洞或自交，这部分很干净。',
    measured: 'watertight',
  },
  {
    id: 'iss-06',
    severity: 'pass',
    key: 'size',
    title: '尺寸在打印范围内',
    explain: '48 × 32 × 61mm，远小于打印机构建板尺寸，可以放心打印。',
    measured: '48×32×61 mm',
  },
]

export const REPAIR_OPTIONS: RepairOption[] = [
  { kind: 'thicken', label: '加厚薄壁', desc: '把尾巴等薄壁加厚到 1.2mm', recommended: true },
  { kind: 'add_base', label: '加底座', desc: '生成 1.5mm 薄底座，站得更稳', recommended: true },
  { kind: 'add_hole', label: '打挂孔', desc: '头顶开 3mm 挂孔，做成钥匙扣', recommended: true },
  { kind: 'scale', label: '缩放尺寸', desc: '按比例放大或缩小整体', recommended: false },
  { kind: 'flatten', label: '切平底面', desc: '削平底部增加接触', recommended: false },
  { kind: 'rotate', label: '旋转摆放', desc: '换一个方向减少支撑', recommended: false },
]

// ── Slice profiles (PRD §15.3 三档模板) ─────────────────────────────────
export const SLICE_PROFILES: SliceProfile[] = [
  {
    mode: 'fast',
    label: '省时间',
    tagline: '快点拿到手',
    layerHeightMm: 0.28,
    infillPct: 12,
    supports: true,
    estMinutes: 74,
    filamentGram: 18,
    costYuan: 3.2,
    recommended: false,
  },
  {
    mode: 'safe',
    label: '稳妥',
    tagline: '成功率优先，推荐新手',
    layerHeightMm: 0.2,
    infillPct: 18,
    supports: true,
    estMinutes: 128,
    filamentGram: 24,
    costYuan: 4.3,
    recommended: true,
  },
  {
    mode: 'economical',
    label: '省材料',
    tagline: '最省耗材',
    layerHeightMm: 0.24,
    infillPct: 8,
    supports: false,
    estMinutes: 96,
    filamentGram: 15,
    costYuan: 2.7,
    recommended: false,
  },
]

// ── Agent chat script for the hero project ──────────────────────────────
export const CHAT_SCRIPT: ChatMessage[] = [
  {
    id: 'm1',
    role: 'user',
    kind: 'text',
    text: '我想做一个蓝色的小恐龙钥匙扣',
  },
  {
    id: 'm2',
    role: 'agent',
    kind: 'text',
    text: '好想法，小恐龙钥匙扣很适合打印。我先跟你确认几个会影响成品的点，你不用懂参数，选一下就行。',
  },
  {
    id: 'm3',
    role: 'agent',
    kind: 'options',
    text: '想要多大？钥匙扣一般握在手里，太大不好带，太小细节会糊。',
    options: [
      { label: '小巧（约 5cm）', hint: '挂钥匙刚好' },
      { label: '标准（约 7cm）', hint: '推荐' },
      { label: '摆件（约 12cm）', hint: '放桌上' },
    ],
  },
  {
    id: 'm4',
    role: 'user',
    kind: 'text',
    text: '标准就行',
  },
  {
    id: 'm5',
    role: 'agent',
    kind: 'intent_card',
    text: '我把你的需求整理成了这张卡片，确认后我就去生成概念图。',
  },
  {
    id: 'm6',
    role: 'agent',
    kind: 'text',
    text: '模型生成好了，我做了一次可打印检测。发现 2 个会导致打印失败的问题和 2 个提醒，别担心，都能一键修复。',
  },
  {
    id: 'm7',
    role: 'agent',
    kind: 'audit_summary',
    text: '检测摘要',
  },
]

// ── Community models (PRD §13.2 CommunityModel) ─────────────────────────
export const COMMUNITY_MODELS: CommunityModel[] = [
  { id: 'cm-01', title: '圆头小恐龙钥匙扣', author: '像素猫', authorAvatar: '🦖', tags: ['钥匙扣', '玩具', '可爱'], license: 'CC-BY', printableVerified: true, thumbnail: '#5B7C99', likes: 1284, forks: 342, prints: 891, sizeMm: { x: 48, y: 32, z: 61 } },
  { id: 'cm-02', title: '低多边形猫咪摆件', author: 'Momo工作室', authorAvatar: '🐱', tags: ['摆件', '低面数', '猫'], license: 'CC-BY-NC', printableVerified: true, thumbnail: '#E8552F', likes: 2103, forks: 588, prints: 1442, sizeMm: { x: 60, y: 45, z: 90 } },
  { id: 'cm-03', title: '六边形收纳盒', author: '打印铺', authorAvatar: '📦', tags: ['实用', '收纳', '模块化'], license: 'CC0', printableVerified: true, thumbnail: '#3F8F6E', likes: 876, forks: 210, prints: 654, sizeMm: { x: 80, y: 80, z: 40 } },
  { id: 'cm-04', title: '关节小机器人', author: 'Bolt', authorAvatar: '🤖', tags: ['玩具', '关节', '机器人'], license: 'CC-BY', printableVerified: false, thumbnail: '#C8871E', likes: 3421, forks: 1203, prints: 2210, sizeMm: { x: 55, y: 40, z: 120 } },
  { id: 'cm-05', title: '樱花书签', author: '纸鸢', authorAvatar: '🌸', tags: ['文具', '薄件', '礼物'], license: 'CC-BY-SA', printableVerified: true, thumbnail: '#B23121', likes: 542, forks: 98, prints: 421, sizeMm: { x: 40, y: 120, z: 3 } },
  { id: 'cm-06', title: '章鱼手机支架', author: 'DeepBlue', authorAvatar: '🐙', tags: ['实用', '支架', '桌面'], license: 'CC-BY', printableVerified: true, thumbnail: '#5B7C99', likes: 1897, forks: 445, prints: 1320, sizeMm: { x: 90, y: 70, z: 65 } },
  { id: 'cm-07', title: '几何花瓶（螺旋）', author: 'formlab', authorAvatar: '🏺', tags: ['摆件', '花瓶', '螺旋'], license: 'CC-BY-NC', printableVerified: true, thumbnail: '#1A1815', likes: 2650, forks: 720, prints: 1680, sizeMm: { x: 70, y: 70, z: 150 } },
  { id: 'cm-08', title: '小恐龙蛋（可开合）', author: '像素猫', authorAvatar: '🥚', tags: ['玩具', '恐龙', '互动'], license: 'CC-BY', printableVerified: false, thumbnail: '#C8871E', likes: 980, forks: 267, prints: 512, sizeMm: { x: 50, y: 50, z: 65 } },
]

// ── Print jobs (PRD §13.2 PrintJob) ─────────────────────────────────────
export const PRINT_JOBS: PrintJob[] = [
  {
    id: 'job-01',
    projectId: 'prj-01',
    projectTitle: '蓝色小恐龙钥匙扣',
    printerId: 'prn-01',
    printerName: '车间 A · 极速台',
    materialId: 'sp-01',
    status: 'printing',
    progressPct: 68,
    startedAt: '13:42',
    etaMinutes: 41,
    thumbnail: '#5B7C99',
    events: [
      { at: '13:42', label: '任务已发送到 车间 A · 极速台', kind: 'ok' },
      { at: '13:43', label: '首层完成，附着良好', kind: 'ok' },
      { at: '14:07', label: '打印进度 68%，温度正常', kind: 'info' },
    ],
  },
  {
    id: 'job-02',
    projectId: 'prj-02',
    projectTitle: '低多边形猫咪摆件',
    printerId: 'prn-02',
    printerName: '车间 A · 稳打台',
    materialId: 'sp-03',
    status: 'queued',
    progressPct: 0,
    thumbnail: '#E8552F',
    events: [
      { at: '14:01', label: '已排队，等待 极速台 完成当前任务', kind: 'info' },
    ],
  },
  {
    id: 'job-03',
    projectId: 'prj-03',
    projectTitle: '六边形收纳盒',
    printerId: 'prn-02',
    printerName: '车间 A · 稳打台',
    materialId: 'sp-04',
    status: 'completed',
    progressPct: 100,
    startedAt: '昨天 20:11',
    thumbnail: '#3F8F6E',
    pickupCode: 'XE-4482',
    events: [
      { at: '20:11', label: '开始打印', kind: 'ok' },
      { at: '22:36', label: '打印完成', kind: 'ok' },
      { at: '22:37', label: '取件码已生成：XE-4482', kind: 'info' },
    ],
  },
  {
    id: 'job-04',
    projectId: 'prj-04',
    projectTitle: '关节小机器人',
    printerId: 'prn-03',
    printerName: '车间 B · 开源台',
    materialId: 'sp-05',
    status: 'failed',
    progressPct: 23,
    startedAt: '今天 09:14',
    thumbnail: '#C8871E',
    events: [
      { at: '09:14', label: '开始打印', kind: 'ok' },
      { at: '09:31', label: '检测到耗材余量偏低', kind: 'warn' },
      { at: '09:52', label: '耗材耗尽，打印中断', kind: 'error' },
    ],
  },
]

// ── Projects (PRD §13.2 Project) ────────────────────────────────────────
// Hero project is the in-progress dino keychain the workbench renders.
function stages(active: PipelineStage, done: PipelineStage[], blocked?: PipelineStage) {
  return STAGE_META.map((m) => {
    let state: 'done' | 'active' | 'pending' | 'blocked' | 'skipped' = 'pending'
    if (done.includes(m.stage)) state = 'done'
    if (m.stage === active) state = 'active'
    if (m.stage === blocked) state = 'blocked'
    return { stage: m.stage, label: m.label, state, note: undefined }
  })
}

export const PROJECTS: Project[] = [
  {
    id: 'prj-01',
    title: '蓝色小恐龙钥匙扣',
    subject: '小恐龙',
    sourceType: 'text',
    status: 'needs_repair',
    thumbnail: '#5B7C99',
    updatedAt: '刚刚',
    stages: stages('audit', ['input', 'intent', 'generate'], 'repair'),
    intent: {
      subject: '小恐龙',
      style: '圆润卡通',
      useCase: '钥匙扣',
      sizeMm: { x: 48, y: 32, z: 61 },
      facePreference: 'standard',
      colorMode: '单色 · 雾霾蓝',
      constraints: ['需要挂孔', '要能站稳'],
      hasHangingHole: true,
      hasBase: false,
    },
    activeRevisionId: 'rev-02',
    auditScore: 61,
    auditIssues: AUDIT_ISSUES,
    revisions: [
      {
        id: 'rev-01',
        label: 'v1',
        origin: 'generated',
        status: 'deprecated',
        createdAt: '14:20',
        note: '首次生成，尾巴偏细',
        printableScore: 48,
        meshStats: { triangles: 84200, vertices: 42150, bboxMm: { x: 47, y: 31, z: 60 }, volumeCm3: 22.4, watertight: true, manifold: true },
      },
      {
        id: 'rev-02',
        label: 'v2',
        parentId: 'rev-01',
        origin: 'generated',
        status: 'not_printable',
        createdAt: '14:28',
        note: '重新生成，轮廓更清晰（当前）',
        printableScore: 61,
        meshStats: { triangles: 96400, vertices: 48200, bboxMm: { x: 48, y: 32, z: 61 }, volumeCm3: 24.1, watertight: true, manifold: true },
      },
    ],
  },
  {
    id: 'prj-02',
    title: '低多边形猫咪摆件',
    subject: '猫咪',
    sourceType: 'image',
    status: 'queued',
    thumbnail: '#E8552F',
    updatedAt: '12 分钟前',
    stages: stages('print', ['input', 'intent', 'generate', 'audit', 'slice', 'confirm']),
    revisions: [],
  },
  {
    id: 'prj-03',
    title: '六边形收纳盒',
    subject: '收纳盒',
    sourceType: 'upload',
    status: 'picked_up',
    thumbnail: '#3F8F6E',
    updatedAt: '昨天',
    stages: stages('pickup', ['input', 'audit', 'slice', 'confirm', 'print', 'pickup']),
    revisions: [],
  },
  {
    id: 'prj-04',
    title: '关节小机器人',
    subject: '机器人',
    sourceType: 'community',
    status: 'failed',
    thumbnail: '#C8871E',
    updatedAt: '今天 09:52',
    stages: stages('print', ['input', 'audit', 'slice', 'confirm'], 'print'),
    revisions: [],
  },
  {
    id: 'prj-05',
    title: '樱花书签',
    subject: '书签',
    sourceType: 'text_image',
    status: 'ready_to_slice',
    thumbnail: '#B23121',
    updatedAt: '2 小时前',
    stages: stages('slice', ['input', 'intent', 'generate', 'audit', 'repair']),
    revisions: [],
  },
]

export const HERO_PROJECT = PROJECTS[0]

// Source-type labels
export const SOURCE_LABELS: Record<string, { label: string; icon: string }> = {
  text: { label: '文本创建', icon: '✍️' },
  image: { label: '图片创建', icon: '🖼️' },
  text_image: { label: '文本+图片', icon: '🎨' },
  upload: { label: '模型上传', icon: '📁' },
  community: { label: '社区 Fork', icon: '🔀' },
}
