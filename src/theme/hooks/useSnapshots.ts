import { useState, useCallback, useRef } from 'react'
import { storage } from '../storage'
import type { Snapshot } from '../types'

const MAX_SNAPSHOTS = 20

export function useSnapshots(previewName?: string) {
  const capturingRef = useRef(false)
  const loadAll = (): Snapshot[] => {
    const all = storage
      .list('snapshots:')
      .map(k => storage.get<Snapshot>(k))
      .filter(Boolean) as Snapshot[]

    // Sort newest first
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return previewName
      ? all.filter(s => s.previewName === previewName)
      : all
  }

  const [snapshots, setSnapshots] = useState<Snapshot[]>(loadAll)

  const refresh = useCallback(() => {
    setSnapshots(loadAll())
  }, [previewName])

  const captureSnapshot = useCallback(
    async (
      iframeRef: React.RefObject<HTMLIFrameElement | null>,
      metadata: {
        previewName: string
        stateOrStep: string
        viewport: string
        label?: string
      },
    ) => {
      if (capturingRef.current) return
      capturingRef.current = true

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const now = new Date().toISOString()

      let screenshotDataUrl = ''

      try {
        const iframe = iframeRef.current
        if (iframe?.contentDocument) {
          const doc = iframe.contentDocument
          const serializer = new XMLSerializer()
          const html = serializer.serializeToString(doc)
          const width = iframe.clientWidth || 800
          const height = iframe.clientHeight || 600

          // Draw via SVG foreignObject onto canvas
          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
              <foreignObject width="100%" height="100%">
                ${html}
              </foreignObject>
            </svg>
          `

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          const img = new Image()
          const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
          const url = URL.createObjectURL(blob)

          try {
            img.src = url
            await img.decode()
            ctx?.drawImage(img, 0, 0)
            screenshotDataUrl = canvas.toDataURL('image/png')
          } catch {
            // tainted canvas or draw failure
          } finally {
            URL.revokeObjectURL(url)
          }
        }
      } catch {
        // cross-origin or other access error
      }

      // Fallback placeholder if capture failed
      if (!screenshotDataUrl) {
        const w = 320
        const h = 200
        const placeholderSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
            <rect width="${w}" height="${h}" fill="#f0f0f0" rx="8"/>
            <text x="50%" y="45%" text-anchor="middle" fill="#999" font-size="14" font-family="system-ui">
              ${metadata.previewName}
            </text>
            <text x="50%" y="60%" text-anchor="middle" fill="#bbb" font-size="11" font-family="system-ui">
              Cross-origin snapshot
            </text>
          </svg>
        `
        screenshotDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSvg.trim())}`
      }

      const snapshot: Snapshot = {
        id,
        previewName: metadata.previewName,
        stateOrStep: metadata.stateOrStep,
        viewport: metadata.viewport,
        screenshotDataUrl,
        createdAt: now,
        label: metadata.label,
      }

      storage.set(`snapshots:${id}`, snapshot)

      // Enforce cap: delete oldest beyond MAX_SNAPSHOTS
      const allKeys = storage.list('snapshots:')
      if (allKeys.length > MAX_SNAPSHOTS) {
        const allSnapshots = allKeys
          .map(k => storage.get<Snapshot>(k))
          .filter(Boolean) as Snapshot[]
        allSnapshots.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

        const toDelete = allSnapshots.slice(0, allSnapshots.length - MAX_SNAPSHOTS)
        for (const s of toDelete) {
          storage.remove(`snapshots:${s.id}`)
        }
      }

      setSnapshots(loadAll())
      capturingRef.current = false
    },
    [previewName],
  )

  const deleteSnapshot = useCallback(
    (id: string) => {
      storage.remove(`snapshots:${id}`)
      setSnapshots(loadAll())
    },
    [previewName],
  )

  return { snapshots, captureSnapshot, deleteSnapshot, refresh }
}
