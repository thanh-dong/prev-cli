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
