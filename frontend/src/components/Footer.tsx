import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500 bg-slate-950 flex justify-between items-center">
      <span>Meme Marketplace</span>
      <span className="hidden sm:inline">Built with React, AWS, and Serverless</span>
    </footer>
  );
};
