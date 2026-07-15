// Domain types for XE6-07 — mirrors PRD §13 core objects and §12 state machine.
// These are prototype-facing shapes: enough fidelity to drive the UI, not the backend.

export type SourceType = 'text' | 'image' | 'text_image' | 'upload' | 'community'

// PRD §12.2 ProjectStatus — the lifecycle a project moves through.
export type ProjectStatus =
  | 'draft'
  | 'input_received'
  | 'intent_confirming'
  | 'intent_confirmed'
  | 'design_selecting'
  | 'generating_image'
  | 'reference_image_ready'
  | 'generating_model'
  | 'reviewing_model'
  | 'model_normalizing'
  | 'printability_checking'
  | 'needs_repair'
  | 'repairing'
  | 'ready_to_slice'
  | 'slicing'
  | 'ready_to_print'
  | 'queued'
  | 'printing'
  | 'paused'
  | 'completed'
  | 'picked_up'
  | 'revising'
  | 'failed'
  | 'archived'

// The seven-stage rail the whole product is organized around (PRD §4 core loop,
// compressed to the stages a novice actually sees and confirms).
export type PipelineStage =
  | 'input'
  | 'intent'
  | 'generate'
  | 'audit'
  | 'repair'
  | 'slice'
  | 'confirm'
  | 'print'
  | 'pickup'

export type StageState = 'done' | 'active' | 'pending' | 'blocked' | 'skipped'

export interface StageNode {
  stage: PipelineStage
  label: string
  state: StageState
  // one-line, novice-facing note about what happened / what's next
  note?: string
}

// PRD §13.2 DesignIntent
export interface DesignIntent {
  subject: string
  style: string
  useCase: string
  sizeMm: { x: number; y: number; z: number }
  facePreference: 'low' | 'standard' | 'high' | 'custom'
  colorMode: string
  constraints: string[]
  hasHangingHole: boolean
  hasBase: boolean
}

export type AuditSeverity = 'pass' | 'warn' | 'block'

// PRD §13.2 MeshReport issue
export interface AuditIssue {
  id: string
  severity: AuditSeverity
  // machine name, e.g. "wall_thickness"
  key: string
  // novice-facing title
  title: string
  // Agent's plain-language explanation of the risk
  explain: string
  // the repair that would resolve it, if any
  fix?: RepairKind
  // measured value shown as mono data
  measured?: string
  threshold?: string
}

export type RepairKind =
  | 'scale'
  | 'thicken'
  | 'add_base'
  | 'add_hole'
  | 'flatten'
  | 'rotate'
  | 'decimate'

export interface RepairOption {
  kind: RepairKind
  label: string
  desc: string
  // whether this repair is recommended by the Agent for the current report
  recommended: boolean
}

export interface MeshStats {
  triangles: number
  vertices: number
  bboxMm: { x: number; y: number; z: number }
  volumeCm3: number
  watertight: boolean
  manifold: boolean
}

// PRD §12.3 AssetRevision
export type RevisionStatus =
  | 'created'
  | 'preview_ready'
  | 'audit_pending'
  | 'printable'
  | 'not_printable'
  | 'repaired'
  | 'sliced'
  | 'deprecated'
  | 'exported'

export interface AssetRevision {
  id: string
  label: string // v1, v2, v3...
  parentId?: string
  origin: 'generated' | 'uploaded' | 'repaired' | 'forked'
  status: RevisionStatus
  createdAt: string
  note: string
  meshStats: MeshStats
  printableScore: number // 0-100
}

// PRD §13.2 SliceProfile / SliceJob
export type SliceMode = 'fast' | 'economical' | 'safe'

export interface SliceProfile {
  mode: SliceMode
  label: string
  tagline: string
  layerHeightMm: number
  infillPct: number
  supports: boolean
  estMinutes: number
  filamentGram: number
  costYuan: number
  recommended: boolean
}

// PRD §13.2 PrinterDevice
export type PrinterStatus = 'online' | 'printing' | 'offline' | 'error' | 'low_material'

export interface PrinterDevice {
  id: string
  name: string
  provider: string
  model: string
  buildVolumeMm: { x: number; y: number; z: number }
  nozzleMm: number
  status: PrinterStatus
  currentJobId?: string
  progressPct?: number
}

// PRD §13.2 MaterialSpool
export interface MaterialSpool {
  id: string
  material: 'PLA' | 'PETG' | 'TPU'
  color: string
  colorHex: string
  diameterMm: number
  remainingGram: number
  totalGram: number
  location: string
  warning: boolean
}

// PRD §13.2 PrintJob
export type PrintJobStatus = 'queued' | 'printing' | 'paused' | 'completed' | 'failed'

export interface PrintJob {
  id: string
  projectId: string
  projectTitle: string
  printerId: string
  printerName: string
  materialId: string
  status: PrintJobStatus
  progressPct: number
  startedAt?: string
  etaMinutes?: number
  thumbnail: string
  pickupCode?: string
  events: { at: string; label: string; kind: 'info' | 'warn' | 'error' | 'ok' }[]
}

// PRD §13.2 Project
export interface Project {
  id: string
  title: string
  subject: string
  sourceType: SourceType
  status: ProjectStatus
  thumbnail: string
  updatedAt: string
  stages: StageNode[]
  intent?: DesignIntent
  revisions: AssetRevision[]
  activeRevisionId?: string
  auditIssues?: AuditIssue[]
  auditScore?: number
}

// PRD §13.2 CommunityModel
export interface CommunityModel {
  id: string
  title: string
  author: string
  authorAvatar: string
  tags: string[]
  license: string
  printableVerified: boolean
  thumbnail: string
  likes: number
  forks: number
  prints: number
  sizeMm: { x: number; y: number; z: number }
}

// Agent chat message
export interface ChatMessage {
  id: string
  role: 'agent' | 'user'
  // rich blocks the agent can emit
  kind: 'text' | 'intent_card' | 'options' | 'audit_summary' | 'confirm'
  text: string
  // for options block
  options?: { label: string; hint?: string }[]
}
