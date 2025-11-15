import React, { useEffect, useState } from 'react'
import { Meme, fetchDownloadedMemes } from '../api'
import { useAuth } from '../auth'
import { Link } from 'react-router-dom'

export const DownloadsPage: React.FC = () => {
  const { token } = useAuth()
  const [items, setItems] = useState<Meme[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setItems(null)
    setError(null)
    fetchDownloadedMemes(token)
      .then(setItems)
      .catch((e) => setError(e?.message || 'Failed to load downloads'))
  }, [token])

  if (!token) return <p className="text-sm text-slate-400">Login to see your downloads.</p>
  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (!items) return <p className="text-sm text-slate-300">Loading your downloads…</p>

  if (!items.length) return <p className="text-sm text-slate-400">No downloads yet.</p>

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Your Downloads</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((m) => (
          <Link key={m.id} to={`/memes/${m.id}`} className="border border-slate-800 rounded overflow-hidden hover:border-emerald-500">
            <img src={m.imageUrl} alt={m.title} className="w-full h-40 object-contain bg-black" />
            <div className="p-2 text-sm">
              <div className="font-medium truncate">{m.title}</div>
              <div className="text-xs text-slate-400">${m.price.toFixed(2)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
