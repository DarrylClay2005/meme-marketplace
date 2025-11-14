import React from 'react';
import { Link } from 'react-router-dom';
import type { Meme } from '../api';

interface MemeCardProps {
  meme: Meme;
}

export const MemeCard: React.FC<MemeCardProps> = ({ meme }) => {
  return (
    <Link
      to={`/memes/${meme.id}`}
      className="border border-slate-800 rounded overflow-hidden hover:border-emerald-500 transition"
    >
      <img src={meme.imageUrl} alt={meme.title} className="w-full h-48 object-cover" />
      <div className="p-3 flex justify-between items-center text-sm">
        <div>
          <p className="font-semibold truncate max-w-[12rem]">{meme.title}</p>
          <p className="text-xs text-slate-400">Likes: {meme.likes}</p>
        </div>
        <span className="text-xs bg-slate-800 rounded px-2 py-1">${meme.price.toFixed(2)}</span>
      </div>
    </Link>
  );
};
