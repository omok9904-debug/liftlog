import { useEffect, useMemo, useState } from 'react'

import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/toast/ToastProvider'
import { adminService } from '@/services/adminService'
import type { AdminUserRow } from '@/services/adminService'

import styles from './AdminDashboardModal.module.css'

type AdminDashboardModalProps = {
  open: boolean
  onClose: () => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export default function AdminDashboardModal({ open, onClose }: AdminDashboardModalProps) {
  const toast = useToast()

  const [rendered, setRendered] = useState(open)
  const [closing, setClosing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null)

  const title = useMemo(() => `Admin Dashboard (${users.length})`, [users.length])

  useEffect(() => {
    if (open) {
      setRendered(true)
      setClosing(false)
      return
    }

    if (!rendered) return

    setClosing(true)
    const t = window.setTimeout(() => {
      setRendered(false)
      setClosing(false)
      setPendingDelete(null)
    }, 170)

    return () => window.clearTimeout(t)
  }, [open, rendered])

  useEffect(() => {
    if (!rendered || !open) return

    let mounted = true

    async function load() {
      setLoading(true)
      try {
        const data = await adminService.listUsers()
        if (!mounted) return
        setUsers(data)
      } catch {
        if (!mounted) return
        toast.error('Could not load users', 'Please try again.')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [open, rendered])

  useEffect(() => {
    if (!rendered) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, rendered])

  if (!rendered) return null

  async function performDelete(u: AdminUserRow) {
    const previous = users
    setUsers((prev) => prev.filter((x) => x._id !== u._id))

    try {
      await adminService.deleteUser(u._id)
      toast.success('User deleted')
    } catch {
      setUsers(previous)
      toast.error('Delete failed', 'Please try again.')
    }
  }

  return (
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div className={`${styles.modal} ${closing ? styles.modalClosing : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div style={{ display: 'grid', gap: 6 }}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.desc}>View all registered users and manage their data.</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: '40%' }}>
                    Email
                  </th>
                  <th className={styles.th} style={{ width: '24%' }}>
                    Created
                  </th>
                  <th className={styles.th} style={{ width: '20%' }}>
                    Weight entries
                  </th>
                  <th className={styles.th} style={{ width: '16%', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className={styles.td} colSpan={4}>
                      Loading…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className={styles.td} colSpan={4}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td className={styles.td} title={u.email}>
                        {u.email}
                      </td>
                      <td className={styles.td}>{formatDate(u.createdAt)}</td>
                      <td className={styles.td}>{u.weightEntriesCount}</td>
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.danger}`}
                            onClick={() => setPendingDelete(u)}
                          >
                            Delete User
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmModal
          open={Boolean(pendingDelete)}
          title="Delete user?"
          description="This will permanently delete the user and all associated data."
          confirmText="Delete"
          cancelText="Cancel"
          tone="danger"
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            if (!pendingDelete) return
            await performDelete(pendingDelete)
            setPendingDelete(null)
          }}
        />
      </div>
    </div>
  )
}
