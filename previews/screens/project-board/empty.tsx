import { Sidebar } from '../../components/sidebar'
import { Avatar } from '../../components/avatar'
import { Progress } from '../../components/progress'
import { Badge } from '../../components/badge'
import { EmptyState } from '../../components/empty-state'
import { colors, project, team, emptyStates } from '../../shared/data'

export default function ProjectBoardEmpty() {
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
            <Progress value={0} showLabel />
          </div>
        </header>

        {/* Empty State */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
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
