import React, { useEffect, useState } from 'react';
import { UserProfile, fetchCurrentUserProfile, updateCurrentUserProfile, getUploadUrl } from '../api';
import { useAuth } from '../auth';

export const ProfilePage: React.FC = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);
    fetchCurrentUserProfile(token)
      .then((p) => {
        setProfile(p);
        setUsernameInput(p.username ?? '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSaving(true);
      let avatarKey: string | undefined;

      if (avatarFile) {
        const { key, uploadUrl } = await getUploadUrl(avatarFile.type, token);
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': avatarFile.type
          },
          body: avatarFile
        });
        if (!uploadRes.ok) {
          throw new Error(`Avatar upload failed with status ${uploadRes.status}`);
        }
        avatarKey = key;
      }

      const updated = await updateCurrentUserProfile(
        {
          username: usernameInput.trim() || undefined,
          avatarKey
        },
        token
      );
      setProfile(updated);
      setAvatarFile(null);
      setError(null);
    } catch (err: any) {
      console.error('profile update failed', err);
      setError(err?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <p className="text-sm text-slate-300">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your Profile</h1>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-4">
        {profile?.profileImageUrl ? (
          <img
            src={profile.profileImageUrl}
            alt={profile.username}
            className="w-16 h-16 rounded-full object-cover border border-slate-700"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xl">
            {profile?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="text-sm text-slate-300">
          <p>
            <span className="font-semibold">User ID:</span>{' '}
            <span className="font-mono text-xs">
              {profile?.userId ?? 'loading...'}
            </span>
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-md mt-3">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="your cool username"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Profile picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-2 rounded text-sm ${
            saving
              ? 'bg-slate-700 text-slate-400 cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
};
