// previews/screens/team/empty.tsx
import { Sidebar } from '../../components/sidebar'
import { EmptyState } from '../../components/empty-state'
import { colors, emptyStates } from '../../shared/data'

export default function TeamEmpty() {
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
        }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
            Team
          </h1>
        </header>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
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
