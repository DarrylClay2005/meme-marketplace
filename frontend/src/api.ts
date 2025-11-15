// Default to the deployed API Gateway URL, but allow overriding via VITE_API_BASE_URL for local dev.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://94whf4566l.execute-api.us-east-1.amazonaws.com';

export interface Meme {
  id: string;
  title: string;
  imageUrl: string;
  tags: string[];
  price: number;
  likes: number;
  purchases: number;
  uploadedBy: string;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  profileImageUrl?: string;
}

export async function fetchMemes(): Promise<Meme[]> {
  const res = await fetch(`${API_BASE_URL}/api/memes`);
  if (!res.ok) throw new Error('Failed to load memes');
  return res.json();
}

export async function fetchMeme(id: string): Promise<Meme> {
  const res = await fetch(`${API_BASE_URL}/api/memes/${id}`);
  if (!res.ok) throw new Error('Failed to load meme');
  return res.json();
}

export async function likeMeme(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/memes/${id}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to like meme');
}

export async function unlikeMeme(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/memes/${id}/like`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to unlike meme');
}

export async function buyMeme(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/memes/${id}/buy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to buy meme');
}

export async function getUploadUrl(contentType: string, token: string): Promise<{ key: string; uploadUrl: string }> {
  const res = await fetch(`${API_BASE_URL}/api/upload/url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ contentType })
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore JSON parse errors; we'll fall back to generic messages
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized while requesting upload URL. Please sign in again.');
    }
    const backendMessage = data?.error || data?.detail || data?.message;
    const msg = backendMessage
      ? `Failed to get upload URL: ${backendMessage}`
      : `Failed to get upload URL (status ${res.status})`;
    throw new Error(msg);
  }

  return data as { key: string; uploadUrl: string };
}

export async function createMeme(params: { title: string; key: string; tags: string[]; price: number }, token: string): Promise<Meme> {
  const res = await fetch(`${API_BASE_URL}/api/memes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to create meme');
  return res.json();
}

export async function fetchLikedMemes(token: string): Promise<Meme[]> {
  const res = await fetch(`${API_BASE_URL}/api/memes/me/liked`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to load liked memes');
  return res.json();
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}`);
  if (!res.ok) throw new Error('Failed to load user profile');
  return res.json();
}

export async function fetchCurrentUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to load current user profile');
  return res.json();
}

export async function updateCurrentUserProfile(
  params: { username?: string; avatarKey?: string },
  token: string
): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}
