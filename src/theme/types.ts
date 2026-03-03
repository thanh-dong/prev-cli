// === Annotations ===
export type AnnotationCategory = 'bug' | 'copy' | 'design' | 'general'

export interface Annotation {
  id: string
  previewName: string
  stateOrStep: string
  x: number // % relative to iframe width
  y: number // % relative to iframe height
  category: AnnotationCategory
  resolved: boolean
  createdAt: string
  comments: AnnotationComment[]
}

export interface AnnotationComment {
  id: string
  author: string
  text: string
  createdAt: string
}

// === Snapshots ===
export interface Snapshot {
  id: string
  previewName: string
  stateOrStep: string
  viewport: string
  screenshotDataUrl: string
  createdAt: string
  label?: string
}

// === Status / Approval ===
export type ApprovalStatus = 'draft' | 'in-review' | 'approved' | 'needs-changes'

export interface StatusEntry {
  previewName: string
  status: ApprovalStatus
  updatedAt: string
  updatedBy: string
}

export interface AuditLogEntry {
  previewName: string
  from: ApprovalStatus
  to: ApprovalStatus
  changedBy: string
  changedAt: string
}

// === Token Overrides ===
export interface TokenOverride {
  category: string
  name: string
  originalValue: string
  overrideValue: string
}

// === User Identity (mock) ===
export interface UserIdentity {
  name: string
  avatar?: string
}
