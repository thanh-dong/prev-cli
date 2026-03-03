import { test, expect, describe, beforeEach } from 'bun:test'
import { PrefixedStorageAdapter } from './storage'

function createMemoryBackend() {
  const store = new Map<string, string>()
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size },
    _store: store,
  }
}

describe('PrefixedStorageAdapter', () => {
  let backend: ReturnType<typeof createMemoryBackend>
  let storage: PrefixedStorageAdapter

  beforeEach(() => {
    backend = createMemoryBackend()
    storage = new PrefixedStorageAdapter(backend)
  })

  test('get returns null for missing key', () => {
    expect(storage.get('nonexistent')).toBeNull()
  })

  test('set and get round-trip', () => {
    storage.set('test-key', { name: 'hello', count: 42 })
    expect(storage.get('test-key')).toEqual({ name: 'hello', count: 42 })
  })

  test('set overwrites existing value', () => {
    storage.set('key', 'first')
    storage.set('key', 'second')
    expect(storage.get('key')).toBe('second')
  })

  test('remove deletes a key', () => {
    storage.set('to-remove', 'value')
    storage.remove('to-remove')
    expect(storage.get('to-remove')).toBeNull()
  })

  test('list returns keys matching prefix', () => {
    storage.set('annotations:screen1:a', { id: 'a' })
    storage.set('annotations:screen1:b', { id: 'b' })
    storage.set('status:screen1', { status: 'draft' })

    const keys = storage.list('annotations:')
    expect(keys).toContain('annotations:screen1:a')
    expect(keys).toContain('annotations:screen1:b')
    expect(keys).not.toContain('status:screen1')
  })

  test('list returns empty array when no matches', () => {
    expect(storage.list('nothing:')).toEqual([])
  })

  test('clear removes all keys matching prefix', () => {
    storage.set('annotations:a', 1)
    storage.set('annotations:b', 2)
    storage.set('status:x', 3)

    storage.clear('annotations:')

    expect(storage.get('annotations:a')).toBeNull()
    expect(storage.get('annotations:b')).toBeNull()
    expect(storage.get('status:x')).toBe(3)
  })

  test('get handles corrupt JSON gracefully', () => {
    backend._store.set('prev:corrupt', '{bad json')
    expect(storage.get('corrupt')).toBeNull()
  })

  test('stores and retrieves arrays', () => {
    storage.set('arr', [1, 2, 3])
    expect(storage.get('arr')).toEqual([1, 2, 3])
  })

  test('stores and retrieves nested objects', () => {
    const data = { a: { b: { c: 'deep' } } }
    storage.set('nested', data)
    expect(storage.get('nested')).toEqual(data)
  })

  test('prefix isolation - different prefixes dont collide', () => {
    const storage2 = new PrefixedStorageAdapter(backend, 'other:')
    storage.set('key', 'from-prev')
    storage2.set('key', 'from-other')

    expect(storage.get('key')).toBe('from-prev')
    expect(storage2.get('key')).toBe('from-other')
  })
})
