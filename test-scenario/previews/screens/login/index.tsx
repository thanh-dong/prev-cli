export default function LoginScreen() {
  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Login</h1>
      <input type="email" placeholder="Email" style={{ width: '100%', padding: '8px', marginBottom: '12px' }} />
      <input type="password" placeholder="Password" style={{ width: '100%', padding: '8px', marginBottom: '12px' }} />
      <button style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>
        Sign In
      </button>
    </div>
  )
}
