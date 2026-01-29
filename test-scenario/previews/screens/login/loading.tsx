export default function LoginLoadingScreen() {
  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Login</h1>
      <input type="email" placeholder="Email" disabled style={{ width: '100%', padding: '8px', marginBottom: '12px', opacity: 0.5 }} />
      <input type="password" placeholder="Password" disabled style={{ width: '100%', padding: '8px', marginBottom: '12px', opacity: 0.5 }} />
      <button disabled style={{ width: '100%', padding: '12px', background: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px' }}>
        Signing in...
      </button>
    </div>
  )
}
