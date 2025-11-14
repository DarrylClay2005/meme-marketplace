import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Meme, fetchMeme, likeMeme } from '../api';
import { useAuth } from '../auth';

export const MemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [meme, setMeme] = useState<Meme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetchMeme(id)
      .then(setMeme)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!token || !id) {
      alert('You must be logged in to like memes');
      return;
    }
    await likeMeme(id, token);
    setMeme((m) => (m ? { ...m, likes: m.likes + 1 } : m));
  };

  if (loading) return <p>Loading meme...</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;
  if (!meme) return <p>Meme not found.</p>;

  return (
    <div className="space-y-4">
      <img src={meme.imageUrl} alt={meme.title} className="w-full max-h-[480px] object-contain rounded" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{meme.title}</h1>
          <p className="text-sm text-slate-400">Uploaded: {new Date(meme.createdAt).toLocaleString()}</p>
          <p className="text-sm text-slate-400">Likes: {meme.likes}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-lg font-semibold">${meme.price.toFixed(2)}</span>
          <button
            onClick={handleLike}
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-sm"
          >
            Like
          </button>
        </div>
      </div>
      {meme.tags?.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-slate-300 mt-2">
          {meme.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 rounded bg-slate-800">#{tag}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
};
