import { Button } from '../../components/button'
import { brand, colors } from '../../shared/data'

export default function SignupSuccess() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'white',
        padding: 48,
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: 400,
        textAlign: 'center',
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          backgroundColor: '#d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 32,
        }}>
          ✓
        </div>

        <h1 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 700, color: colors.gray900 }}>
          Welcome to {brand.name}!
        </h1>
        <p style={{ margin: '0 0 32px', color: colors.gray500, fontSize: 16, lineHeight: 1.5 }}>
          Your workspace is ready. Let's set up your first project.
        </p>

        <Button variant="primary">Continue to Setup</Button>
      </div>
    </div>
  )
}
