// Generates an SVG placeholder image for OG preview cards
// Returns a styled SVG with the preview title, type, and state/step info

const TYPE_ICONS: Record<string, string> = {
  component: '◇',
  screen: '▣',
  flow: '⇢',
}

const TYPE_COLORS: Record<string, string> = {
  component: '#6366f1',
  screen: '#8b5cf6',
  flow: '#06b6d4',
}

export function generateOgImage(opts: {
  title: string
  type: string
  state?: string
  step?: string
  description?: string
}): string {
  const icon = TYPE_ICONS[opts.type] || '◇'
  const color = TYPE_COLORS[opts.type] || '#6366f1'
  const subtitle = opts.step
    ? `Step: ${opts.step}`
    : opts.state
    ? `State: ${opts.state}`
    : opts.type

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="#1e1e3f" stroke="${color}" stroke-width="2" opacity="0.6"/>
  <text x="120" y="260" font-family="system-ui,sans-serif" font-size="96" fill="${color}">${icon}</text>
  <text x="120" y="380" font-family="system-ui,sans-serif" font-size="48" font-weight="700" fill="#e2e8f0">${escapeXml(opts.title)}</text>
  <text x="120" y="430" font-family="system-ui,sans-serif" font-size="24" fill="#94a3b8">${escapeXml(subtitle)}</text>
  ${opts.description ? `<text x="120" y="480" font-family="system-ui,sans-serif" font-size="20" fill="#64748b">${escapeXml(opts.description.slice(0, 80))}</text>` : ''}
  <text x="1080" y="530" font-family="system-ui,sans-serif" font-size="18" fill="#475569" text-anchor="end">prev-cli</text>
</svg>`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function handleOgImageRequest(req: Request, previewUnits: Array<{ name: string; type: string; config?: { title?: string; description?: string } | null }>): Response | null {
  const url = new URL(req.url)
  if (!url.pathname.startsWith('/_og/')) return null

  const path = url.pathname.slice(5) // strip /_og/
  const state = url.searchParams.get('state') || undefined
  const step = url.searchParams.get('step') || undefined

  // Find matching preview unit
  const unit = previewUnits.find(u => `${u.type}s/${u.name}` === path || u.name === path)

  const title = unit?.config?.title || path.split('/').pop() || 'Preview'
  const type = unit?.type || path.split('/')[0]?.replace(/s$/, '') || 'preview'

  const svg = generateOgImage({
    title,
    type,
    state,
    step,
    description: unit?.config?.description,
  })

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
