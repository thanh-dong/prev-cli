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
      height: '100vh',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <Sidebar activeItem="settings" />

      <main style={{ flex: 1, backgroundColor: colors.gray50, overflowY: 'auto' }}>
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
