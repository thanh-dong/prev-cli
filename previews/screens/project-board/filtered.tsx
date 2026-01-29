import { Sidebar } from '../../components/sidebar'
import { TaskCard } from '../../components/task-card'
import { Avatar } from '../../components/avatar'
import { Progress } from '../../components/progress'
import { Badge } from '../../components/badge'
import { Tag } from '../../components/tag'
import { colors, project, team, tasks, tagColors } from '../../shared/data'

// Filter by Backend tag
const filteredTasks = tasks.filter(t => t.tag === 'Backend') as typeof tasks[number][]
const columns = [
  { id: 'todo', label: 'To Do', tasks: filteredTasks.filter(t => t.column === 'todo') },
  { id: 'doing', label: 'In Progress', tasks: filteredTasks.filter(t => t.column === 'doing') },
  { id: 'done', label: 'Done', tasks: filteredTasks.filter(t => t.column === 'done') },
]

export default function ProjectBoardFiltered() {
  const statusBadge = {
    'on-track': { variant: 'success' as const, label: 'On Track' },
    'at-risk': { variant: 'warning' as const, label: 'At Risk' },
    'complete': { variant: 'success' as const, label: 'Complete' },
  }[project.status]

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="project" />

      <main style={{ flex: 1, backgroundColor: colors.gray50, display: 'flex', flexDirection: 'column' }}>
        {/* Project Header */}
        <header style={{
          padding: '20px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
                  {project.name}
                </h1>
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: colors.gray500 }}>
                {project.goal}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', marginLeft: 8 }}>
                {team.map((member, i) => (
                  <div key={member.id} style={{ marginLeft: i === 0 ? 0 : -8, position: 'relative', zIndex: team.length - i }}>
                    <Avatar initials={member.initials} color={member.color} size="md" />
                  </div>
                ))}
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, maxWidth: 400 }}>
            <Progress value={project.progress} showLabel />
          </div>
        </header>

        {/* Filter Bar */}
        <div style={{
          padding: '12px 32px',
          backgroundColor: 'white',
          borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 14, color: colors.gray500 }}>Filtered by:</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px 4px 4px',
            backgroundColor: colors.gray100,
            borderRadius: 6,
          }}>
            <Tag color={tagColors.Backend}>Backend</Tag>
            <button style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: 14,
              color: colors.gray500,
              display: 'flex',
              alignItems: 'center',
            }}>
              x
            </button>
          </div>
          <Badge>{filteredTasks.length} results</Badge>
        </div>

        {/* Kanban Board */}
        <div style={{
          flex: 1,
          padding: 24,
          display: 'flex',
          gap: 20,
          overflowX: 'auto',
        }}>
          {columns.map(column => (
            <div key={column.id} style={{
              flex: '1 0 320px',
              maxWidth: 400,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
                    {column.label}
                  </h3>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: colors.gray200,
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    color: colors.gray500,
                  }}>
                    {column.tasks.length}
                  </span>
                </div>
              </div>
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: 4,
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
