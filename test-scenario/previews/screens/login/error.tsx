export default function LoginErrorScreen() {
  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Login</h1>
      <div style={{ padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '4px', marginBottom: '16px' }}>
        Invalid email or password. Please try again.
      </div>
      <input type="email" placeholder="Email" style={{ width: '100%', padding: '8px', marginBottom: '12px', borderColor: '#dc2626' }} />
      <input type="password" placeholder="Password" style={{ width: '100%', padding: '8px', marginBottom: '12px' }} />
      <button style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>
        Sign In
      </button>
    </div>
  )
}
