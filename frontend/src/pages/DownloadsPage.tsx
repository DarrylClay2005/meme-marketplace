import React, { useEffect, useState } from 'react'
import { DownloadRecord, fetchDownloadedMemes } from '../api'
import { useAuth } from '../auth'
import { Link } from 'react-router-dom'

export const DownloadsPage: React.FC = () => {
  const { token } = useAuth()
  const [items, setItems] = useState<DownloadRecord[] | null>(null)
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

  function fromNow(iso?: string) {
    if (!iso) return ''
    const t = new Date(iso).getTime()
    const d = Date.now() - t
    const mins = Math.floor(d / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-3">Your Downloads</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((rec) => (
          <Link key={rec.meme.id} to={`/memes/${rec.meme.id}`} className="border border-slate-800 rounded overflow-hidden hover:border-emerald-500">
            <img src={rec.meme.imageUrl} alt={rec.meme.title} className="w-full h-40 object-contain bg-black" />
            <div className="p-2 text-sm">
              <div className="font-medium truncate">{rec.meme.title}</div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>${rec.meme.price.toFixed(2)}</span>
                <span>Downloaded {fromNow(rec.downloadedAt)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
