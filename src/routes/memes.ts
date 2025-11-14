import { Router } from 'express';
import { z } from 'zod';
import { createMeme, getMeme, listMemes, incrementLikes, ensureStarterMemes, recordUserLike, getUserLikedMemes } from '../db/dynamodb';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getPublicUrl } from '../db/s3';
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
    const memes = await listMemes();
    res.json(memes);
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

    const meme = {
      id,
      title,
      imageUrl: getPublicUrl(key),
      tags,
      price,
      uploadedBy: req.user!.sub,
      likes: 0,
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

memeRoutes.post('/:id/buy', requireAuth, async (req: AuthRequest, res) => {
  try {
    const meme = await getMeme(req.params.id);
    if (!meme) {
      res.status(404).json({ error: 'Meme not found' });
      return;
    }

    // For this capstone, we don't persist purchases in a real payment system.
    // We simply acknowledge the purchase to keep the flow simple and demo-friendly.
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
