import { useState, useCallback } from 'react'
import { storage } from '../storage'

export function useStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => storage.get<T>(key) ?? initial)

  const update = useCallback((v: T) => {
    storage.set(key, v)
    setValue(v)
  }, [key])

  return [value, update]
}

export function useStorageList<T>(prefix: string): [T[], () => void] {
  const load = () =>
    storage.list(prefix).map(k => storage.get<T>(k)).filter(Boolean) as T[]

  const [items, setItems] = useState<T[]>(load)

  const refresh = useCallback(() => {
    setItems(load())
  }, [prefix])

  return [items, refresh]
}
