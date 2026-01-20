import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import type { BodyWeightCreatePayload } from '@/types/bodyWeight'

type WeightFormMode = 'create' | 'edit'

type WeightFormProps = {
  mode: WeightFormMode
  initialValues?: {
    weight: number
    date: string
  }
  onSubmit: (payload: BodyWeightCreatePayload) => Promise<void> | void
  onCancelEdit?: () => void
}

function todayAsInputValue() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function WeightForm({ mode, initialValues, onSubmit, onCancelEdit }: WeightFormProps) {
  const [weight, setWeight] = useState<string>('')
  const [date, setDate] = useState<string>(todayAsInputValue())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && initialValues) {
      setWeight(String(initialValues.weight))
      setDate(initialValues.date)
      return
    }

    if (mode === 'create') {
      setWeight('')
      setDate(todayAsInputValue())
    }
  }, [initialValues, mode])

  const isValid = useMemo(() => {
    const w = Number(weight)
    return Boolean(date) && !Number.isNaN(w) && w > 0
  }, [date, weight])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setSubmitting(true)
    try {
      await onSubmit({ weight: Number(weight), date })
      if (mode === 'create') {
        setWeight('')
        setDate(todayAsInputValue())
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <label htmlFor="weight" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Weight
        </label>
        <input
          id="weight"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g. 72.5"
          style={{
            height: 40,
            padding: '0 12px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            transition: 'background-color 220ms, border-color 220ms, color 220ms',
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label htmlFor="date" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            height: 40,
            padding: '0 12px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            transition: 'background-color 220ms, border-color 220ms, color 220ms',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={!isValid || submitting}
          style={{
            height: 40,
            padding: '0 14px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            cursor: submitting ? 'default' : 'pointer',
            transition: 'transform 120ms ease, background-color 220ms, border-color 220ms, color 220ms',
          }}
        >
          {mode === 'edit' ? 'Save changes' : 'Add weight'}
        </button>

        {mode === 'edit' && onCancelEdit ? (
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              height: 40,
              padding: '0 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'transform 120ms ease, border-color 220ms, color 220ms',
            }}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
