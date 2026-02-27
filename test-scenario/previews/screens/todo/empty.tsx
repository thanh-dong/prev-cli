export default function TodoEmptyScreen() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1a1a1a' }}>My Todos</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          <input
            placeholder="Add a new todo..."
            style={{
              flex: 1, padding: '12px 16px', fontSize: '15px',
              border: '1px solid #e0e0e0', borderRadius: '10px',
              backgroundColor: '#fff', outline: 'none',
            }}
          />
          <button style={{
            padding: '12px 20px', fontSize: '15px', fontWeight: 600,
            backgroundColor: '#2563eb', color: '#fff', border: 'none',
            borderRadius: '10px', cursor: 'pointer',
          }}>Add</button>
        </div>

        <div style={{
          padding: '48px 20px', textAlign: 'center',
          backgroundColor: '#fff', borderRadius: '12px',
          border: '1px dashed #ddd',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
          <p style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 600, color: '#1a1a1a' }}>
            No todos yet
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
            Add your first task to get started
          </p>
        </div>
      </div>
    </div>
  )
}
