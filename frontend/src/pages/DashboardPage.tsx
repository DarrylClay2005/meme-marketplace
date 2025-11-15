import React, { useEffect, useState } from 'react';
import { Meme, fetchLikedMemes } from '../api';
import { MemeCard } from '../components/MemeCard';
import { useAuth } from '../auth';

export const DashboardPage: React.FC = () => {
  const { token } = useAuth();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetchLikedMemes(token)
      .then(setMemes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Your Liked Memes</h1>
        <p className="text-sm text-slate-300">Loading memes you have liked...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Your Liked Memes</h1>
        <p className="text-sm text-red-400">Error loading liked memes: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your Liked Memes</h1>
        {memes.length === 0 ? (
        <p className="text-sm text-slate-300">
          You haven't liked any memes yet. Browse the home page and hit the <span className="font-semibold">Like</span>{' '}
          button on memes you enjoy.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {memes.map((meme) => (
            <MemeCard key={meme.id} meme={meme} />
          ))}
        </div>
      )}
    </div>
  );
};
