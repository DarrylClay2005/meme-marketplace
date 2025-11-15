import React from 'react';
import { Link } from 'react-router-dom';
import type { Meme } from '../api';

interface MemeCardProps {
  meme: Meme;
}

export const MemeCard: React.FC<MemeCardProps> = ({ meme }) => {
  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

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
    } catch (err) {
      console.error('meme download failed', err);
      alert('Failed to download meme image. Please try again.');
    }
  };

  return (
    <Link
      to={`/memes/${meme.id}`}
      className="border border-slate-800 rounded overflow-hidden hover:border-emerald-500 transition"
    >
      <img src={meme.imageUrl} alt={meme.title} className="w-full h-48 object-cover" />
      <div className="p-3 flex justify-between items-center text-sm">
        <div>
          <p className="font-semibold truncate max-w-[12rem]">{meme.title}</p>
          <p className="text-xs text-slate-400">
            Likes: {meme.likes} - Bought: {meme.purchases ?? 0}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs bg-slate-800 rounded px-2 py-1">${meme.price.toFixed(2)}</span>
          <button
            onClick={handleDownload}
            className="text-[0.7rem] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
          >
            Download
          </button>
        </div>
      </div>
    </Link>
  );
};
