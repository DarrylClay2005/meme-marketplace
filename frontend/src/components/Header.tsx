import React from 'react';
import { Link } from 'react-router-dom';
import { getCognitoLoginUrl, getCognitoSignupUrl, useAuth } from '../auth';

export const Header: React.FC = () => {
  const { token, setToken } = useAuth();

  return (
    <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg tracking-tight">Meme Marketplace</span>
        <nav className="flex gap-3 text-sm text-slate-300">
          <Link to="/" className="hover:text-emerald-400">Home</Link>
          <Link to="/dashboard" className="hover:text-emerald-400">Dashboard</Link>
          <Link to="/upload" className="hover:text-emerald-400">Upload</Link>
          <Link to="/register" className="hover:text-emerald-400">Register</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {token ? (
          <>
            <span className="text-xs text-slate-300 hidden sm:inline">Logged in</span>
            <button
              onClick={() => setToken(null)}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs border border-slate-600"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <a
              href={getCognitoSignupUrl()}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs border border-slate-600"
            >
              Register
            </a>
            <a
              href={getCognitoLoginUrl()}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-medium"
            >
              Login
            </a>
          </div>
        )}
      </div>
    </header>
  );
};
