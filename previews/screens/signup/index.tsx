import { Input } from '../../components/input'
import { Button } from '../../components/button'
import { brand, colors } from '../../shared/data'

export default function Signup() {
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
        padding: 40,
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
          Create your account
        </h1>
        <p style={{ margin: '0 0 32px', color: colors.gray500, textAlign: 'center', fontSize: 14 }}>
          {brand.tagline}
        </p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Full name" placeholder="Alex Chen" />
          <Input label="Work email" type="email" placeholder="you@company.com" />
          <Input label="Password" type="password" placeholder="Create a password" />
          <Button variant="primary">Create Account</Button>
        </form>

        <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: 14, color: colors.gray500 }}>
          Already have an account?{' '}
          <a href="#" style={{ color: colors.primary, textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
