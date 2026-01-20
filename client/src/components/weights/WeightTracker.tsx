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

function toDateKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
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

  const PAGE_SIZE = 10

  const [entries, setEntries] = useState<BodyWeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<BodyWeightEntry | null>(null)
  const [pendingUpdate, setPendingUpdate] = useState<BodyWeightCreatePayload | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const data = await weightService.getAll()
        if (!mounted) return
        setEntries(data)
        setCurrentPage(1)
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

  const historyEntriesLatestFirst = useMemo(() => {
    return [...sortedEntries].reverse()
  }, [sortedEntries])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(historyEntriesLatestFirst.length / PAGE_SIZE))
  }, [PAGE_SIZE, historyEntriesLatestFirst.length])

  const safePage = useMemo(() => {
    return Math.min(Math.max(1, currentPage), totalPages)
  }, [currentPage, totalPages])

  const pagedHistoryEntries = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return historyEntriesLatestFirst.slice(start, start + PAGE_SIZE)
  }, [PAGE_SIZE, historyEntriesLatestFirst, safePage])

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const nums = new Set<number>([1, totalPages, safePage])
    if (safePage - 1 > 1) nums.add(safePage - 1)
    if (safePage + 1 < totalPages) nums.add(safePage + 1)
    return Array.from(nums).sort((a, b) => a - b)
  }, [safePage, totalPages])

  const needsTodayPrompt = useMemo(() => {
    const t = todayIso()
    return !sortedEntries.some((e) => isSameLocalDay(e.date, t))
  }, [sortedEntries])

  const reservedDateKeys = useMemo(() => {
    const keys = sortedEntries.map((e) => toDateKey(e.date))
    if (!edit) return keys

    return keys.filter((k) => k !== edit.date)
  }, [edit, sortedEntries])

  function getApiMessage(err: unknown) {
    return typeof (err as any)?.response?.data?.message === 'string' ? (err as any).response.data.message : null
  }

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
      toast.success('Weight added successfully')
      setCurrentPage(1)
    } catch (e) {
      setEntries((prev) => prev.filter((e) => e._id !== tempId))

      const msg = getApiMessage(e)
      if (msg === 'Weight entry already exists for this date') {
        toast.error('Weight already exists for this date')
        return
      }

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
      toast.success('Weight updated successfully')
    } catch (e) {
      setEntries(previous)

      const msg = getApiMessage(e)
      if (msg === 'Weight entry already exists for this date') {
        toast.error('Weight already exists for this date')
        return
      }

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

      const nextCount = previous.length - 1
      const nextTotalPages = Math.max(1, Math.ceil(nextCount / PAGE_SIZE))
      setCurrentPage((p) => Math.min(p, nextTotalPages))
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
            existingDateKeys={reservedDateKeys}
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
          ) : historyEntriesLatestFirst.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Add your first weigh-in to get started.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              <div className={styles.historyScroll}>
                <div key={safePage} className={styles.historyPage}>
                  <WeightTable entries={pagedHistoryEntries} onEdit={startEdit} onDelete={requestDelete} />
                </div>
              </div>

              {totalPages > 1 ? (
                <nav className={styles.pagination} aria-label="History pagination">
                  <button
                    type="button"
                    className={styles.pageButton}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>

                  <div className={styles.pageNumbers}>
                    {pageNumbers.map((n, idx) => {
                      const prev = pageNumbers[idx - 1]
                      const showGap = prev !== undefined && n - prev > 1

                      return (
                        <div key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {showGap ? <span className={styles.ellipsis}>…</span> : null}
                          <button
                            type="button"
                            className={`${styles.pageNumber} ${n === safePage ? styles.pageNumberActive : ''}`}
                            onClick={() => setCurrentPage(n)}
                            aria-current={n === safePage ? 'page' : undefined}
                          >
                            {n}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    className={styles.pageButton}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </nav>
              ) : null}
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
