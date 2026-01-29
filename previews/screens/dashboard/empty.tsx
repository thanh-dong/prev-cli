import { Sidebar } from '../../components/sidebar'
import { EmptyState } from '../../components/empty-state'
import { brand, colors, emptyStates, currentUser } from '../../shared/data'

export default function DashboardEmpty() {
  const firstName = currentUser.name.split(' ')[0]

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
        }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: colors.gray900 }}>
            Good morning, {firstName}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: colors.gray500 }}>
            Let's get started with your first project
          </p>
        </header>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 100px)',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 16,
            border: `1px solid ${colors.gray200}`,
            maxWidth: 400,
          }}>
            <EmptyState icon="📁" {...emptyStates.dashboard} />
          </div>
        </div>
      </main>
    </div>
  )
}
