import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import styles from './AdminAccessModal.module.css'

type AdminAccessModalProps = {
  open: boolean
  onClose: () => void
  onVerify: (key: string) => Promise<void>
}

export default function AdminAccessModal({ open, onClose, onVerify }: AdminAccessModalProps) {
  const [rendered, setRendered] = useState(open)
  const [closing, setClosing] = useState(false)
  const [key, setKey] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(() => key.trim().length > 0 && !submitting, [key, submitting])

  useEffect(() => {
    if (open) {
      setRendered(true)
      setClosing(false)
      setSubmitting(false)
      setKey('')
      return
    }

    if (!rendered) return

    setClosing(true)
    const t = window.setTimeout(() => {
      setRendered(false)
      setClosing(false)
      setSubmitting(false)
    }, 170)

    return () => window.clearTimeout(t)
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!canSubmit) return

    setSubmitting(true)
    try {
      await onVerify(key.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className={`${styles.modal} ${closing ? styles.modalClosing : ''}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div style={{ display: 'grid', gap: 6 }}>
            <h2 className={styles.title}>Admin Access</h2>
            <p className={styles.desc}>Enter the admin secret key to access admin tools.</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label className={styles.label} htmlFor="adminKey">
              Admin Secret Key
            </label>
            <input
              id="adminKey"
              className={styles.input}
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={!canSubmit}>
              {submitting ? 'Verifying…' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
