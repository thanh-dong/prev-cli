import { Box, Text, toReact, type VNodeType } from '@prev/jsx'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  children: string
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

// Button primitive that returns VNode
export function ButtonPrimitive({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false
}: ButtonProps): VNodeType {
  const bg = {
    primary: 'primary',
    secondary: 'secondary',
    danger: 'destructive',
    ghost: 'transparent',
  }[variant] as 'primary' | 'secondary' | 'destructive' | 'transparent'

  const textColor = {
    primary: 'primary-foreground',
    secondary: 'secondary-foreground',
    danger: 'destructive-foreground',
    ghost: 'foreground',
  }[variant] as 'primary-foreground' | 'secondary-foreground' | 'destructive-foreground' | 'foreground'

  const padding = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  }[size] as 'sm' | 'md' | 'lg'

  const textSize = {
    sm: 'sm',
    md: 'base',
    lg: 'lg',
  }[size] as 'sm' | 'base' | 'lg'

  return Box({
    bg,
    padding,
    radius: 'md',
    children: Text({
      children,
      size: textSize,
      weight: 'semibold',
      color: textColor,
    })
  })
}

// React component wrapper
export function Button(props: ButtonProps) {
  return toReact(ButtonPrimitive(props))
}

// Default export shows button variants demo
export default function ButtonDemo() {
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="lg">Large</Button>
    </div>
  )
}
