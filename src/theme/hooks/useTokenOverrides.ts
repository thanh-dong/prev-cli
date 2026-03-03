import { useState, useCallback } from 'react'
import { storage } from '../storage'
import type { TokenOverride } from '../types'

const STORAGE_KEY = 'token-overrides'

export function useTokenOverrides() {
  const [overrides, setOverrides] = useState<TokenOverride[]>(
    () => storage.get<TokenOverride[]>(STORAGE_KEY) ?? []
  )

  const persist = (next: TokenOverride[]) => {
    storage.set(STORAGE_KEY, next)
    setOverrides(next)
  }

  const setOverride = useCallback(
    (category: string, name: string, originalValue: string, newValue: string) => {
      setOverrides(prev => {
        const idx = prev.findIndex(o => o.category === category && o.name === name)
        const entry: TokenOverride = { category, name, originalValue, overrideValue: newValue }
        const next = idx >= 0
          ? prev.map((o, i) => (i === idx ? entry : o))
          : [...prev, entry]
        storage.set(STORAGE_KEY, next)
        return next
      })
    },
    [],
  )

  const removeOverride = useCallback(
    (category: string, name: string) => {
      setOverrides(prev => {
        const next = prev.filter(o => !(o.category === category && o.name === name))
        storage.set(STORAGE_KEY, next)
        return next
      })
    },
    [],
  )

  const resetAll = useCallback(() => {
    persist([])
  }, [])

  const toCssOverrides = useCallback((): string => {
    if (overrides.length === 0) return ''
    const declarations = overrides
      .map(o => `  --prev-token-${o.category}-${o.name}: ${o.overrideValue};`)
      .join('\n')
    return `:root {\n${declarations}\n}`
  }, [overrides])

  return { overrides, setOverride, removeOverride, resetAll, toCssOverrides }
}
