import type { BodyWeightEntry } from '@/types/bodyWeight'

type WeightTableProps = {
  entries: BodyWeightEntry[]
  onEdit: (entry: BodyWeightEntry) => void
  onDelete: (entry: BodyWeightEntry) => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export default function WeightTable({ entries, onEdit, onDelete }: WeightTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: 420, borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', padding: '10px 12px' }}>Date</th>
            <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', padding: '10px 12px' }}>Weight</th>
            <th style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', padding: '10px 12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e._id}>
              <td style={{ padding: '12px', borderTop: '1px solid var(--border)', color: 'var(--text)' }}>{formatDate(e.date)}</td>
              <td style={{ padding: '12px', borderTop: '1px solid var(--border)', color: 'var(--text)' }}>{e.weight}</td>
              <td style={{ padding: '12px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => onEdit(e)}
                    style={{
                      height: 34,
                      padding: '0 10px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(e)}
                    style={{
                      height: 34,
                      padding: '0 10px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
