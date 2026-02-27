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
      height: '100vh',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="team" />

      <main style={{ flex: 1, backgroundColor: colors.gray50, overflowY: 'auto' }}>
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
