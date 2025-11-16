import React, { useEffect, useState } from 'react';
import { Meme, fetchMemes, fetchTrending } from '../api';
import { MemeCard } from '../components/MemeCard';

export const HomePage: React.FC = () => {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'latest'|'trending'>('latest');

  useEffect(() => {
    setLoading(true)
    const loader = mode === 'latest' ? fetchMemes() : fetchTrending()
    loader
      .then(setMemes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [mode]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Latest Memes</h1>
        <p className="text-sm text-slate-400">Loading memes from the API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Latest Memes</h1>
        <p className="text-sm text-red-400">Error loading memes: {error}</p>
        <p className="text-xs text-slate-400">Make sure the backend is running and `VITE_API_BASE_URL` is set correctly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{mode === 'latest' ? 'Latest Memes' : 'Trending Memes'}</h1>
        <div className="flex gap-2 text-xs">
          <button onClick={()=>setMode('latest')} className={`px-2 py-1 rounded ${mode==='latest'?'bg-emerald-600':'bg-slate-800'}`}>Latest</button>
          <button onClick={()=>setMode('trending')} className={`px-2 py-1 rounded ${mode==='trending'?'bg-emerald-600':'bg-slate-800'}`}>Trending</button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {memes.map((meme) => (
          <MemeCard key={meme.id} meme={meme} />
        ))}
        {memes.length === 0 && (
          <p className="col-span-full text-sm text-slate-400">
            No memes yet. Once you log in, go to <span className="font-semibold">Upload</span> to add the first one.
          </p>
        )}
      </div>
    </div>
  );
};
