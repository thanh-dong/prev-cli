export type InputState = 'default' | 'error' | 'disabled'

export interface InputProps {
  placeholder?: string
  type?: 'text' | 'email' | 'password'
  state?: InputState
  label?: string
  error?: string
}

export function Input({ placeholder, type = 'text', state = 'default', label, error }: InputProps) {
  const borderColor = state === 'error' ? '#ef4444' : '#e5e7eb'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        disabled={state === 'disabled'}
        style={{
          padding: '10px 12px',
          borderRadius: 6,
          border: `1px solid ${borderColor}`,
          fontSize: 14,
          backgroundColor: state === 'disabled' ? '#f3f4f6' : 'white',
          color: state === 'disabled' ? '#9ca3af' : '#111827',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {state === 'error' && error && (
        <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>
      )}
    </div>
  )
}

// Demo
export default function InputDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 320 }}>
      <Input label="Email" placeholder="you@example.com" type="email" />
      <Input label="Password" placeholder="Enter password" type="password" state="error" error="Password is required" />
      <Input label="Disabled" placeholder="Cannot edit" state="disabled" />
    </div>
  )
}
