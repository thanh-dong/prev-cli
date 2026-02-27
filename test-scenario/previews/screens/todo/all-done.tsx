const todos = [
  { text: 'Buy groceries', done: true },
  { text: 'Walk the dog', done: true },
  { text: 'Read a book', done: true },
  { text: 'Call the dentist', done: true },
  { text: 'Fix the leaky faucet', done: true },
]

export default function TodoAllDoneScreen() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1a1a1a' }}>My Todos</h1>
          <span style={{ fontSize: '14px', color: '#16a34a', fontWeight: 600 }}>All done!</span>
        </div>

        {/* Full progress bar */}
        <div style={{
          height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px',
          marginBottom: '24px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: '100%',
            backgroundColor: '#16a34a', borderRadius: '3px',
          }} />
        </div>

        {/* Celebration banner */}
        <div style={{
          padding: '24px', marginBottom: '24px', textAlign: 'center',
          backgroundColor: '#f0fdf4', borderRadius: '12px',
          border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
          <p style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 600, color: '#15803d' }}>
            All tasks complete!
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#4ade80' }}>
            You've finished everything on your list
          </p>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {todos.map((todo, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', backgroundColor: '#fff',
              borderRadius: '10px', border: '1px solid #eee', opacity: 0.7,
            }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                backgroundColor: '#16a34a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '13px',
              }}>✓</div>
              <span style={{
                fontSize: '15px', color: '#aaa', textDecoration: 'line-through',
              }}>{todo.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
