import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Meme, fetchMeme, likeMeme, unlikeMeme, buyMeme, fetchLikedMemes, UserProfile, fetchUserProfile, recordDownload } from '../api';
import { useAuth } from '../auth';
import MediaWithWatermark from '../components/MediaWithWatermark';

export const MemeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [meme, setMeme] = useState<Meme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedByUser, setLikedByUser] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [uploaderProfile, setUploaderProfile] = useState<UserProfile | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);
    setUploaderProfile(null);

    fetchMeme(id)
      .then((m) => {
        setMeme(m);
        return m;
      })
      .then((m) => {
        if (!m) return;
        return fetchUserProfile(m.uploadedBy)
          .then((profile) => setUploaderProfile(profile))
          .catch((err) => {
            console.error('failed to load uploader profile', err);
          });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    if (token) {
      fetchLikedMemes(token)
        .then((likedMemes) => {
          setLikedByUser(likedMemes.some((m) => m.id === id));
        })
        .catch((err) => {
          console.error('failed to load liked memes for user', err);
        });
    } else {
      setLikedByUser(false);
    }
  }, [id, token]);

  const handleLikeToggle = async () => {
    if (!token || !id) {
      alert("You can't use this function yet, Sign In!");
      return;
    }

    try {
      setLikeLoading(true);
      if (likedByUser) {
        await unlikeMeme(id, token);
        setMeme((m) => (m ? { ...m, likes: Math.max(0, m.likes - 1) } : m));
        setLikedByUser(false);
      } else {
        await likeMeme(id, token);
        setMeme((m) => (m ? { ...m, likes: m.likes + 1 } : m));
        setLikedByUser(true);
      }
    } catch (err: any) {
      console.error('like toggle failed', err);
      alert(`Failed to update like: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!meme) return;
    if (!token) {
      alert("You can't use this function yet, Sign In!");
      return;
    }

    try {
      const response = await fetch(meme.imageUrl);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const safeTitle = meme.title
        ? meme.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
        : 'meme';

      const contentType = response.headers.get('Content-Type') || '';
      let ext = '.jpg';
      if (contentType.includes('png')) ext = '.png';
      else if (contentType.includes('gif')) ext = '.gif';
      else if (contentType.includes('webp')) ext = '.webp';

      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeTitle}${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Record download for this user (best-effort)
      try { await recordDownload(id, token); } catch { /* ignore */ }
    } catch (err) {
      console.error('meme download failed', err);
      alert('Failed to download meme image. Please try again.');
    }
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

  const likeDisabled = !token || likeLoading;
  const buyDisabled = !token;
  const downloadDisabled = !token;

  return (
    <div className="space-y-4">
      <div className="w-full h-[480px]">
        <MediaWithWatermark src={meme.imageUrl} alt={meme.title} className="w-full h-[480px]" rounded contain mode="visible" />
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{meme.title}</h1>
          <p className="text-sm text-slate-400">Uploaded: {new Date(meme.createdAt).toLocaleString()}</p>
          <div className="flex items-center gap-2 text-sm text-slate-300 mt-1">
            {uploaderProfile?.profileImageUrl && (
              <img
                src={uploaderProfile.profileImageUrl}
                alt={uploaderProfile.username}
                className="w-8 h-8 rounded-full object-cover border border-slate-700"
              />
            )}
            <span>
              Uploaded by:{' '}
              <span className="font-semibold">
                {uploaderProfile?.username ?? meme.uploadedBy}
              </span>
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">Likes: {meme.likes}</p>
          <p className="text-sm text-slate-400">Bought: {meme.purchases ?? 0}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-lg font-semibold">${meme.price.toFixed(2)}</span>
          <div className="flex gap-2">
            <button
              onClick={handleLikeToggle}
              disabled={likeDisabled}
              className={`px-3 py-1 rounded text-sm ${
                likeDisabled
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : likedByUser
                    ? 'bg-emerald-800 hover:bg-emerald-700'
                    : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {likeDisabled ? 'Login to like' : likedByUser ? 'Liked' : 'Like'}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloadDisabled}
              className={`px-3 py-1 rounded text-sm ${
                downloadDisabled
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              {downloadDisabled ? 'Login to download' : 'Download'}
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
