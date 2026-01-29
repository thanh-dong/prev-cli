import { Avatar } from '../avatar'
import { brand, team, project } from '../../shared/data'

export interface SidebarProps {
  activeItem?: 'dashboard' | 'project' | 'team' | 'settings'
}

const navItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'project', icon: '📋', label: project.name },
  { id: 'team', icon: '👥', label: 'Team' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
] as const

export function Sidebar({ activeItem = 'dashboard' }: SidebarProps) {
  const currentUser = team[0]

  return (
    <div style={{
      width: 240,
      height: '100%',
      backgroundColor: '#111827',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}>
            ⚡
          </div>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{brand.name}</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {navItems.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 6,
              marginBottom: 4,
              backgroundColor: activeItem === item.id ? '#374151' : 'transparent',
              color: activeItem === item.id ? 'white' : '#9ca3af',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid #374151', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar initials={currentUser.initials} color={currentUser.color} size="md" status="online" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{currentUser.name}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{currentUser.role}</div>
        </div>
      </div>
    </div>
  )
}

export default function SidebarDemo() {
  return (
    <div style={{ display: 'flex', gap: 24, height: 500 }}>
      <Sidebar activeItem="dashboard" />
      <Sidebar activeItem="project" />
    </div>
  )
}
