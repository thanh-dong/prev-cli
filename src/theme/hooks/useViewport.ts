import { useState, useCallback } from 'react'
import { storage } from '../storage'

export type Viewport = 'mobile' | 'tablet' | 'desktop'

export const VIEWPORT_WIDTHS: Record<Viewport, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
}

export function useViewport(): [Viewport, (v: Viewport) => void] {
  const [viewport, setViewportState] = useState<Viewport>(
    () => storage.get<Viewport>('viewport-pref') ?? 'desktop'
  )

  const setViewport = useCallback((v: Viewport) => {
    storage.set('viewport-pref', v)
    setViewportState(v)
  }, [])

  return [viewport, setViewport]
}
