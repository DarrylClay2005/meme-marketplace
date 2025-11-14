import React, { useEffect, useState } from 'react';
import { Meme, fetchMemes } from '../api';
import { MemeCard } from '../components/MemeCard';

export const HomePage: React.FC = () => {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemes()
      .then(setMemes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
      <h1 className="text-2xl font-semibold">Latest Memes</h1>
      <div className="grid gap-4 md:grid-cols-2">
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
