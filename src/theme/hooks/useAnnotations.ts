import { useState, useCallback } from 'react'
import { storage } from '../storage'
import type { Annotation, AnnotationComment, AnnotationCategory, UserIdentity } from '../types'

export function useAnnotations(previewName: string, stateOrStep: string) {
  const storageKey = `annotations:${previewName}`

  const [annotations, setAnnotations] = useState<Annotation[]>(
    () => storage.get<Annotation[]>(storageKey) ?? []
  )

  const persist = (updated: Annotation[]) => {
    storage.set(storageKey, updated)
    setAnnotations(updated)
  }

  const getUser = (): string => {
    const user = storage.get<UserIdentity>('user')
    return user?.name || 'Anonymous'
  }

  const createAnnotation = useCallback((
    x: number,
    y: number,
    category: AnnotationCategory,
    text: string,
  ) => {
    const now = new Date().toISOString()
    const annotation: Annotation = {
      id: crypto.randomUUID(),
      previewName,
      stateOrStep,
      x,
      y,
      category,
      resolved: false,
      createdAt: now,
      comments: [{
        id: crypto.randomUUID(),
        author: getUser(),
        text,
        createdAt: now,
      }],
    }
    const current = storage.get<Annotation[]>(storageKey) ?? []
    persist([...current, annotation])
  }, [previewName, stateOrStep, storageKey])

  const addComment = useCallback((annotationId: string, text: string) => {
    const current = storage.get<Annotation[]>(storageKey) ?? []
    const comment: AnnotationComment = {
      id: crypto.randomUUID(),
      author: getUser(),
      text,
      createdAt: new Date().toISOString(),
    }
    persist(current.map(a =>
      a.id === annotationId
        ? { ...a, comments: [...a.comments, comment] }
        : a
    ))
  }, [storageKey])

  const resolveAnnotation = useCallback((annotationId: string) => {
    const current = storage.get<Annotation[]>(storageKey) ?? []
    persist(current.map(a =>
      a.id === annotationId ? { ...a, resolved: !a.resolved } : a
    ))
  }, [storageKey])

  const deleteAnnotation = useCallback((annotationId: string) => {
    const current = storage.get<Annotation[]>(storageKey) ?? []
    persist(current.filter(a => a.id !== annotationId))
  }, [storageKey])

  return { annotations, createAnnotation, addComment, resolveAnnotation, deleteAnnotation }
}
