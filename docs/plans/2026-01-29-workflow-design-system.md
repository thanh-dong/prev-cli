# Workflow Design System

> Design system demo for a fictional SaaS project management tool

**Product:** Workflow
**Tagline:** "Ship faster, together"
**Date:** 2026-01-29
**Status:** Approved

---

## 1. Product Identity

### Brand

| Element | Value |
|---------|-------|
| Name | Workflow |
| Tagline | "Ship faster, together" |
| Primary Color | Indigo `#4f46e5` |
| Success Color | Emerald `#10b981` |
| Warning Color | Amber `#f59e0b` |
| Error Color | Red `#ef4444` |

### Design Language

- Modern, clean SaaS aesthetic
- Consistent sidebar navigation across all screens
- Card-based layouts with subtle shadows
- System font stack for performance

---

## 2. Components

### Core Components

| Component | Variants | Description |
|-----------|----------|-------------|
| **Button** | `primary`, `secondary`, `ghost`, `danger` | Action triggers (keep existing) |
| **Avatar** | `sm`, `md`, `lg` + optional status dot | Team member representation |
| **Badge** | `default`, `success`, `warning`, `error` | Status indicators |
| **Input** | `default`, `error`, `disabled` | Form fields |
| **Tag** | color variants | Task labels (Backend, UX, QA, etc.) |
| **Progress** | percentage-based | Project/task completion |

### Composite Components

| Component | Variants | Description |
|-----------|----------|-------------|
| **TaskCard** | `default`, `completed` | Kanban board items |
| **ProjectCard** | `default`, `active` | Dashboard project tiles |
| **Sidebar** | `expanded`, `collapsed` | App navigation |
| **Modal** | `default` | Dialogs and forms |
| **Toast** | `success`, `error`, `info` | Notifications |
| **EmptyState** | with illustration slot | Zero-data states |
| **ActivityItem** | `comment`, `status-change`, `assignment` | Timeline entries |

---

## 3. Screens & States

### Authentication

| Screen | States | Description |
|--------|--------|-------------|
| **Login** | `default`, `error` | Email/password form |
| **Signup** | `default`, `success` | Account creation |

### Main App

| Screen | States | Description |
|--------|--------|-------------|
| **Dashboard** | `default`, `empty` | Project overview, recent activity |
| **Project Board** | `default`, `empty`, `filtered` | Kanban view with columns |
| **Task Detail** | `default`, `editing`, `completed`, `blocked` | Single task view |
| **Team** | `default`, `empty`, `inviting`, `pending` | Member management |
| **Settings** | `default`, `saving` | Profile & workspace settings |

### Billing

| Screen | States | Description |
|--------|--------|-------------|
| **Pricing** | `default`, `current-plan`, `trial` | Plan comparison |
| **Upgrade Success** | `default` | Confirmation |

---

## 4. Flows

### 4.1 Onboarding Flow (5 steps)

User journey from signup to first project.

| Step | Screen | State | Title | Description |
|------|--------|-------|-------|-------------|
| 1 | Signup | default | Create Account | Enter email and password |
| 2 | Signup | success | Welcome to Workflow | Account created, workspace ready |
| 3 | Team | inviting | Invite Your Team | Add team members by email |
| 4 | Project Board | empty | Create First Project | Empty board with CTA |
| 5 | Dashboard | default | You're All Set | Fully configured workspace |

### 4.2 Task Lifecycle Flow (4 steps)

Complete task journey from creation to completion.

| Step | Screen | State | Title | Description |
|------|--------|-------|-------|-------------|
| 1 | Project Board | default | View Board | Kanban with tasks in columns |
| 2 | Task Detail | default | Open Task | View task details and comments |
| 3 | Task Detail | editing | Update Task | Edit fields, add comment |
| 4 | Task Detail | completed | Task Complete | Marked done with celebration |

### 4.3 Upgrade Flow (4 steps)

Free to paid conversion journey.

| Step | Screen | State | Title | Description |
|------|--------|-------|-------|-------------|
| 1 | Pricing | trial | View Plans | Trial banner, plan comparison |
| 2 | Pricing | current-plan | Select Pro | Pro plan highlighted |
| 3 | Settings | saving | Processing | Payment confirmation |
| 4 | Upgrade Success | default | Welcome to Pro | New features unlocked |

---

## 5. Demo Data

### Project

```yaml
name: "Product Launch Q1"
goal: "Ship v2 by March 31 with 3 pilot customers"
status: "At risk"
risk: "Vendor delay on payment integration"
owner: "Alex Chen"
tags: ["Growth", "Web", "Mobile"]
progress: 42

milestones:
  - name: "Alpha"
    date: "Feb 10"
    status: "complete"
  - name: "Beta"
    date: "Mar 1"
    status: "in-progress"
  - name: "Launch"
    date: "Mar 31"
    status: "upcoming"
```

### Team Members

| Name | Role | Avatar Color | Status |
|------|------|--------------|--------|
| Alex Chen | Project Manager | Blue | Online |
| Jordan Lee | Designer | Purple | Online |
| Sam Rivera | Engineer | Green | Away |
| Taylor Kim | QA | Orange | Offline |

### Tasks

| Task | Assignee | Due | Tag | Status | Column |
|------|----------|-----|-----|--------|--------|
| Finalize launch messaging | Jordan | Feb 3 | Marketing | In Progress | Doing |
| Implement feature flags | Sam | Feb 12 | Backend | Blocked | Doing |
| QA test plan for checkout | Taylor | Feb 15 | QA | To Do | To Do |
| Set up analytics dashboards | Alex | Feb 18 | Data | To Do | To Do |
| Design onboarding tooltips | Jordan | Feb 20 | UX | In Progress | Doing |
| API integration review | Sam | Feb 6 | Backend | Done | Done |
| Competitor analysis | Alex | Jan 28 | Research | Done | Done |

### Activity Feed

```yaml
- type: "comment"
  user: "Sam Rivera"
  task: "Implement feature flags"
  content: "API review scheduled with Payments team on Feb 6"
  time: "2 hours ago"

- type: "status-change"
  user: "Jordan Lee"
  task: "Finalize launch messaging"
  from: "To Do"
  to: "In Progress"
  time: "4 hours ago"

- type: "assignment"
  user: "Alex Chen"
  task: "QA test plan for checkout"
  assignee: "Taylor Kim"
  time: "Yesterday"

- type: "comment"
  user: "Jordan Lee"
  task: "Design onboarding tooltips"
  content: "Updated Figma link for onboarding flow"
  time: "Yesterday"
```

---

## 6. Empty State Copy

| Screen | Headline | Body | CTA |
|--------|----------|------|-----|
| Dashboard | No projects yet | Start with a template or create from scratch. | Create Project |
| Project Board | No tasks yet | Move work forward by adding your first task. | Add Task |
| Team | No team members | Teams ship faster together. Invite your crew. | Invite Team |
| Filtered (no results) | No tasks match | Try adjusting your filters. | Clear Filters |
| Activity | No activity yet | Project updates will show up here. | Create a Task |

---

## 7. File Structure

```
previews/
├── components/
│   ├── button/index.tsx
│   ├── avatar/index.tsx
│   ├── badge/index.tsx
│   ├── input/index.tsx
│   ├── tag/index.tsx
│   ├── progress/index.tsx
│   ├── task-card/index.tsx
│   ├── project-card/index.tsx
│   ├── sidebar/index.tsx
│   ├── modal/index.tsx
│   ├── toast/index.tsx
│   ├── empty-state/index.tsx
│   └── activity-item/index.tsx
├── screens/
│   ├── login/
│   │   ├── index.tsx        # default
│   │   └── error.tsx
│   ├── signup/
│   │   ├── index.tsx        # default
│   │   └── success.tsx
│   ├── dashboard/
│   │   ├── index.tsx        # default
│   │   └── empty.tsx
│   ├── project-board/
│   │   ├── index.tsx        # default
│   │   ├── empty.tsx
│   │   └── filtered.tsx
│   ├── task-detail/
│   │   ├── index.tsx        # default
│   │   ├── editing.tsx
│   │   ├── completed.tsx
│   │   └── blocked.tsx
│   ├── team/
│   │   ├── index.tsx        # default
│   │   ├── empty.tsx
│   │   ├── inviting.tsx
│   │   └── pending.tsx
│   ├── settings/
│   │   ├── index.tsx        # default
│   │   └── saving.tsx
│   ├── pricing/
│   │   ├── index.tsx        # default
│   │   ├── current-plan.tsx
│   │   └── trial.tsx
│   └── upgrade-success/
│       └── index.tsx
└── flows/
    ├── onboarding/config.yaml
    ├── task-lifecycle/config.yaml
    └── upgrade/config.yaml
```

---

## 8. Implementation Notes

### Shared Layout

All main app screens (Dashboard, Board, Task, Team, Settings) share:
- Sidebar with Workflow logo, project list, team link, settings
- Top bar with search, notifications bell, user avatar
- Consistent padding and max-width

### Component Reuse

- TaskCard used in Project Board and Dashboard (recent tasks)
- Avatar used everywhere (sidebar, team, task assignees, comments)
- Badge used for task status, plan tiers, notification counts
- EmptyState component reused across all empty states with different props

### State File Convention

Each screen state is a separate file:
- `index.tsx` = default state
- `<state-name>.tsx` = alternate states

This allows direct linking to specific states in flows.
