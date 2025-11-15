import React from 'react';
import { Link } from 'react-router-dom';
import type { Meme } from '../api';

interface MemeCardProps {
  meme: Meme;
}

export const MemeCard: React.FC<MemeCardProps> = ({ meme }) => {
  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const link = document.createElement('a');
    link.href = meme.imageUrl;

    const safeTitle = meme.title
      ? meme.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase()
      : 'meme';

    link.download = `${safeTitle}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
