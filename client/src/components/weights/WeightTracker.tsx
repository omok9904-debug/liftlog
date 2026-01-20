import { useEffect, useMemo, useState } from 'react'

import { COLORS } from '@/constants/colors'
import { useTheme } from '@/context/ThemeContext'
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

  const [entries, setEntries] = useState<BodyWeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)

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
        setError('Failed to load weight entries.')
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
    setError(null)

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
    } catch (e) {
      setEntries((prev) => prev.filter((e) => e._id !== tempId))
      setError('Failed to add weight entry.')
    }
  }

  async function handleUpdate(payload: BodyWeightCreatePayload) {
    if (!edit) return
    setError(null)

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
    } catch (e) {
      setEntries(previous)
      setError('Failed to update weight entry.')
    }
  }

  async function handleDelete(entry: BodyWeightEntry) {
    const ok = window.confirm('Delete this entry?')
    if (!ok) return

    setError(null)

    const previous = entries
    setEntries((prev) => prev.filter((e) => e._id !== entry._id))

    try {
      await weightService.remove(entry._id)
      if (edit?.id === entry._id) setEdit(null)
    } catch (e) {
      setEntries(previous)
      setError('Failed to delete weight entry.')
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

      {error ? (
        <div
          style={{
            border: `1px solid ${c.border}`,
            background: theme === 'dark' ? 'rgba(248, 113, 113, 0.10)' : 'rgba(239, 68, 68, 0.08)',
            borderRadius: 14,
            padding: 12,
            marginBottom: 14,
            color: c.textPrimary,
          }}
        >
          {error}
        </div>
      ) : null}

      <div className={styles.grid}>
        <div className={styles.card}>
          <p className={styles.cardTitle}>{edit ? 'Edit entry' : 'Add entry'}</p>
          <WeightForm
            mode={edit ? 'edit' : 'create'}
            initialValues={edit ? { weight: edit.weight, date: edit.date } : undefined}
            onSubmit={edit ? handleUpdate : handleCreate}
            onCancelEdit={edit ? () => setEdit(null) : undefined}
          />
        </div>

        <div className={styles.stack}>
          <div className={styles.card}>
            <p className={styles.cardTitle}>Progress</p>
            {sortedEntries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No entries yet.</p>
            ) : (
              <WeightChart entries={sortedEntries} />
            )}
          </div>

          <div className={styles.card}>
            <p className={styles.cardTitle}>History</p>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Loading…</p>
            ) : sortedEntries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Add your first weigh-in to get started.</p>
            ) : (
              <WeightTable entries={[...sortedEntries].reverse()} onEdit={startEdit} onDelete={handleDelete} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
