import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Meme, fetchMeme, likeMeme, buyMeme } from '../api';
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
      alert("You can't use this function yet, Sign In!");
      return;
    }
    await likeMeme(id, token);
    setMeme((m) => (m ? { ...m, likes: m.likes + 1 } : m));
  };

  const handleBuy = async () => {
    if (!token || !id) {
      alert("You can't use this function yet, Sign In!");
      return;
    }
    try {
      await buyMeme(id, token);
      alert('Purchase recorded! (demo only, no real payment processed)');
    } catch (err: any) {
      console.error('buy failed', err);
      alert(`Failed to buy meme: ${err?.message ?? 'Unknown error'}`);
    }
  };

  if (loading) return <p className="text-sm text-slate-300">Loading meme...</p>;
  if (error) return <p className="text-sm text-red-400">Error loading meme: {error}</p>;
  if (!meme) return <p className="text-sm text-slate-300">Meme not found.</p>;

  const likeDisabled = !token;
  const buyDisabled = !token;

  return (
    <div className="space-y-4">
      <img src={meme.imageUrl} alt={meme.title} className="w-full max-h-[480px] object-contain rounded" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{meme.title}</h1>
          <p className="text-sm text-slate-400">Uploaded: {new Date(meme.createdAt).toLocaleString()}</p>
          <p className="text-sm text-slate-400">Likes: {meme.likes}</p>
          <p className="text-sm text-slate-400">Bought: {meme.purchases ?? 0}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-lg font-semibold">${meme.price.toFixed(2)}</span>
          <div className="flex gap-2">
            <button
              onClick={handleLike}
              disabled={likeDisabled}
              className={`px-3 py-1 rounded text-sm ${
                likeDisabled
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {likeDisabled ? 'Login to like' : 'Like'}
            </button>
            <button
              onClick={handleBuy}
              disabled={buyDisabled}
              className={`px-3 py-1 rounded text-sm ${
                buyDisabled
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {buyDisabled ? 'Login to buy' : 'Buy'}
            </button>
          </div>
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
