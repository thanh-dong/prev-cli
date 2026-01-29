# Workflow Design System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace generic demo content with a cohesive "Workflow" project management SaaS design system.

**Architecture:** Components use `@prev/jsx` primitives (Box, Text, Row, Col). Screens combine components with inline styles. Flows reference screens via YAML config. Shared demo data lives in a central file.

**Tech Stack:** React, @prev/jsx primitives, TypeScript, YAML for flow configs

**Post-Review Fixes Applied:**
- Added `config.yaml` for every new component and screen (critical for preview scanner)
- Fixed `Badge` children type from `string` to `ReactNode`
- Fixed `<select>` to use `defaultValue` instead of `selected` on options
- Removed unused `AvatarPrimitive` and imports
- Added `currentUser`, `pendingInvites`, `trialInfo` to shared data
- Updated screens to use shared data instead of hardcoded values
- Fixed status type casting in Team screens
- Simplified upgrade flow to 3 steps

---

## Phase 1: Foundation

### Task 1: Create Shared Demo Data

**Files:**
- Create: `previews/shared/data.ts`

**Step 1: Create the shared data file**

```typescript
// previews/shared/data.ts

// Brand
export const brand = {
  name: 'Workflow',
  tagline: 'Ship faster, together',
}

// Colors (for inline styles where primitives don't cover)
export const colors = {
  primary: '#4f46e5',
  primaryLight: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
}

// Team members
export const team = [
  { id: 'alex', name: 'Alex Chen', role: 'Project Manager', initials: 'AC', color: '#3b82f6', status: 'online' },
  { id: 'jordan', name: 'Jordan Lee', role: 'Designer', initials: 'JL', color: '#8b5cf6', status: 'online' },
  { id: 'sam', name: 'Sam Rivera', role: 'Engineer', initials: 'SR', color: '#10b981', status: 'away' },
  { id: 'taylor', name: 'Taylor Kim', role: 'QA', initials: 'TK', color: '#f59e0b', status: 'offline' },
] as const

export type TeamMember = typeof team[number]

// Project
export const project = {
  name: 'Product Launch Q1',
  goal: 'Ship v2 by March 31 with 3 pilot customers',
  status: 'at-risk' as const,
  risk: 'Vendor delay on payment integration',
  owner: 'Alex Chen',
  progress: 42,
  tags: ['Growth', 'Web', 'Mobile'],
  milestones: [
    { name: 'Alpha', date: 'Feb 10', status: 'complete' },
    { name: 'Beta', date: 'Mar 1', status: 'in-progress' },
    { name: 'Launch', date: 'Mar 31', status: 'upcoming' },
  ],
}

// Tasks
export const tasks = [
  { id: 't1', title: 'Finalize launch messaging', assignee: 'jordan', due: 'Feb 3', tag: 'Marketing', status: 'in-progress', column: 'doing' },
  { id: 't2', title: 'Implement feature flags', assignee: 'sam', due: 'Feb 12', tag: 'Backend', status: 'blocked', column: 'doing', blockedBy: 'API review pending' },
  { id: 't3', title: 'QA test plan for checkout', assignee: 'taylor', due: 'Feb 15', tag: 'QA', status: 'todo', column: 'todo' },
  { id: 't4', title: 'Set up analytics dashboards', assignee: 'alex', due: 'Feb 18', tag: 'Data', status: 'todo', column: 'todo' },
  { id: 't5', title: 'Design onboarding tooltips', assignee: 'jordan', due: 'Feb 20', tag: 'UX', status: 'in-progress', column: 'doing' },
  { id: 't6', title: 'API integration review', assignee: 'sam', due: 'Feb 6', tag: 'Backend', status: 'done', column: 'done' },
  { id: 't7', title: 'Competitor analysis', assignee: 'alex', due: 'Jan 28', tag: 'Research', status: 'done', column: 'done' },
] as const

export type Task = typeof tasks[number]

// Tag colors
export const tagColors: Record<string, string> = {
  Marketing: '#ec4899',
  Backend: '#3b82f6',
  QA: '#f59e0b',
  Data: '#10b981',
  UX: '#8b5cf6',
  Research: '#6b7280',
}

// Current user (for data-driven screens)
export const currentUserId = 'alex'
export const currentUser = team.find(m => m.id === currentUserId)!

// Pending invites (for team screen)
export const pendingInvites = [
  { email: 'casey@example.com', role: 'Designer', sentAt: '2 hours ago' },
  { email: 'morgan@example.com', role: 'Engineer', sentAt: 'Yesterday' },
] as const

// Trial info (for pricing screen)
export const trialInfo = {
  daysRemaining: 7,
  plan: 'Pro',
}

// Activity feed
export const activity = [
  { id: 'a1', type: 'comment', user: 'sam', task: 'Implement feature flags', content: 'API review scheduled with Payments team on Feb 6', time: '2 hours ago' },
  { id: 'a2', type: 'status', user: 'jordan', task: 'Finalize launch messaging', from: 'To Do', to: 'In Progress', time: '4 hours ago' },
  { id: 'a3', type: 'assignment', user: 'alex', task: 'QA test plan for checkout', assignee: 'taylor', time: 'Yesterday' },
  { id: 'a4', type: 'comment', user: 'jordan', task: 'Design onboarding tooltips', content: 'Updated Figma link for onboarding flow', time: 'Yesterday' },
] as const

// Empty state copy
export const emptyStates = {
  dashboard: { headline: 'No projects yet', body: 'Start with a template or create from scratch.', cta: 'Create Project' },
  board: { headline: 'No tasks yet', body: 'Move work forward by adding your first task.', cta: 'Add Task' },
  team: { headline: 'No team members', body: 'Teams ship faster together. Invite your crew.', cta: 'Invite Team' },
  filtered: { headline: 'No tasks match', body: 'Try adjusting your filters.', cta: 'Clear Filters' },
  activity: { headline: 'No activity yet', body: 'Project updates will show up here.', cta: 'Create a Task' },
}

// Pricing plans
export const plans = [
  { name: 'Free', price: 0, features: ['Up to 3 projects', '5 team members', 'Basic integrations'], cta: 'Current Plan' },
  { name: 'Pro', price: 12, features: ['Unlimited projects', 'Unlimited members', 'Advanced integrations', 'Priority support'], cta: 'Upgrade', popular: true },
  { name: 'Enterprise', price: 49, features: ['Everything in Pro', 'SSO & SAML', 'Audit logs', 'Dedicated support'], cta: 'Contact Sales' },
] as const

// Helper to get team member by ID
export function getMember(id: string): TeamMember | undefined {
  return team.find(m => m.id === id)
}
```

**Step 2: Verify file compiles**

Run: `bunx @typescript/native-preview --noEmit previews/shared/data.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add previews/shared/data.ts
git commit -m "feat: add shared demo data for Workflow design system"
```

---

## Phase 2: Core Components

### Task 2: Avatar Component

**Files:**
- Create: `previews/components/avatar/index.tsx`
- Create: `previews/components/avatar/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/components/avatar/config.yaml
kind: component
id: avatar
title: Avatar
description: User avatar with size and status indicator
status: stable
schemaVersion: "2.0"
tags: [component, identity, user]
```

**Step 2: Create Avatar component**

```tsx
// previews/components/avatar/index.tsx

export type AvatarSize = 'sm' | 'md' | 'lg'
export type AvatarStatus = 'online' | 'away' | 'offline'

export interface AvatarProps {
  initials: string
  color: string
  size?: AvatarSize
  status?: AvatarStatus
}

const sizes = {
  sm: { box: 24, fontSize: 10, statusSize: 8 },
  md: { box: 32, fontSize: 12, statusSize: 10 },
  lg: { box: 40, fontSize: 14, statusSize: 12 },
}

const statusColors: Record<AvatarStatus, string> = {
  online: '#10b981',
  away: '#f59e0b',
  offline: '#9ca3af',
}

export function Avatar({ initials, color, size = 'md', status }: AvatarProps) {
  const s = sizes[size]
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <div style={{
        width: s.box,
        height: s.box,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: s.fontSize,
        fontWeight: 600,
      }}>
        {initials}
      </div>
      {status && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: s.statusSize,
          height: s.statusSize,
          borderRadius: '50%',
          backgroundColor: statusColors[status],
          border: '2px solid white',
        }} />
      )}
    </div>
  )
}

// Demo
export default function AvatarDemo() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <Avatar initials="AC" color="#3b82f6" size="sm" />
      <Avatar initials="JL" color="#8b5cf6" size="md" />
      <Avatar initials="SR" color="#10b981" size="lg" />
      <div style={{ width: '100%', height: 1 }} />
      <Avatar initials="AC" color="#3b82f6" status="online" />
      <Avatar initials="JL" color="#8b5cf6" status="away" />
      <Avatar initials="SR" color="#10b981" status="offline" />
    </div>
  )
}
```

**Step 2: Verify preview**

Run: `bun run dev` and navigate to `/components/avatar`
Expected: Avatars display in 3 sizes and 3 status states

**Step 3: Commit**

```bash
git add previews/components/avatar/index.tsx
git commit -m "feat: add Avatar component with size and status variants"
```

---

### Task 3: Badge Component

**Files:**
- Create: `previews/components/badge/index.tsx`
- Create: `previews/components/badge/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/components/badge/config.yaml
kind: component
id: badge
title: Badge
description: Status indicator with semantic variants
status: stable
schemaVersion: "2.0"
tags: [component, status, indicator]
```

**Step 2: Create Badge component**

```tsx
// previews/components/badge/index.tsx
import type { ReactNode } from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

const variants = {
  default: { bg: '#e5e7eb', text: '#374151' },
  success: { bg: '#d1fae5', text: '#065f46' },
  warning: { bg: '#fef3c7', text: '#92400e' },
  error: { bg: '#fee2e2', text: '#991b1b' },
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const v = variants[variant]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 9999,
      fontSize: 12,
      fontWeight: 500,
      backgroundColor: v.bg,
      color: v.text,
    }}>
      {children}
    </span>
  )
}

// Demo
export default function BadgeDemo() {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Badge>Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add previews/components/badge/index.tsx
git commit -m "feat: add Badge component with status variants"
```

---

### Task 4: Tag Component

**Files:**
- Create: `previews/components/tag/index.tsx`
- Create: `previews/components/tag/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/components/tag/config.yaml
kind: component
id: tag
title: Tag
description: Colored label for categorization
status: stable
schemaVersion: "2.0"
tags: [component, label, category]
```

**Step 2: Create Tag component**

```tsx
// previews/components/tag/index.tsx

export interface TagProps {
  children: string
  color: string
}

export function Tag({ children, color }: TagProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 500,
      backgroundColor: `${color}20`,
      color: color,
    }}>
      {children}
    </span>
  )
}

// Demo
export default function TagDemo() {
  const tags = [
    { label: 'Marketing', color: '#ec4899' },
    { label: 'Backend', color: '#3b82f6' },
    { label: 'QA', color: '#f59e0b' },
    { label: 'UX', color: '#8b5cf6' },
    { label: 'Data', color: '#10b981' },
  ]
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tags.map(t => <Tag key={t.label} color={t.color}>{t.label}</Tag>)}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add previews/components/tag/index.tsx
git commit -m "feat: add Tag component for task labels"
```

---

### Task 5: Input Component

**Files:**
- Create: `previews/components/input/index.tsx`
- Create: `previews/components/input/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/components/input/config.yaml
kind: component
id: input
title: Input
description: Text input field with validation states
status: stable
schemaVersion: "2.0"
tags: [component, form, input]
```

**Step 2: Create Input component**

```tsx
// previews/components/input/index.tsx

export type InputState = 'default' | 'error' | 'disabled'

export interface InputProps {
  placeholder?: string
  type?: 'text' | 'email' | 'password'
  state?: InputState
  label?: string
  error?: string
}

export function Input({ placeholder, type = 'text', state = 'default', label, error }: InputProps) {
  const borderColor = state === 'error' ? '#ef4444' : '#e5e7eb'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        disabled={state === 'disabled'}
        style={{
          padding: '10px 12px',
          borderRadius: 6,
          border: `1px solid ${borderColor}`,
          fontSize: 14,
          backgroundColor: state === 'disabled' ? '#f3f4f6' : 'white',
          color: state === 'disabled' ? '#9ca3af' : '#111827',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {state === 'error' && error && (
        <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
      )}
    </div>
  )
}

// Demo
export default function InputDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 320 }}>
      <Input label="Email" placeholder="you@example.com" type="email" />
      <Input label="Password" placeholder="Enter password" type="password" state="error" error="Password is required" />
      <Input label="Disabled" placeholder="Cannot edit" state="disabled" />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add previews/components/input/index.tsx
git commit -m "feat: add Input component with error and disabled states"
```

---

### Task 6: Progress Component

**Files:**
- Create: `previews/components/progress/index.tsx`
- Create: `previews/components/progress/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/components/progress/config.yaml
kind: component
id: progress
title: Progress
description: Progress bar with percentage display
status: stable
schemaVersion: "2.0"
tags: [component, progress, indicator]
```

**Step 2: Create Progress component**

```tsx
// previews/components/progress/index.tsx

export interface ProgressProps {
  value: number // 0-100
  showLabel?: boolean
}

export function Progress({ value, showLabel = false }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <div style={{
        flex: 1,
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${clampedValue}%`,
          height: '100%',
          backgroundColor: '#4f46e5',
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', minWidth: 36 }}>
          {clampedValue}%
        </span>
      )}
    </div>
  )
}

// Demo
export default function ProgressDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
      <Progress value={0} showLabel />
      <Progress value={25} showLabel />
      <Progress value={42} showLabel />
      <Progress value={75} showLabel />
      <Progress value={100} showLabel />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add previews/components/progress/index.tsx
git commit -m "feat: add Progress bar component"
```

---

### Task 7: TaskCard Component

**Files:**
- Create: `previews/components/task-card/index.tsx`
- Create: `previews/components/task-card/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/components/task-card/config.yaml
kind: component
id: task-card
title: Task Card
description: Kanban task card with status and assignee
status: stable
schemaVersion: "2.0"
tags: [component, card, task]
```

**Step 2: Create TaskCard component**

```tsx
// previews/components/task-card/index.tsx
import { Avatar } from '../avatar'
import { Tag } from '../tag'
import { Badge } from '../badge'
import { team, tagColors, type Task } from '../../shared/data'

export interface TaskCardProps {
  task: Task
  variant?: 'default' | 'completed'
}

export function TaskCard({ task, variant = 'default' }: TaskCardProps) {
  const assignee = team.find(m => m.id === task.assignee)
  const isCompleted = variant === 'completed' || task.status === 'done'
  const isBlocked = task.status === 'blocked'

  return (
    <div style={{
      padding: 16,
      backgroundColor: 'white',
      borderRadius: 8,
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      opacity: isCompleted ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Title */}
        <span style={{
          fontSize: 14,
          fontWeight: 500,
          color: '#111827',
          textDecoration: isCompleted ? 'line-through' : 'none',
        }}>
          {task.title}
        </span>

        {/* Blocked warning */}
        {isBlocked && 'blockedBy' in task && (
          <div style={{
            padding: '6px 8px',
            backgroundColor: '#fef2f2',
            borderRadius: 4,
            fontSize: 12,
            color: '#991b1b',
          }}>
            Blocked: {task.blockedBy}
          </div>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color={tagColors[task.tag] || '#6b7280'}>{task.tag}</Tag>
            {isBlocked && <Badge variant="error">Blocked</Badge>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{task.due}</span>
            {assignee && (
              <Avatar initials={assignee.initials} color={assignee.color} size="sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo
import { tasks } from '../../shared/data'

export default function TaskCardDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320 }}>
      <TaskCard task={tasks[0]} />
      <TaskCard task={tasks[1]} /> {/* blocked */}
      <TaskCard task={tasks[5]} variant="completed" />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add previews/components/task-card/index.tsx
git commit -m "feat: add TaskCard component with blocked and completed states"
```

---

### Task 8: ProjectCard Component

**Files:**
- Create: `previews/components/project-card/index.tsx`
- Create: `previews/components/project-card/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/components/project-card/config.yaml
kind: component
id: project-card
title: Project Card
description: Project overview card with progress and team
status: stable
schemaVersion: "2.0"
tags: [component, card, project]
```

**Step 2: Create ProjectCard component**

```tsx
// previews/components/project-card/index.tsx
import { Progress } from '../progress'
import { Avatar } from '../avatar'
import { Badge } from '../badge'
import { team } from '../../shared/data'

export interface ProjectCardProps {
  name: string
  progress: number
  status: 'on-track' | 'at-risk' | 'complete'
  memberIds: string[]
  active?: boolean
}

const statusConfig = {
  'on-track': { label: 'On Track', variant: 'success' as const },
  'at-risk': { label: 'At Risk', variant: 'warning' as const },
  'complete': { label: 'Complete', variant: 'default' as const },
}

export function ProjectCard({ name, progress, status, memberIds, active = false }: ProjectCardProps) {
  const members = memberIds.map(id => team.find(m => m.id === id)).filter(Boolean)
  const config = statusConfig[status]

  return (
    <div style={{
      padding: 20,
      backgroundColor: 'white',
      borderRadius: 12,
      border: active ? '2px solid #4f46e5' : '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{name}</span>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        {/* Progress */}
        <Progress value={progress} showLabel />

        {/* Members */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', marginLeft: -4 }}>
            {members.slice(0, 4).map((m, i) => (
              <div key={m!.id} style={{ marginLeft: i > 0 ? -8 : 0, position: 'relative', zIndex: 4 - i }}>
                <Avatar initials={m!.initials} color={m!.color} size="sm" />
              </div>
            ))}
            {members.length > 4 && (
              <div style={{
                marginLeft: -8,
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 500,
                color: '#6b7280',
              }}>
                +{members.length - 4}
              </div>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

// Demo
export default function ProjectCardDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <ProjectCard
        name="Product Launch Q1"
        progress={42}
        status="at-risk"
        memberIds={['alex', 'jordan', 'sam', 'taylor']}
        active
      />
      <ProjectCard
        name="Website Redesign"
        progress={78}
        status="on-track"
        memberIds={['jordan', 'sam']}
      />
      <ProjectCard
        name="Q4 Metrics Review"
        progress={100}
        status="complete"
        memberIds={['alex']}
      />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add previews/components/project-card/index.tsx
git commit -m "feat: add ProjectCard component with status and member display"
```

---

### Task 9: EmptyState Component

**Files:**
- Create: `previews/components/empty-state/index.tsx`
- Create: `previews/components/empty-state/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/components/empty-state/config.yaml
kind: component
id: empty-state
title: Empty State
description: Zero-data state with icon and CTA
status: stable
schemaVersion: "2.0"
tags: [component, empty, placeholder]
```

**Step 2: Create EmptyState component**

```tsx
// previews/components/empty-state/index.tsx
import { Button } from '../button'

export interface EmptyStateProps {
  icon: string
  headline: string
  body: string
  cta: string
  onAction?: () => void
}

export function EmptyState({ icon, headline, body, cta }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
      textAlign: 'center',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        marginBottom: 20,
      }}>
        {icon}
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#111827' }}>
        {headline}
      </h3>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280', maxWidth: 280 }}>
        {body}
      </p>
      <Button variant="primary">{cta}</Button>
    </div>
  )
}

// Demo
import { emptyStates } from '../../shared/data'

export default function EmptyStateDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <EmptyState icon="📁" {...emptyStates.dashboard} />
      <EmptyState icon="✓" {...emptyStates.board} />
      <EmptyState icon="👥" {...emptyStates.team} />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add previews/components/empty-state/index.tsx
git commit -m "feat: add EmptyState component for zero-data views"
```

---

### Task 10: Sidebar Component

**Files:**
- Create: `previews/components/sidebar/index.tsx`
- Create: `previews/components/sidebar/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/components/sidebar/config.yaml
kind: component
id: sidebar
title: Sidebar
description: App navigation sidebar with user info
status: stable
schemaVersion: "2.0"
tags: [component, navigation, layout]
```

**Step 2: Create Sidebar component**

```tsx
// previews/components/sidebar/index.tsx
import { Avatar } from '../avatar'
import { brand, team, project } from '../../shared/data'

export interface SidebarProps {
  activeItem?: 'dashboard' | 'project' | 'team' | 'settings'
}

const navItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'project', icon: '📋', label: project.name },
  { id: 'team', icon: '👥', label: 'Team' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
] as const

export function Sidebar({ activeItem = 'dashboard' }: SidebarProps) {
  const currentUser = team[0] // Alex Chen

  return (
    <div style={{
      width: 240,
      height: '100%',
      backgroundColor: '#111827',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid #374151',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}>
            ⚡
          </div>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{brand.name}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {navItems.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 6,
              marginBottom: 4,
              backgroundColor: activeItem === item.id ? '#374151' : 'transparent',
              color: activeItem === item.id ? 'white' : '#9ca3af',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #374151',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Avatar initials={currentUser.initials} color={currentUser.color} size="md" status="online" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{currentUser.name}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{currentUser.role}</div>
        </div>
      </div>
    </div>
  )
}

// Demo
export default function SidebarDemo() {
  return (
    <div style={{ display: 'flex', gap: 24, height: 500 }}>
      <Sidebar activeItem="dashboard" />
      <Sidebar activeItem="project" />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add previews/components/sidebar/index.tsx
git commit -m "feat: add Sidebar navigation component"
```

---

## Phase 3: Screens

### Task 11: Login Screen

**Files:**
- Replace: `previews/screens/login/index.tsx`
- Create: `previews/screens/login/error.tsx`
- Update: `previews/screens/login/config.yaml`

**Step 1: Update config.yaml with states**

```yaml
# previews/screens/login/config.yaml
kind: screen
id: login
title: Login
description: User authentication with Workflow branding
status: stable
schemaVersion: "2.0"
tags: [screen, auth, form]
states:
  default: { description: "Login form ready for input" }
  error: { description: "Invalid credentials error" }
```

**Step 2: Update Login default state**

```tsx
// previews/screens/login/index.tsx
import { Input } from '../../components/input'
import { Button } from '../../components/button'
import { brand, colors } from '../../shared/data'

export default function Login() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: 'white',
          }}>
            ⚡
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: colors.gray900 }}>{brand.name}</span>
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 600, textAlign: 'center', color: colors.gray900 }}>
          Welcome back
        </h1>
        <p style={{ margin: '0 0 32px', color: colors.gray500, textAlign: 'center', fontSize: 14 }}>
          Sign in to continue to {brand.name}
        </p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Email" type="email" placeholder="you@example.com" />
          <Input label="Password" type="password" placeholder="Enter your password" />

          <Button variant="primary">Sign In</Button>
        </form>

        <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 14, color: colors.gray500 }}>
          Don't have an account?{' '}
          <a href="#" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 500 }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Create Login error state**

```tsx
// previews/screens/login/error.tsx
import { Input } from '../../components/input'
import { Button } from '../../components/button'
import { brand, colors } from '../../shared/data'

export default function LoginError() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: 'white',
          }}>
            ⚡
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: colors.gray900 }}>{brand.name}</span>
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 600, textAlign: 'center', color: colors.gray900 }}>
          Welcome back
        </h1>
        <p style={{ margin: '0 0 32px', color: colors.gray500, textAlign: 'center', fontSize: 14 }}>
          Sign in to continue to {brand.name}
        </p>

        {/* Error banner */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ color: colors.error }}>⚠</span>
          <span style={{ fontSize: 14, color: '#991b1b' }}>Invalid email or password. Please try again.</span>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Email" type="email" placeholder="you@example.com" state="error" />
          <Input label="Password" type="password" placeholder="Enter your password" state="error" />

          <Button variant="primary">Sign In</Button>
        </form>

        <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 14, color: colors.gray500 }}>
          Don't have an account?{' '}
          <a href="#" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 500 }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add previews/screens/login/
git commit -m "feat: update Login screen with Workflow branding and error state"
```

---

### Task 12: Signup Screen

**Files:**
- Create: `previews/screens/signup/index.tsx`
- Create: `previews/screens/signup/success.tsx`
- Create: `previews/screens/signup/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/screens/signup/config.yaml
kind: screen
id: signup
title: Signup
description: Account creation with Workflow branding
status: stable
schemaVersion: "2.0"
tags: [screen, auth, form]
states:
  default: { description: "Signup form ready for input" }
  success: { description: "Account created successfully" }
```

**Step 2: Create Signup default state**

```tsx
// previews/screens/signup/index.tsx
import { Input } from '../../components/input'
import { Button } from '../../components/button'
import { brand, colors } from '../../shared/data'

export default function Signup() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: 'white',
          }}>
            ⚡
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: colors.gray900 }}>{brand.name}</span>
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 600, textAlign: 'center', color: colors.gray900 }}>
          Create your account
        </h1>
        <p style={{ margin: '0 0 32px', color: colors.gray500, textAlign: 'center', fontSize: 14 }}>
          {brand.tagline}
        </p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Full name" placeholder="Alex Chen" />
          <Input label="Work email" type="email" placeholder="you@company.com" />
          <Input label="Password" type="password" placeholder="Create a password" />

          <Button variant="primary">Create Account</Button>
        </form>

        <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 14, color: colors.gray500 }}>
          Already have an account?{' '}
          <a href="#" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Create Signup success state**

```tsx
// previews/screens/signup/success.tsx
import { Button } from '../../components/button'
import { brand, colors } from '../../shared/data'

export default function SignupSuccess() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'white',
        padding: 48,
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
      }}>
        {/* Success icon */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          backgroundColor: '#d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 32,
        }}>
          ✓
        </div>

        <h1 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 700, color: colors.gray900 }}>
          Welcome to {brand.name}!
        </h1>
        <p style={{ margin: '0 0 32px', color: colors.gray500, fontSize: 16, lineHeight: 1.5 }}>
          Your workspace is ready. Let's set up your first project.
        </p>

        <Button variant="primary">Continue to Setup</Button>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add previews/screens/signup/
git commit -m "feat: add Signup screen with success state"
```

---

### Task 13: Dashboard Screen

**Files:**
- Replace: `previews/screens/dashboard/index.tsx`
- Create: `previews/screens/dashboard/empty.tsx`
- Create: `previews/screens/dashboard/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/screens/dashboard/config.yaml
kind: screen
id: dashboard
title: Dashboard
description: Project overview and recent activity
status: stable
schemaVersion: "2.0"
tags: [screen, dashboard, overview]
states:
  default: { description: "Projects and activity displayed" }
  empty: { description: "No projects yet" }
```

**Step 2: Update Dashboard default state**

```tsx
// previews/screens/dashboard/index.tsx
import { Sidebar } from '../../components/sidebar'
import { ProjectCard } from '../../components/project-card'
import { Avatar } from '../../components/avatar'
import { brand, colors, project, team, activity, tasks, currentUser } from '../../shared/data'

export default function Dashboard() {
  const firstName = currentUser.name.split(' ')[0]
  const myTasks = tasks.filter(t => t.assignee === currentUser.id && t.status !== 'done').slice(0, 3)

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="dashboard" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        {/* Header */}
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
              Good morning, {firstName}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: colors.gray500 }}>
              Here's what's happening with your projects
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{
              padding: '8px 16px',
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              + New Project
            </button>
          </div>
        </header>

        <div style={{ padding: 32 }}>
          {/* Projects section */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: colors.gray900 }}>
              Your Projects
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              <ProjectCard
                name={project.name}
                progress={project.progress}
                status="at-risk"
                memberIds={['alex', 'jordan', 'sam', 'taylor']}
                active
              />
              <ProjectCard
                name="Website Redesign"
                progress={78}
                status="on-track"
                memberIds={['jordan', 'sam']}
              />
              <ProjectCard
                name="Q4 Metrics Review"
                progress={100}
                status="complete"
                memberIds={['alex']}
              />
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Recent activity */}
            <section style={{
              backgroundColor: 'white',
              borderRadius: 12,
              border: `1px solid ${colors.gray200}`,
              padding: 20,
            }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: colors.gray900 }}>
                Recent Activity
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activity.slice(0, 4).map(item => {
                  const user = team.find(m => m.id === item.user)
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: 12 }}>
                      {user && <Avatar initials={user.initials} color={user.color} size="sm" />}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, color: colors.gray900 }}>
                          <strong>{user?.name}</strong>{' '}
                          {item.type === 'comment' && `commented on "${item.task}"`}
                          {item.type === 'status' && `moved "${item.task}" to ${item.to}`}
                          {item.type === 'assignment' && `assigned "${item.task}" to ${team.find(m => m.id === item.assignee)?.name}`}
                        </p>
                        {item.type === 'comment' && 'content' in item && (
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.gray500 }}>
                            "{item.content}"
                          </p>
                        )}
                        <span style={{ fontSize: 12, color: colors.gray400 }}>{item.time}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* My tasks */}
            <section style={{
              backgroundColor: 'white',
              borderRadius: 12,
              border: `1px solid ${colors.gray200}`,
              padding: 20,
            }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: colors.gray900 }}>
                My Tasks
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myTasks.map(task => (
                  <div key={task.id} style={{
                    padding: 12,
                    backgroundColor: colors.gray50,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 14, color: colors.gray900 }}>{task.title}</span>
                    <span style={{ fontSize: 12, color: colors.gray500 }}>Due {task.due}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 2: Create Dashboard empty state**

```tsx
// previews/screens/dashboard/empty.tsx
import { Sidebar } from '../../components/sidebar'
import { EmptyState } from '../../components/empty-state'
import { brand, colors, emptyStates, currentUser } from '../../shared/data'

export default function DashboardEmpty() {
  const firstName = currentUser.name.split(' ')[0]

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="dashboard" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        {/* Header */}
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
        }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
            Good morning, {firstName}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: colors.gray500 }}>
            Let's get started with your first project
          </p>
        </header>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 100px)',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            border: `1px solid ${colors.gray200}`,
            maxWidth: 400,
          }}>
            <EmptyState icon="📁" {...emptyStates.dashboard} />
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add previews/screens/dashboard/
git commit -m "feat: update Dashboard screen with Workflow data and empty state"
```

---

### Task 14: Project Board Screen

**Files:**
- Create: `previews/screens/project-board/index.tsx`
- Create: `previews/screens/project-board/empty.tsx`
- Create: `previews/screens/project-board/filtered.tsx`
- Create: `previews/screens/project-board/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/screens/project-board/config.yaml
kind: screen
id: project-board
title: Project Board
description: Kanban board with task columns
status: stable
schemaVersion: "2.0"
tags: [screen, board, kanban, tasks]
states:
  default: { description: "Board with tasks in columns" }
  empty: { description: "No tasks yet" }
  filtered: { description: "Filter applied to tasks" }
```

**Step 2: Create Project Board default state**

```tsx
// previews/screens/project-board/index.tsx
import { Sidebar } from '../../components/sidebar'
import { TaskCard } from '../../components/task-card'
import { Avatar } from '../../components/avatar'
import { Progress } from '../../components/progress'
import { Badge } from '../../components/badge'
import { colors, project, tasks, team } from '../../shared/data'

const columns = [
  { id: 'todo', title: 'To Do', tasks: tasks.filter(t => t.column === 'todo') },
  { id: 'doing', title: 'In Progress', tasks: tasks.filter(t => t.column === 'doing') },
  { id: 'done', title: 'Done', tasks: tasks.filter(t => t.column === 'done') },
]

export default function ProjectBoard() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="project" />

      <main style={{ flex: 1, backgroundColor: colors.gray100, display: 'flex', flexDirection: 'column' }}>
        {/* Project header */}
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: colors.gray900 }}>
                {project.name}
              </h1>
              <Badge variant="warning">At Risk</Badge>
            </div>
            <button style={{
              padding: '8px 16px',
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              + Add Task
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: colors.gray500 }}>Progress</span>
              <div style={{ width: 120 }}>
                <Progress value={project.progress} showLabel />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: colors.gray500 }}>Team</span>
              <div style={{ display: 'flex', marginLeft: -4 }}>
                {team.map((m, i) => (
                  <div key={m.id} style={{ marginLeft: i > 0 ? -6 : 0 }}>
                    <Avatar initials={m.initials} color={m.color} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Kanban board */}
        <div style={{
          flex: 1,
          padding: 24,
          display: 'flex',
          gap: 20,
          overflowX: 'auto',
        }}>
          {columns.map(column => (
            <div key={column.id} style={{
              width: 300,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.gray700,
                }}>
                  {column.title}
                </h2>
                <span style={{
                  fontSize: 12,
                  color: colors.gray400,
                  backgroundColor: colors.gray200,
                  padding: '2px 8px',
                  borderRadius: 10,
                }}>
                  {column.tasks.length}
                </span>
              </div>

              <div style={{
                flex: 1,
                backgroundColor: colors.gray200,
                borderRadius: 8,
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {column.tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
```

**Step 2: Create Project Board empty state**

```tsx
// previews/screens/project-board/empty.tsx
import { Sidebar } from '../../components/sidebar'
import { EmptyState } from '../../components/empty-state'
import { colors, project, emptyStates } from '../../shared/data'

export default function ProjectBoardEmpty() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="project" />

      <main style={{ flex: 1, backgroundColor: colors.gray100, display: 'flex', flexDirection: 'column' }}>
        {/* Project header */}
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
        }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: colors.gray900 }}>
            {project.name}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: colors.gray500 }}>
            {project.goal}
          </p>
        </header>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            border: `1px solid ${colors.gray200}`,
            maxWidth: 400,
          }}>
            <EmptyState icon="✓" {...emptyStates.board} />
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 3: Create Project Board filtered state**

```tsx
// previews/screens/project-board/filtered.tsx
import { Sidebar } from '../../components/sidebar'
import { TaskCard } from '../../components/task-card'
import { Badge } from '../../components/badge'
import { colors, project, tasks } from '../../shared/data'

const filteredTasks = tasks.filter(t => t.tag === 'Backend')

export default function ProjectBoardFiltered() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="project" />

      <main style={{ flex: 1, backgroundColor: colors.gray100, display: 'flex', flexDirection: 'column' }}>
        {/* Project header */}
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: colors.gray900 }}>
              {project.name}
            </h1>
          </div>

          {/* Active filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.gray500 }}>Filtered by:</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              backgroundColor: '#dbeafe',
              borderRadius: 6,
            }}>
              <span style={{ fontSize: 13, color: '#1e40af' }}>Backend</span>
              <button style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: '#1e40af',
                fontSize: 14,
              }}>×</button>
            </div>
            <Badge>{filteredTasks.length} results</Badge>
          </div>
        </header>

        {/* Filtered results */}
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add previews/screens/project-board/
git commit -m "feat: add Project Board screen with empty and filtered states"
```

---

### Task 15: Task Detail Screen

**Files:**
- Create: `previews/screens/task-detail/index.tsx`
- Create: `previews/screens/task-detail/editing.tsx`
- Create: `previews/screens/task-detail/completed.tsx`
- Create: `previews/screens/task-detail/blocked.tsx`
- Create: `previews/screens/task-detail/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/screens/task-detail/config.yaml
kind: screen
id: task-detail
title: Task Detail
description: Individual task view with comments
status: stable
schemaVersion: "2.0"
tags: [screen, task, detail]
states:
  default: { description: "Task detail view" }
  editing: { description: "Edit mode active" }
  completed: { description: "Task marked complete" }
  blocked: { description: "Task is blocked" }
```

**Step 2: Create Task Detail default state**

```tsx
// previews/screens/task-detail/index.tsx
import { Sidebar } from '../../components/sidebar'
import { Avatar } from '../../components/avatar'
import { Tag } from '../../components/tag'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { colors, tasks, team, tagColors, activity } from '../../shared/data'

const task = tasks[0] // "Finalize launch messaging"
const assignee = team.find(m => m.id === task.assignee)!
const taskActivity = activity.filter(a => a.task === task.title)

export default function TaskDetail() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="project" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        {/* Breadcrumb */}
        <div style={{
          padding: '12px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
          fontSize: 14,
          color: colors.gray500,
        }}>
          <a href="#" style={{ color: colors.gray500, textDecoration: 'none' }}>Product Launch Q1</a>
          {' / '}
          <span style={{ color: colors.gray900 }}>{task.title}</span>
        </div>

        <div style={{ padding: 32, maxWidth: 800 }}>
          {/* Task header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
                {task.title}
              </h1>
              <Button variant="primary">Mark Complete</Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Tag color={tagColors[task.tag]}>{task.tag}</Tag>
              <Badge variant="default">In Progress</Badge>
            </div>
          </div>

          {/* Task details */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            padding: 24,
            marginBottom: 24,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: colors.gray500, display: 'block', marginBottom: 8 }}>
                  Assignee
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={assignee.initials} color={assignee.color} size="md" status={assignee.status} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: colors.gray900 }}>{assignee.name}</div>
                    <div style={{ fontSize: 12, color: colors.gray500 }}>{assignee.role}</div>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: colors.gray500, display: 'block', marginBottom: 8 }}>
                  Due Date
                </label>
                <div style={{ fontSize: 14, color: colors.gray900 }}>{task.due}</div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: colors.gray500, display: 'block', marginBottom: 8 }}>
                Description
              </label>
              <p style={{ margin: 0, fontSize: 14, color: colors.gray700, lineHeight: 1.6 }}>
                Prepare the final messaging for the product launch including taglines, value propositions, and key benefits.
                Coordinate with marketing team for approval.
              </p>
            </div>
          </div>

          {/* Activity */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            padding: 24,
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: colors.gray900 }}>
              Activity
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {taskActivity.map(item => {
                const user = team.find(m => m.id === item.user)
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 12 }}>
                    {user && <Avatar initials={user.initials} color={user.color} size="sm" />}
                    <div>
                      <p style={{ margin: 0, fontSize: 14, color: colors.gray900 }}>
                        <strong>{user?.name}</strong>{' '}
                        {item.type === 'comment' && 'commented'}
                        {item.type === 'status' && `moved to ${item.to}`}
                      </p>
                      {item.type === 'comment' && 'content' in item && (
                        <div style={{
                          marginTop: 8,
                          padding: 12,
                          backgroundColor: colors.gray50,
                          borderRadius: 8,
                          fontSize: 14,
                          color: colors.gray700,
                        }}>
                          {item.content}
                        </div>
                      )}
                      <span style={{ fontSize: 12, color: colors.gray400 }}>{item.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Comment input */}
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Avatar initials="AC" color="#3b82f6" size="sm" />
              <input
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: `1px solid ${colors.gray200}`,
                  fontSize: 14,
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 2: Create Task Detail editing state**

```tsx
// previews/screens/task-detail/editing.tsx
import { Sidebar } from '../../components/sidebar'
import { Avatar } from '../../components/avatar'
import { Input } from '../../components/input'
import { Button } from '../../components/button'
import { colors, tasks, team } from '../../shared/data'

const task = tasks[0]
const assignee = team.find(m => m.id === task.assignee)!

export default function TaskDetailEditing() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="project" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        {/* Breadcrumb */}
        <div style={{
          padding: '12px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
          fontSize: 14,
          color: colors.gray500,
        }}>
          <a href="#" style={{ color: colors.gray500, textDecoration: 'none' }}>Product Launch Q1</a>
          {' / '}
          <span style={{ color: colors.gray900 }}>Editing task</span>
        </div>

        <div style={{ padding: 32, maxWidth: 800 }}>
          {/* Edit form */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: `2px solid ${colors.primary}`,
            padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.gray900 }}>
                Edit Task
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Input
                label="Title"
                placeholder="Task title"
              />

              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: colors.gray700, display: 'block', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  defaultValue="Prepare the final messaging for the product launch including taglines, value propositions, and key benefits."
                  style={{
                    width: '100%',
                    minHeight: 100,
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: `1px solid ${colors.gray200}`,
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: colors.gray700, display: 'block', marginBottom: 6 }}>
                    Assignee
                  </label>
                  <select
                    defaultValue={task.assignee}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: `1px solid ${colors.gray200}`,
                      fontSize: 14,
                      backgroundColor: 'white',
                    }}
                  >
                    {team.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input label="Due Date" placeholder="Feb 3" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 3: Create Task Detail completed state**

```tsx
// previews/screens/task-detail/completed.tsx
import { Sidebar } from '../../components/sidebar'
import { Avatar } from '../../components/avatar'
import { Tag } from '../../components/tag'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { colors, tasks, team, tagColors } from '../../shared/data'

const task = tasks[5] // "API integration review" - done task
const assignee = team.find(m => m.id === task.assignee)!

export default function TaskDetailCompleted() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="project" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        {/* Breadcrumb */}
        <div style={{
          padding: '12px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
          fontSize: 14,
          color: colors.gray500,
        }}>
          <a href="#" style={{ color: colors.gray500, textDecoration: 'none' }}>Product Launch Q1</a>
          {' / '}
          <span style={{ color: colors.gray900 }}>{task.title}</span>
        </div>

        <div style={{ padding: 32, maxWidth: 800 }}>
          {/* Completion celebration */}
          <div style={{
            backgroundColor: '#d1fae5',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600, color: '#065f46' }}>
              Task Completed!
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: '#047857' }}>
              Great work! This task was marked complete.
            </p>
          </div>

          {/* Task header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <h1 style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 600,
                color: colors.gray500,
                textDecoration: 'line-through',
              }}>
                {task.title}
              </h1>
              <Button variant="ghost">Reopen Task</Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Tag color={tagColors[task.tag]}>{task.tag}</Tag>
              <Badge variant="success">Completed</Badge>
            </div>
          </div>

          {/* Task details */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            padding: 24,
            opacity: 0.7,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: colors.gray500, display: 'block', marginBottom: 8 }}>
                  Completed by
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={assignee.initials} color={assignee.color} size="md" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: colors.gray900 }}>{assignee.name}</div>
                    <div style={{ fontSize: 12, color: colors.gray500 }}>{assignee.role}</div>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: colors.gray500, display: 'block', marginBottom: 8 }}>
                  Completed on
                </label>
                <div style={{ fontSize: 14, color: colors.gray900 }}>{task.due}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 4: Create Task Detail blocked state**

```tsx
// previews/screens/task-detail/blocked.tsx
import { Sidebar } from '../../components/sidebar'
import { Avatar } from '../../components/avatar'
import { Tag } from '../../components/tag'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { colors, tasks, team, tagColors } from '../../shared/data'

const task = tasks[1] // "Implement feature flags" - blocked task
const assignee = team.find(m => m.id === task.assignee)!

export default function TaskDetailBlocked() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="project" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        {/* Breadcrumb */}
        <div style={{
          padding: '12px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
          fontSize: 14,
          color: colors.gray500,
        }}>
          <a href="#" style={{ color: colors.gray500, textDecoration: 'none' }}>Product Launch Q1</a>
          {' / '}
          <span style={{ color: colors.gray900 }}>{task.title}</span>
        </div>

        <div style={{ padding: 32, maxWidth: 800 }}>
          {/* Blocked warning */}
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}>
              ⚠️
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#991b1b' }}>
                This task is blocked
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: '#b91c1c' }}>
                {'blockedBy' in task && task.blockedBy}
              </p>
              <Button variant="secondary">View Blocker</Button>
            </div>
          </div>

          {/* Task header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
                {task.title}
              </h1>
              <Button variant="ghost">Remove Blocker</Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Tag color={tagColors[task.tag]}>{task.tag}</Tag>
              <Badge variant="error">Blocked</Badge>
            </div>
          </div>

          {/* Task details */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            padding: 24,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: colors.gray500, display: 'block', marginBottom: 8 }}>
                  Assignee
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={assignee.initials} color={assignee.color} size="md" status={assignee.status} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: colors.gray900 }}>{assignee.name}</div>
                    <div style={{ fontSize: 12, color: colors.gray500 }}>{assignee.role}</div>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: colors.gray500, display: 'block', marginBottom: 8 }}>
                  Due Date
                </label>
                <div style={{ fontSize: 14, color: colors.error, fontWeight: 500 }}>
                  {task.due} (at risk)
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add previews/screens/task-detail/
git commit -m "feat: add Task Detail screen with editing, completed, and blocked states"
```

---

### Task 16: Team Screen

**Files:**
- Create: `previews/screens/team/index.tsx`
- Create: `previews/screens/team/empty.tsx`
- Create: `previews/screens/team/inviting.tsx`
- Create: `previews/screens/team/pending.tsx`
- Create: `previews/screens/team/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/screens/team/config.yaml
kind: screen
id: team
title: Team
description: Team member management
status: stable
schemaVersion: "2.0"
tags: [screen, team, members]
states:
  default: { description: "Team member list" }
  empty: { description: "No team members" }
  inviting: { description: "Invite modal open" }
  pending: { description: "Showing pending invites" }
```

**Step 2: Create Team default state**

```tsx
// previews/screens/team/index.tsx
import { Sidebar } from '../../components/sidebar'
import { Avatar } from '../../components/avatar'
import { Badge, type BadgeVariant } from '../../components/badge'
import { Button } from '../../components/button'
import { colors, team, type TeamMember } from '../../shared/data'

const statusVariant: Record<TeamMember['status'], BadgeVariant> = {
  online: 'success',
  away: 'warning',
  offline: 'default',
}

export default function Team() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="team" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
              Team
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: colors.gray500 }}>
              {team.length} members
            </p>
          </div>
          <Button variant="primary">Invite Member</Button>
        </header>

        <div style={{ padding: 32 }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            overflow: 'hidden',
          }}>
            {team.map((member, i) => (
              <div
                key={member.id}
                style={{
                  padding: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: i < team.length - 1 ? `1px solid ${colors.gray200}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Avatar
                    initials={member.initials}
                    color={member.color}
                    size="lg"
                    status={member.status}
                  />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: colors.gray900 }}>
                      {member.name}
                    </div>
                    <div style={{ fontSize: 14, color: colors.gray500 }}>
                      {member.role}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Badge variant={statusVariant[member.status]}>
                    {member.status[0].toUpperCase() + member.status.slice(1)}
                  </Badge>
                  <Button variant="ghost">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 2: Create Team empty state**

```tsx
// previews/screens/team/empty.tsx
import { Sidebar } from '../../components/sidebar'
import { EmptyState } from '../../components/empty-state'
import { colors, emptyStates } from '../../shared/data'

export default function TeamEmpty() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="team" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
        }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
            Team
          </h1>
        </header>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 100px)',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            border: `1px solid ${colors.gray200}`,
            maxWidth: 400,
          }}>
            <EmptyState icon="👥" {...emptyStates.team} />
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 3: Create Team inviting state**

```tsx
// previews/screens/team/inviting.tsx
import { Sidebar } from '../../components/sidebar'
import { Avatar } from '../../components/avatar'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { Input } from '../../components/input'
import { colors, team } from '../../shared/data'

export default function TeamInviting() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="team" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
              Team
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: colors.gray500 }}>
              {team.length} members
            </p>
          </div>
        </header>

        {/* Modal overlay */}
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, color: colors.gray900 }}>
              Invite Team Members
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: colors.gray500 }}>
              Send invites to collaborate on your workspace
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Email addresses"
                placeholder="Enter email addresses, separated by commas"
              />

              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: colors.gray700, display: 'block', marginBottom: 6 }}>
                  Role
                </label>
                <select style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: `1px solid ${colors.gray200}`,
                  fontSize: 14,
                  backgroundColor: 'white',
                }}>
                  <option>Member</option>
                  <option>Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary">Send Invites</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 4: Create Team pending state**

```tsx
// previews/screens/team/pending.tsx
import { Sidebar } from '../../components/sidebar'
import { Avatar } from '../../components/avatar'
import { Badge } from '../../components/badge'
import { Button } from '../../components/button'
import { colors, team, pendingInvites } from '../../shared/data'

export default function TeamPending() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="team" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
              Team
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: colors.gray500 }}>
              {team.length} members · {pendingInvites.length} pending
            </p>
          </div>
          <Button variant="primary">Invite Member</Button>
        </header>

        <div style={{ padding: 32 }}>
          {/* Pending invites */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
              Pending Invites
            </h2>
            <div style={{
              backgroundColor: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {pendingInvites.map((invite, i) => (
                <div
                  key={invite.email}
                  style={{
                    padding: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: i < pendingInvites.length - 1 ? '1px solid #fef08a' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: colors.gray200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      ✉️
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: colors.gray900 }}>
                        {invite.email}
                      </div>
                      <div style={{ fontSize: 12, color: colors.gray500 }}>
                        {invite.role} · Sent {invite.sentAt}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge variant="warning">Pending</Badge>
                    <Button variant="ghost">Resend</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current members */}
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
            Members
          </h2>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            overflow: 'hidden',
          }}>
            {team.map((member, i) => (
              <div
                key={member.id}
                style={{
                  padding: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: i < team.length - 1 ? `1px solid ${colors.gray200}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Avatar
                    initials={member.initials}
                    color={member.color}
                    size="lg"
                    status={member.status}
                  />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: colors.gray900 }}>
                      {member.name}
                    </div>
                    <div style={{ fontSize: 14, color: colors.gray500 }}>
                      {member.role}
                    </div>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add previews/screens/team/
git commit -m "feat: add Team screen with empty, inviting, and pending states"
```

---

### Task 17: Settings Screen

**Files:**
- Create: `previews/screens/settings/index.tsx`
- Create: `previews/screens/settings/saving.tsx`
- Create: `previews/screens/settings/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/screens/settings/config.yaml
kind: screen
id: settings
title: Settings
description: User and workspace settings
status: stable
schemaVersion: "2.0"
tags: [screen, settings, profile]
states:
  default: { description: "Settings form" }
  saving: { description: "Save confirmation" }
```

**Step 2: Create Settings default state**

```tsx
// previews/screens/settings/index.tsx
import { Sidebar } from '../../components/sidebar'
import { Avatar } from '../../components/avatar'
import { Input } from '../../components/input'
import { Button } from '../../components/button'
import { colors, team, brand } from '../../shared/data'

const currentUser = team[0]

export default function Settings() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="settings" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
        }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
            Settings
          </h1>
        </header>

        <div style={{ padding: 32, maxWidth: 640 }}>
          {/* Profile section */}
          <section style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: colors.gray900 }}>
              Profile
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar initials={currentUser.initials} color={currentUser.color} size="lg" />
              <Button variant="secondary">Change Photo</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Full Name" placeholder="Alex Chen" />
              <Input label="Email" type="email" placeholder="alex@example.com" />
              <Input label="Role" placeholder="Project Manager" />
            </div>
          </section>

          {/* Workspace section */}
          <section style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: colors.gray900 }}>
              Workspace
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Workspace Name" placeholder={brand.name} />
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: colors.gray700, display: 'block', marginBottom: 6 }}>
                  Timezone
                </label>
                <select style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: `1px solid ${colors.gray200}`,
                  fontSize: 14,
                  backgroundColor: 'white',
                }}>
                  <option>Pacific Time (PT)</option>
                  <option>Eastern Time (ET)</option>
                  <option>UTC</option>
                </select>
              </div>
            </div>
          </section>

          <Button variant="primary">Save Changes</Button>
        </div>
      </main>
    </div>
  )
}
```

**Step 2: Create Settings saving state**

```tsx
// previews/screens/settings/saving.tsx
import { Sidebar } from '../../components/sidebar'
import { Avatar } from '../../components/avatar'
import { Input } from '../../components/input'
import { colors, team, brand } from '../../shared/data'

const currentUser = team[0]

export default function SettingsSaving() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="settings" />

      <main style={{ flex: 1, backgroundColor: colors.gray50 }}>
        <header style={{
          padding: '16px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
        }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
            Settings
          </h1>
        </header>

        <div style={{ padding: 32, maxWidth: 640 }}>
          {/* Success banner */}
          <div style={{
            backgroundColor: '#d1fae5',
            border: '1px solid #a7f3d0',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ color: colors.success }}>✓</span>
            <span style={{ fontSize: 14, color: '#065f46' }}>Settings saved successfully</span>
          </div>

          {/* Profile section */}
          <section style={{
            backgroundColor: 'white',
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: colors.gray900 }}>
              Profile
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <Avatar initials={currentUser.initials} color={currentUser.color} size="lg" />
              <button style={{
                padding: '8px 16px',
                backgroundColor: colors.gray100,
                border: `1px solid ${colors.gray200}`,
                borderRadius: 6,
                fontSize: 14,
                color: colors.gray700,
                cursor: 'pointer',
              }}>
                Change Photo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Full Name" placeholder="Alex Chen" />
              <Input label="Email" type="email" placeholder="alex@example.com" />
              <Input label="Role" placeholder="Project Manager" />
            </div>
          </section>

          <button
            disabled
            style={{
              padding: '10px 20px',
              backgroundColor: colors.gray200,
              color: colors.gray400,
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'not-allowed',
            }}
          >
            Saved
          </button>
        </div>
      </main>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add previews/screens/settings/
git commit -m "feat: add Settings screen with saving confirmation state"
```

---

### Task 18: Pricing Screen

**Files:**
- Replace: `previews/screens/pricing/index.tsx`
- Create: `previews/screens/pricing/current-plan.tsx`
- Create: `previews/screens/pricing/trial.tsx`
- Update: `previews/screens/pricing/config.yaml`

**Step 1: Update config.yaml with states**

```yaml
# previews/screens/pricing/config.yaml
kind: screen
id: pricing
title: Pricing
description: Plan comparison and selection
status: stable
schemaVersion: "2.0"
tags: [screen, pricing, billing]
states:
  default: { description: "All plans displayed" }
  current-plan: { description: "User's plan highlighted" }
  trial: { description: "Trial countdown banner" }
```

**Step 2: Create Pricing default state**

```tsx
// previews/screens/pricing/index.tsx
import { Button } from '../../components/button'
import { Badge } from '../../components/badge'
import { brand, colors, plans } from '../../shared/data'

export default function Pricing() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.gray50,
      fontFamily: 'system-ui, sans-serif',
      padding: '64px 32px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 700, color: colors.gray900 }}>
            Simple, transparent pricing
          </h1>
          <p style={{ margin: 0, fontSize: 18, color: colors.gray500 }}>
            Choose the plan that's right for your team
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                border: plan.popular ? `2px solid ${colors.primary}` : `1px solid ${colors.gray200}`,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}>
                  <Badge variant="success">Most Popular</Badge>
                </div>
              )}

              <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
                {plan.name}
              </h2>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 48, fontWeight: 700, color: colors.gray900 }}>
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span style={{ fontSize: 16, color: colors.gray500 }}>/user/month</span>
                )}
              </div>

              <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', flex: 1 }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 12,
                      fontSize: 14,
                      color: colors.gray700,
                    }}
                  >
                    <span style={{ color: colors.success }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant={plan.popular ? 'primary' : 'secondary'}>
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Create Pricing current-plan state**

```tsx
// previews/screens/pricing/current-plan.tsx
import { Button } from '../../components/button'
import { Badge } from '../../components/badge'
import { colors, plans } from '../../shared/data'

export default function PricingCurrentPlan() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.gray50,
      fontFamily: 'system-ui, sans-serif',
      padding: '64px 32px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 700, color: colors.gray900 }}>
            Manage your plan
          </h1>
          <p style={{ margin: 0, fontSize: 18, color: colors.gray500 }}>
            You're currently on the <strong>Pro</strong> plan
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {plans.map((plan) => {
            const isCurrent = plan.name === 'Pro'
            return (
              <div
                key={plan.name}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 16,
                  border: isCurrent ? `2px solid ${colors.success}` : `1px solid ${colors.gray200}`,
                  padding: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: plan.name === 'Free' ? 0.6 : 1,
                }}
              >
                {isCurrent && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}>
                    <Badge variant="success">Current Plan</Badge>
                  </div>
                )}

                <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
                  {plan.name}
                </h2>

                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 48, fontWeight: 700, color: colors.gray900 }}>
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ fontSize: 16, color: colors.gray500 }}>/user/month</span>
                  )}
                </div>

                <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', flex: 1 }}>
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 12,
                        fontSize: 14,
                        color: colors.gray700,
                      }}
                    >
                      <span style={{ color: colors.success }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button variant={isCurrent ? 'ghost' : plan.name === 'Enterprise' ? 'secondary' : 'ghost'}>
                  {isCurrent ? 'Current Plan' : plan.name === 'Enterprise' ? 'Contact Sales' : 'Downgrade'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Create Pricing trial state**

```tsx
// previews/screens/pricing/trial.tsx
import { Button } from '../../components/button'
import { Badge } from '../../components/badge'
import { colors, plans } from '../../shared/data'

export default function PricingTrial() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.gray50,
      fontFamily: 'system-ui, sans-serif',
      padding: '64px 32px',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Trial banner */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: 12,
          padding: 20,
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⏰</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#92400e' }}>
                Your Pro trial ends in 7 days
              </div>
              <div style={{ fontSize: 14, color: '#a16207' }}>
                Upgrade now to keep all your Pro features
              </div>
            </div>
          </div>
          <Button variant="primary">Upgrade Now</Button>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 700, color: colors.gray900 }}>
            Choose your plan
          </h1>
          <p style={{ margin: 0, fontSize: 18, color: colors.gray500 }}>
            Upgrade before your trial ends to continue without interruption
          </p>
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                backgroundColor: 'white',
                borderRadius: 16,
                border: plan.popular ? `2px solid ${colors.primary}` : `1px solid ${colors.gray200}`,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}>
                  <Badge variant="success">Recommended</Badge>
                </div>
              )}

              <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
                {plan.name}
              </h2>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 48, fontWeight: 700, color: colors.gray900 }}>
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span style={{ fontSize: 16, color: colors.gray500 }}>/user/month</span>
                )}
              </div>

              <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none', flex: 1 }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 12,
                      fontSize: 14,
                      color: colors.gray700,
                    }}
                  >
                    <span style={{ color: colors.success }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant={plan.popular ? 'primary' : 'secondary'}>
                {plan.name === 'Free' ? 'Downgrade' : plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add previews/screens/pricing/
git commit -m "feat: update Pricing screen with current-plan and trial states"
```

---

### Task 19: Upgrade Success Screen

**Files:**
- Create: `previews/screens/upgrade-success/index.tsx`
- Create: `previews/screens/upgrade-success/config.yaml`

**Step 1: Create config.yaml**

```yaml
# previews/screens/upgrade-success/config.yaml
kind: screen
id: upgrade-success
title: Upgrade Success
description: Plan upgrade confirmation
status: stable
schemaVersion: "2.0"
tags: [screen, billing, success]
states:
  default: { description: "Upgrade complete" }
```

**Step 2: Create Upgrade Success screen**

```tsx
// previews/screens/upgrade-success/index.tsx
import { Button } from '../../components/button'
import { brand, colors } from '../../shared/data'

export default function UpgradeSuccess() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 48,
        maxWidth: 480,
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Success animation */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: '#d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 40,
        }}>
          🎉
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: colors.gray900 }}>
          Welcome to Pro!
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 16, color: colors.gray500, lineHeight: 1.6 }}>
          Your workspace has been upgraded. Enjoy unlimited projects, team members, and advanced features.
        </p>

        {/* New features */}
        <div style={{
          backgroundColor: colors.gray50,
          borderRadius: 12,
          padding: 20,
          marginBottom: 32,
          textAlign: 'left',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
            What's unlocked:
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {['Unlimited projects', 'Unlimited team members', 'Advanced integrations', 'Priority support'].map(feature => (
              <li
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                  fontSize: 14,
                  color: colors.gray700,
                }}
              >
                <span style={{ color: colors.success }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button variant="primary">Go to Dashboard</Button>
          <Button variant="ghost">View Invoice</Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add previews/screens/upgrade-success/
git commit -m "feat: add Upgrade Success screen"
```

---

## Phase 4: Flows

### Task 20: Update Flow Configurations

**Files:**
- Replace: `previews/flows/onboarding/config.yaml`
- Replace: `previews/flows/checkout/config.yaml` → `previews/flows/upgrade/config.yaml`
- Create: `previews/flows/task-lifecycle/config.yaml`

**Step 1: Update Onboarding flow**

```yaml
# previews/flows/onboarding/config.yaml
title: User Onboarding
description: Complete onboarding from signup to first project
tags: [flow, onboarding, auth]
status: stable
category: flows
order: 1

steps:
  - id: signup
    title: Create Account
    description: Enter your details to get started
    screen: signup

  - id: welcome
    title: Welcome to Workflow
    description: Account created successfully
    screen: signup
    state: success

  - id: invite
    title: Invite Your Team
    description: Add team members to collaborate
    screen: team
    state: inviting

  - id: first-project
    title: Create First Project
    description: Set up your first project board
    screen: project-board
    state: empty

  - id: dashboard
    title: You're All Set
    description: Your workspace is ready
    screen: dashboard

transitions:
  - from: signup
    to: welcome
    trigger: submit_form

  - from: welcome
    to: invite
    trigger: click_continue

  - from: invite
    to: first-project
    trigger: skip_or_send

  - from: first-project
    to: dashboard
    trigger: create_project
```

**Step 2: Create Task Lifecycle flow**

```yaml
# previews/flows/task-lifecycle/config.yaml
title: Task Lifecycle
description: Complete task journey from board to completion
tags: [flow, tasks, productivity]
status: stable
category: flows
order: 2

steps:
  - id: board
    title: View Board
    description: Browse tasks on the kanban board
    screen: project-board

  - id: detail
    title: Open Task
    description: View task details and comments
    screen: task-detail

  - id: edit
    title: Update Task
    description: Edit task fields and add comments
    screen: task-detail
    state: editing

  - id: complete
    title: Task Complete
    description: Mark the task as done
    screen: task-detail
    state: completed

transitions:
  - from: board
    to: detail
    trigger: click_task

  - from: detail
    to: edit
    trigger: click_edit

  - from: edit
    to: complete
    trigger: mark_complete
```

**Step 3: Create Upgrade flow**

```yaml
# previews/flows/upgrade/config.yaml
title: Upgrade Flow
description: Free to Pro upgrade journey
tags: [flow, billing, upgrade]
status: stable
category: flows
order: 3

steps:
  - id: trial
    title: Trial Reminder
    description: View trial status and plan options
    screen: pricing
    state: trial

  - id: select
    title: Select Plan
    description: Choose Pro plan to upgrade
    screen: pricing
    state: default

  - id: success
    title: Welcome to Pro
    description: Upgrade complete
    screen: upgrade-success

transitions:
  - from: trial
    to: select
    trigger: click_upgrade

  - from: select
    to: success
    trigger: confirm_upgrade
```

**Step 4: Remove old checkout flow and commit**

```bash
rm -rf previews/flows/checkout
git add previews/flows/
git commit -m "feat: update flows for Workflow design system"
```

---

## Phase 5: Cleanup

### Task 21: Remove Old Demo Content

**Files:**
- Delete: `previews/components/card/index.tsx`
- Delete: `previews/screens/product-page/`
- Delete: `previews/screens/cart/`
- Delete: `previews/screens/checkout-success/`
- Delete: `previews/demo/`
- Delete: `previews/button-demo/`
- Delete: `previews/card-demo/`
- Delete: `previews/input-demo/`

**Step 1: Remove old files**

```bash
rm -rf previews/components/card
rm -rf previews/screens/product-page
rm -rf previews/screens/cart
rm -rf previews/screens/checkout-success
rm -rf previews/demo
rm -rf previews/button-demo
rm -rf previews/card-demo
rm -rf previews/input-demo
```

**Step 2: Commit cleanup**

```bash
git add -A
git commit -m "chore: remove old e-commerce demo content"
```

---

### Task 22: Final Verification

**Step 1: Type check the entire project**

Run: `bunx @typescript/native-preview --noEmit`
Expected: No type errors

**Step 2: Start dev server and verify all previews**

Run: `bun run dev`

Verify these URLs work:
- `/components/button` - Button variants
- `/components/avatar` - Avatar sizes and statuses
- `/components/badge` - Badge variants
- `/components/tag` - Tag colors
- `/components/input` - Input states
- `/components/progress` - Progress bars
- `/components/task-card` - Task cards
- `/components/project-card` - Project cards
- `/components/empty-state` - Empty states
- `/components/sidebar` - Sidebar navigation
- `/screens/login` - Login default
- `/screens/login/error` - Login error
- `/screens/signup` - Signup
- `/screens/signup/success` - Signup success
- `/screens/dashboard` - Dashboard
- `/screens/dashboard/empty` - Dashboard empty
- `/screens/project-board` - Board
- `/screens/project-board/empty` - Board empty
- `/screens/project-board/filtered` - Board filtered
- `/screens/task-detail` - Task detail
- `/screens/task-detail/editing` - Task editing
- `/screens/task-detail/completed` - Task completed
- `/screens/task-detail/blocked` - Task blocked
- `/screens/team` - Team
- `/screens/team/empty` - Team empty
- `/screens/team/inviting` - Team invite modal
- `/screens/team/pending` - Team pending invites
- `/screens/settings` - Settings
- `/screens/settings/saving` - Settings saved
- `/screens/pricing` - Pricing
- `/screens/pricing/current-plan` - Current plan
- `/screens/pricing/trial` - Trial banner
- `/screens/upgrade-success` - Upgrade success
- `/flows/onboarding` - Onboarding flow
- `/flows/task-lifecycle` - Task lifecycle flow
- `/flows/upgrade` - Upgrade flow

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Workflow design system implementation"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1 | Shared data foundation |
| 2 | 2-10 | Core components (9 total) |
| 3 | 11-19 | Screens with states (9 screens, 24 states) |
| 4 | 20 | Flow configurations (3 flows) |
| 5 | 21-22 | Cleanup and verification |

**Total: 22 tasks**
