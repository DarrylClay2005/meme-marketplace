import React, { useEffect, useState } from 'react'
import { adminListMemes, adminDeleteMeme, Meme } from '../api'
import { useAuth } from '../auth'

export const AdminPage: React.FC = () => {
  const { token } = useAuth()
  const [items, setItems] = useState<Meme[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setItems(null)
    setError(null)
    adminListMemes(token)
      .then(setItems)
      .catch((e) => setError(e?.message || 'Failed to load memes'))
  }, [token])

  async function remove(id: string) {
    if (!token) return
    if (!confirm('Delete this meme? This cannot be undone.')) return
    try {
      setDeleting(id)
      await adminDeleteMeme(id, token)
      setItems((arr) => (arr ? arr.filter((m) => m.id !== id) : arr))
    } catch (e: any) {
      alert(e?.message || 'Failed to delete meme')
    } finally {
      setDeleting(null)
    }
  }

  if (!token) return <p className="text-sm text-slate-400">Unauthorized.</p>
  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (!items) return <p className="text-sm text-slate-300">Loading…</p>

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Admin</h1>
      <div className="space-y-2">
        {items.map((m) => (
          <div key={m.id} className="flex items-center justify-between border border-slate-800 rounded p-2">
            <div className="flex items-center gap-3">
              <img src={m.imageUrl} alt={m.title} className="w-16 h-16 object-contain bg-black rounded" />
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-slate-400">{m.id}</div>
              </div>
            </div>
            <button
              onClick={() => remove(m.id)}
              disabled={deleting === m.id}
              className={`px-3 py-1 rounded text-xs ${deleting === m.id ? 'bg-slate-700 text-slate-400' : 'bg-red-600 hover:bg-red-500'}`}
            >
              {deleting === m.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
