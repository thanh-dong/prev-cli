import { Input } from '../../components/input'
import { Button } from '../../components/button'
import { brand, colors } from '../../shared/data'

export default function LoginError() {
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
        background: 'white',
        padding: 32,
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: 400,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${colors.primary} 0%, #7c3aed 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: 'white',
          }}>
            ⚡
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: colors.gray900 }}>{brand.name}</span>
        </div>

        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 600, textAlign: 'center', color: colors.gray900 }}>
          Welcome back
        </h1>
        <p style={{ margin: '0 0 32px', color: colors.gray500, textAlign: 'center', fontSize: 14 }}>
          Sign in to continue to {brand.name}
        </p>

        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ color: colors.error }}>⚠</span>
          <span style={{ fontSize: 14, color: '#991b1b' }}>Invalid email or password. Please try again.</span>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Email" type="email" placeholder="you@example.com" state="error" />
          <Input label="Password" type="password" placeholder="Enter your password" state="error" />
          <Button variant="primary">Sign In</Button>
        </form>

        <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 14, color: colors.gray500 }}>
          Don't have an account?{' '}
          <a href="#" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 500 }}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
