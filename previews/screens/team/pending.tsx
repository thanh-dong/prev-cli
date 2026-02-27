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
