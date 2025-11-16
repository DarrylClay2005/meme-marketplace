import { Router } from 'express';
import { z } from 'zod';
import { createMeme, getMeme, listMemes, incrementLikes, ensureStarterMemes, recordUserLike, getUserLikedMemes, incrementPurchases, decrementLikes, removeUserLike, recordUserDownload, getUserDownloadedMemes, getUserDownloadRecords, deleteMeme } from '../db/dynamodb';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getPublicUrl, objectExists } from '../db/s3';
import { randomUUID } from 'crypto';

export const memeRoutes = Router();

export const MemeCreateSchema = z.object({
  title: z.string().min(1),
  key: z.string().min(1),
  tags: z.array(z.string()).default([]),
  price: z.number().min(0).default(0)
});

memeRoutes.get('/', async (req, res) => {
  try {
    // Ensure we have some starter memes the first time the API is called
    await ensureStarterMemes();
    const base = await listMemes();
    // Attach downloadsCount per meme (demo performance)
    const { getDownloadsCountForMeme } = await import('../db/dynamodb');
    const withCounts = await Promise.all(base.map(async (m) => ({
      ...m,
      downloadsCount: await getDownloadsCountForMeme(m.id)
    })));
    res.json(withCounts);
  } catch (error) {
    console.error('[memes] failed to list memes', error);
    res.status(500).json({ error: 'Failed to load memes' });
  }
});

memeRoutes.get('/me/liked', requireAuth, async (req: AuthRequest, res) => {
  try {
    const memes = await getUserLikedMemes(req.user!.sub);
    res.json(memes);
  } catch (error) {
    console.error('[memes] failed to get liked memes for user', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to load liked memes' });
  }
});

memeRoutes.get('/:id', async (req, res) => {
  try {
    const meme = await getMeme(req.params.id);
    if (!meme) {
      res.status(404).json({ error: 'Meme not found' });
      return;
    }
    res.json(meme);
  } catch (error) {
    console.error('[memes] failed to get meme', { id: req.params.id, error });
    res.status(500).json({ error: 'Failed to load meme' });
  }
});

memeRoutes.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parseResult = MemeCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.flatten() });
    return;
  }

  try {
    const { title, key, tags, price } = parseResult.data;
    const id = randomUUID();
    const now = new Date().toISOString();

    // Guard: ensure the image object actually exists in S3 before we create a meme record.
    const exists = await objectExists(key);
    if (!exists) {
      res.status(400).json({ error: 'Image file not found in storage. Please re-upload and try again.' });
      return;
    }

    const meme = {
      id,
      title,
      imageUrl: getPublicUrl(key),
      tags,
      price,
      uploadedBy: req.user!.sub,
      likes: 0,
      purchases: 0,
      createdAt: now
    };

    await createMeme(meme);
    res.status(201).json(meme);
  } catch (error) {
    console.error('[memes] failed to create meme', { body: req.body, error });
    res.status(500).json({ error: 'Failed to create meme' });
  }
});

memeRoutes.post('/:id/like', requireAuth, async (req: AuthRequest, res) => {
  try {
    const memeId = req.params.id;
    const userId = req.user!.sub;

    // Only increment the like count if this user hasn't liked this meme before
    const created = await recordUserLike(userId, memeId);
    if (created) {
      await incrementLikes(memeId);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('[memes] failed to like meme', { id: req.params.id, error });
    res.status(500).json({ error: 'Failed to like meme' });
  }
});

memeRoutes.delete('/:id/like', requireAuth, async (req: AuthRequest, res) => {
  try {
    const memeId = req.params.id;
    const userId = req.user!.sub;

    const removed = await removeUserLike(userId, memeId);
    if (removed) {
      await decrementLikes(memeId);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('[memes] failed to unlike meme', { id: req.params.id, error });
    res.status(500).json({ error: 'Failed to unlike meme' });
  }
});

memeRoutes.get('/me/downloads', requireAuth, async (req: AuthRequest, res) => {
  try {
    const records = await getUserDownloadRecords(req.user!.sub);
    const items = await Promise.all(records.map(async (r) => ({
      downloadedAt: r.downloadedAt,
      meme: await getMeme(r.memeId),
    })));
    res.json(items.filter(i => i.meme));
  } catch (error) {
    console.error('[memes] failed to get downloads for user', { userId: req.user!.sub, error });
    res.status(500).json({ error: 'Failed to load downloads' });
  }
});

memeRoutes.post('/:id/download', requireAuth, async (req: AuthRequest, res) => {
  try {
    const memeId = req.params.id;
    const meme = await getMeme(memeId);
    if (!meme) return res.status(404).json({ error: 'Meme not found' });
    await recordUserDownload(req.user!.sub, memeId);
    res.json({ ok: true });
  } catch (error) {
    console.error('[memes] failed to record download', { id: req.params.id, error });
    res.status(500).json({ error: 'Failed to record download' });
  }
});

// Admin utilities
function ensureOwner(req: AuthRequest, res: any): boolean {
  const owner = process.env.OWNER_USER_ID;
  if (!owner || req.user!.sub !== owner) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

memeRoutes.get('/admin/memes', requireAuth, async (req: AuthRequest, res) => {
  if (!ensureOwner(req, res)) return;
  try {
    const memes = await listMemes();
    res.json(memes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list memes' });
  }
});

memeRoutes.delete('/admin/memes/:id', requireAuth, async (req: AuthRequest, res) => {
  if (!ensureOwner(req, res)) return;
  try {
    const m = await getMeme(req.params.id);
    if (!m) return res.status(404).json({ error: 'Not found' });
    const { extractKeyFromUrl, deleteObjectByKey } = await import('../db/s3');
    const key = extractKeyFromUrl(m.imageUrl);
    if (key) await deleteObjectByKey(key);
    await deleteMeme(m.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meme' });
  }
});

memeRoutes.get('/trending', async (_req, res) => {
  try {
    const base = await listMemes();
    const { getDownloadsCountForMeme } = await import('../db/dynamodb');
    const withStats = await Promise.all(base.map(async (m) => {
      const downloads = await getDownloadsCountForMeme(m.id)
      const ageHours = Math.max(1, (Date.now() - new Date(m.createdAt).getTime()) / 3600000)
      const score = m.likes + downloads * 2 - Math.log10(ageHours)
      return { ...m, downloadsCount: downloads, trendingScore: score }
    }))
    withStats.sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0))
    res.json(withStats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to load trending' })
  }
});

memeRoutes.get('/:id/purchased', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { hasUserPurchased } = await import('../db/dynamodb')
    const purchased = await hasUserPurchased(req.user!.sub, req.params.id)
    res.json({ purchased })
  } catch (error) {
    res.status(500).json({ error: 'Failed' })
  }
});

memeRoutes.get('/:id/original-url', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { hasUserPurchased } = await import('../db/dynamodb')
    const ok = await hasUserPurchased(req.user!.sub, req.params.id)
    if (!ok) return res.status(403).json({ error: 'Not purchased' })
    const m = await getMeme(req.params.id)
    if (!m) return res.status(404).json({ error: 'Not found' })
    const { extractKeyFromUrl, getReadUrl } = await import('../db/s3')
    const key = extractKeyFromUrl(m.imageUrl)
    if (!key) return res.status(500).json({ error: 'Bad key' })
    const url = await getReadUrl(key, 60)
    res.json({ url })
  } catch (error) {
    res.status(500).json({ error: 'Failed' })
  }
});

memeRoutes.post('/:id/buy', requireAuth, async (req: AuthRequest, res) => {
  try {
    const meme = await getMeme(req.params.id);
    if (!meme) {
      res.status(404).json({ error: 'Meme not found' });
      return;
    }

    // Demo purchase: upsert per-user purchase record and increment total only on first time
    const { recordUserPurchaseIfNew } = await import('../db/dynamodb')
    const created = await recordUserPurchaseIfNew(req.user!.sub, meme.id)
    if (created) await incrementPurchases(meme.id)

    res.status(201).json({
      message: 'Purchase recorded (demo only, no real payment processed)',
      memeId: meme.id,
      userId: req.user!.sub
    });
  } catch (error) {
    console.error('[memes] failed to record purchase', { id: req.params.id, error });
    res.status(500).json({ error: 'Failed to record purchase' });
  }
});
