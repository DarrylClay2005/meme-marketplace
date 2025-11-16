import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCognitoLoginUrl, getCognitoSignupUrl, useAuth } from '../auth';
import { UserProfile, fetchCurrentUserProfile } from '../api';

export const Header: React.FC = () => {
  const { token, setToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      try { localStorage.removeItem('meme-marketplace-profile'); } catch {}
      return;
    }

    let cancelled = false;
    fetchCurrentUserProfile(token)
      .then((p) => {
        if (!cancelled) setProfile(p);
        try { localStorage.setItem('meme-marketplace-profile', JSON.stringify(p)); } catch {}
        // Prime local downloaded IDs cache for badges
        import('../api').then(async ({ fetchDownloadedMemes }) => {
          try {
            const recs = await fetchDownloadedMemes(token)
            const ids = recs.map(r => r.meme.id)
            localStorage.setItem('mm-dl-ids', JSON.stringify(ids))
          } catch {}
        })
      })
      .catch((err) => {
        console.error('failed to load current user profile in header', err);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900">
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg tracking-tight">Meme Marketplace</span>
        <nav className="flex gap-3 text-sm text-slate-300">
          <Link to="/" className="hover:text-emerald-400">Home</Link>
          <Link to="/dashboard" className="hover:text-emerald-400">Dashboard</Link>
          <Link to="/profile" className="hover:text-emerald-400">Profile</Link>
          <Link to="/downloads" className="hover:text-emerald-400">Downloads</Link>
          {profile?.userId === (import.meta.env.VITE_OWNER_USER_ID || 'e4c8a498-0041-701a-f19b-c8394ac28841') && (
            <Link to="/admin" className="hover:text-emerald-400">Admin</Link>
          )}
          <Link to="/upload" className="hover:text-emerald-400">Upload</Link>
          <Link to="/register" className="hover:text-emerald-400">Register</Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-[0.7rem] text-slate-400">Built by Darryl Clay</span>
        {token ? (
          <>
            {profile && (
              <div className="flex items-center gap-2 max-w-[10rem]">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.username}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                    {profile.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="text-xs sm:text-sm text-slate-200 font-medium truncate">
                  {profile.username}
                </span>
              </div>
            )}
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
