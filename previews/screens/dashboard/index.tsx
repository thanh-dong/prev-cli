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
