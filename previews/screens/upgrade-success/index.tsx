// previews/screens/upgrade-success/index.tsx
import { Button } from '../../components/button'
import { brand, colors } from '../../shared/data'

export default function UpgradeSuccess() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
      padding: '32px 0',
      boxSizing: 'border-box',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 36,
        maxWidth: 480,
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Success animation */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: '#d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 40,
        }}>
          🎉
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: colors.gray900 }}>
          Welcome to Pro!
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 16, color: colors.gray500, lineHeight: 1.6 }}>
          Your workspace has been upgraded. Enjoy unlimited projects, team members, and advanced features.
        </p>

        {/* New features */}
        <div style={{
          backgroundColor: colors.gray50,
          borderRadius: 12,
          padding: 20,
          marginBottom: 32,
          textAlign: 'left',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
            What's unlocked:
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {['Unlimited projects', 'Unlimited team members', 'Advanced integrations', 'Priority support'].map(feature => (
              <li
                key={feature}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                  fontSize: 14,
                  color: colors.gray700,
                }}
              >
                <span style={{ color: colors.success }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button variant="primary">Go to Dashboard</Button>
          <Button variant="ghost">View Invoice</Button>
        </div>
      </div>
    </div>
  )
}
