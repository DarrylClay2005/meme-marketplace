import { Router } from 'express';
import { z } from 'zod';
import { createMeme, getMeme, listMemes, incrementLikes } from '../db/dynamodb';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getPublicUrl } from '../db/s3';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
export const memeRoutes = Router();

export const MemeCreateSchema = z.object({
  title: z.string().min(1),
  key: z.string().min(1),
  tags: z.array(z.string()).default([]),
  price: z.number().min(0).default(0)
});

memeRoutes.get('/', async (req, res) => {
  const memes = await listMemes();
  res.json(memes);
});

memeRoutes.get('/:id', async (req, res) => {
  const meme = await getMeme(req.params.id);
  if (!meme) {
    res.status(404).json({ error: 'Meme not found' });
    return;
  }
  res.json(meme);
});

memeRoutes.post('/', requireAuth, async (req: AuthRequest, res) => {
  const parseResult = MemeCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.flatten() });
    return;
  }

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
});

memeRoutes.post('/:id/like', requireAuth, async (req: AuthRequest, res) => {
  await incrementLikes(req.params.id);
  res.json({ ok: true });
});

memeRoutes.post('/:id/buy', requireAuth, async (req: AuthRequest, res) => {
  const meme = await getMeme(req.params.id);
  if (!meme) {
    res.status(404).json({ error: 'Meme not found' });
    return;
  }

  const purchase = await prisma.purchase.create({
    data: {
      memeId: meme.id,
      userId: req.user!.sub
    }
  });

  res.status(201).json({
    message: 'Purchase recorded',
    purchase
  });
});
