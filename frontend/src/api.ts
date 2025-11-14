const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

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
  if (!res.ok) throw new Error('Failed to get upload URL');
  return res.json();
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
