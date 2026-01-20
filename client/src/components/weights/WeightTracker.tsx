import { useEffect, useMemo, useState } from 'react'

import { COLORS } from '@/constants/colors'
import { useTheme } from '@/context/ThemeContext'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/components/toast/ToastProvider'
import { weightService } from '@/services/weightService'
import type { BodyWeightCreatePayload, BodyWeightEntry } from '@/types/bodyWeight'

import WeightChart from './WeightChart'
import WeightForm from './WeightForm'
import WeightTable from './WeightTable'
import styles from './WeightTracker.module.css'

type EditState = {
  id: string
  weight: number
  date: string
}

function toInputDate(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function isSameLocalDay(aIso: string, bIso: string) {
  const a = new Date(aIso)
  const b = new Date(bIso)
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function todayIso() {
  return new Date().toISOString()
}

export default function WeightTracker() {
  const { theme } = useTheme()
  const c = COLORS(theme)
  const toast = useToast()

  const [entries, setEntries] = useState<BodyWeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<BodyWeightEntry | null>(null)
  const [pendingUpdate, setPendingUpdate] = useState<BodyWeightCreatePayload | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const data = await weightService.getAll()
        if (!mounted) return
        setEntries(data)
      } catch (e) {
        if (!mounted) return
        toast.error('Could not load weights', 'Please refresh and try again.')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [entries])

  const needsTodayPrompt = useMemo(() => {
    const t = todayIso()
    return !sortedEntries.some((e) => isSameLocalDay(e.date, t))
  }, [sortedEntries])

  async function handleCreate(payload: BodyWeightCreatePayload) {

    const tempId = `temp_${Date.now()}`
    const optimistic: BodyWeightEntry = {
      _id: tempId,
      weight: payload.weight,
      date: new Date(payload.date).toISOString(),
      createdAt: new Date().toISOString(),
    }

    setEntries((prev) => [...prev, optimistic])

    try {
      const created = await weightService.create({
        weight: payload.weight,
        date: new Date(payload.date).toISOString(),
      })

      setEntries((prev) => prev.map((e) => (e._id === tempId ? created : e)))
      toast.success('Weight added')
    } catch (e) {
      setEntries((prev) => prev.filter((e) => e._id !== tempId))
      toast.error('Failed to add weight', 'Please try again.')
    }
  }

  function requestUpdate(payload: BodyWeightCreatePayload) {
    if (!edit) return

    setPendingUpdate(payload)
  }

  async function performUpdate(payload: BodyWeightCreatePayload) {
    if (!edit) return

    const previous = entries

    setEntries((prev) =>
      prev.map((e) =>
        e._id === edit.id
          ? { ...e, weight: payload.weight, date: new Date(payload.date).toISOString() }
          : e,
      ),
    )

    try {
      await weightService.update(edit.id, {
        weight: payload.weight,
        date: new Date(payload.date).toISOString(),
      })
      setEdit(null)
      toast.success('Entry updated')
    } catch (e) {
      setEntries(previous)
      toast.error('Failed to update entry', 'Please try again.')
    }
  }

  function requestDelete(entry: BodyWeightEntry) {
    setPendingDelete(entry)
  }

  async function performDelete(entry: BodyWeightEntry) {
    const previous = entries
    setEntries((prev) => prev.filter((e) => e._id !== entry._id))

    try {
      await weightService.remove(entry._id)
      if (edit?.id === entry._id) setEdit(null)
      toast.success('Entry deleted')
    } catch (e) {
      setEntries(previous)
      toast.error('Failed to delete entry', 'Please try again.')
    }
  }

  function startEdit(entry: BodyWeightEntry) {
    setEdit({
      id: entry._id,
      weight: entry.weight,
      date: toInputDate(entry.date),
    })
  }

  return (
    <section>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.h2}>Body Weight</h2>
          <p className={styles.subtle}>Track daily weigh-ins and see progress over time.</p>
        </div>
      </div>

      {needsTodayPrompt ? (
        <div
          style={{
            border: `1px solid ${c.border}`,
            background: theme === 'dark' ? 'rgba(34, 197, 94, 0.10)' : 'rgba(34, 197, 94, 0.08)',
            borderRadius: 14,
            padding: 12,
            marginBottom: 14,
            color: c.textPrimary,
          }}
        >
          Add your weight for today to keep your streak going.
        </div>
      ) : null}

      <div className={styles.grid}>
        <div className={`${styles.card} ${styles.addCard}`}>
          <p className={styles.cardTitle}>{edit ? 'Edit entry' : 'Add entry'}</p>
          <WeightForm
            mode={edit ? 'edit' : 'create'}
            initialValues={edit ? { weight: edit.weight, date: edit.date } : undefined}
            onSubmit={edit ? requestUpdate : handleCreate}
            onCancelEdit={edit ? () => setEdit(null) : undefined}
            onInvalidSubmit={(message) => toast.error('Validation error', message)}
          />
        </div>

        <div className={`${styles.card} ${styles.progressCard}`}>
          <p className={styles.cardTitle}>Progress</p>
          {sortedEntries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No entries yet.</p>
          ) : (
            <WeightChart entries={sortedEntries} />
          )}
        </div>

        <div className={`${styles.card} ${styles.historyCard}`}>
          <p className={styles.cardTitle}>History</p>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading…</p>
          ) : sortedEntries.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Add your first weigh-in to get started.</p>
          ) : (
            <div className={styles.historyScroll}>
              <WeightTable entries={[...sortedEntries].reverse()} onEdit={startEdit} onDelete={requestDelete} />
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete || pendingUpdate)}
        title={pendingDelete ? 'Delete entry?' : 'Save changes?'}
        description={pendingDelete ? 'This can’t be undone.' : 'This will update the selected entry.'}
        confirmText={pendingDelete ? 'Delete' : 'Save'}
        cancelText="Cancel"
        tone={pendingDelete ? 'danger' : 'primary'}
        onCancel={() => {
          setPendingDelete(null)
          setPendingUpdate(null)
        }}
        onConfirm={async () => {
          if (pendingDelete) {
            await performDelete(pendingDelete)
            setPendingDelete(null)
            return
          }

          if (pendingUpdate) {
            await performUpdate(pendingUpdate)
            setPendingUpdate(null)
          }
        }}
      />
    </section>
  )
}
