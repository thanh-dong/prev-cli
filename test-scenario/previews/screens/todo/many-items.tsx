const todos = [
  { text: 'Buy groceries', done: true },
  { text: 'Walk the dog', done: true },
  { text: 'Read a book', done: false },
  { text: 'Call the dentist', done: false },
  { text: 'Fix the leaky faucet', done: false },
  { text: 'Write weekly report', done: true },
  { text: 'Clean the kitchen', done: false },
  { text: 'Update resume', done: false },
]

const doneCount = todos.filter(t => t.done).length

export default function TodoManyItemsScreen() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1a1a1a' }}>My Todos</h1>
          <span style={{ fontSize: '14px', color: '#888' }}>{doneCount} of {todos.length} done</span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px',
          marginBottom: '24px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${(doneCount / todos.length) * 100}%`,
            backgroundColor: '#2563eb', borderRadius: '3px',
            transition: 'width 0.3s',
          }} />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
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

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {todos.map((todo, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', backgroundColor: '#fff',
              borderRadius: '10px', border: '1px solid #eee',
            }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                border: todo.done ? 'none' : '2px solid #ccc',
                backgroundColor: todo.done ? '#2563eb' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '13px',
              }}>
                {todo.done && '✓'}
              </div>
              <span style={{
                fontSize: '15px', color: todo.done ? '#aaa' : '#1a1a1a',
                textDecoration: todo.done ? 'line-through' : 'none',
              }}>{todo.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
