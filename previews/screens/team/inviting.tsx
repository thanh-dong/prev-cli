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
