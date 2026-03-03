export interface StorageAdapter {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
  list(prefix: string): string[]
  clear(prefix: string): void
}

interface StorageBackend {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  key(index: number): string | null
  readonly length: number
}

export class PrefixedStorageAdapter implements StorageAdapter {
  constructor(
    private backend: StorageBackend,
    private prefix = 'prev:',
  ) {}

  get<T>(key: string): T | null {
    try {
      const raw = this.backend.getItem(this.prefix + key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  set<T>(key: string, value: T): void {
    try {
      this.backend.setItem(this.prefix + key, JSON.stringify(value))
    } catch {
      // Silently ignore quota errors
    }
  }

  remove(key: string): void {
    this.backend.removeItem(this.prefix + key)
  }

  list(prefix: string): string[] {
    const fullPrefix = this.prefix + prefix
    const keys: string[] = []
    for (let i = 0; i < this.backend.length; i++) {
      const key = this.backend.key(i)
      if (key?.startsWith(fullPrefix)) {
        keys.push(key.slice(this.prefix.length))
      }
    }
    return keys
  }

  clear(prefix: string): void {
    this.list(prefix).forEach(k => this.remove(k))
  }
}

// Default singleton using localStorage (browser environment)
export const storage: StorageAdapter = typeof localStorage !== 'undefined'
  ? new PrefixedStorageAdapter(localStorage)
  : new PrefixedStorageAdapter({
      // No-op fallback for SSR/non-browser
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      key: () => null,
      length: 0,
    })
