import { useState, useCallback } from 'react'
import { storage } from '../storage'
import type { ApprovalStatus, StatusEntry, AuditLogEntry, UserIdentity } from '../types'

const DEFAULT_ENTRY: StatusEntry = {
  previewName: '',
  status: 'draft',
  updatedAt: '',
  updatedBy: '',
}

export function useApprovalStatus(previewName: string) {
  const [entry, setEntry] = useState<StatusEntry>(
    () => storage.get<StatusEntry>(`status:${previewName}`) ?? { ...DEFAULT_ENTRY, previewName }
  )

  const changeStatus = useCallback((newStatus: ApprovalStatus) => {
    const user = storage.get<UserIdentity>('user')
    const now = new Date().toISOString()

    // Record audit log
    const audit: AuditLogEntry = {
      previewName,
      from: entry.status,
      to: newStatus,
      changedBy: user?.name || 'Anonymous',
      changedAt: now,
    }
    storage.set(`audit:${previewName}:${Date.now()}`, audit)

    // Update status
    const updated: StatusEntry = {
      previewName,
      status: newStatus,
      updatedAt: now,
      updatedBy: user?.name || 'Anonymous',
    }
    storage.set(`status:${previewName}`, updated)
    setEntry(updated)
  }, [previewName, entry.status])

  const getAuditLog = useCallback((): AuditLogEntry[] => {
    return storage
      .list(`audit:${previewName}:`)
      .map(k => storage.get<AuditLogEntry>(k))
      .filter(Boolean) as AuditLogEntry[]
  }, [previewName])

  return { status: entry.status, changeStatus, entry, getAuditLog }
}
