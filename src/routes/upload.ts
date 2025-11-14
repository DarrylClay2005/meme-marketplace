import { Router } from 'express';
import { z } from 'zod';
import { getUploadUrl } from '../db/s3';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { randomUUID } from 'crypto';

export const uploadRoutes = Router();

const UploadRequestSchema = z.object({
  contentType: z.string().min(1)
});

uploadRoutes.post('/url', requireAuth, async (req: AuthRequest, res) => {
  const parseResult = UploadRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.flatten() });
    return;
  }

  try {
    const { contentType } = parseResult.data;
    const key = `${req.user!.sub}/${randomUUID()}`;
    const uploadUrl = await getUploadUrl(key, contentType);

    res.json({ key, uploadUrl });
  } catch (error) {
    console.error('[upload] failed to create upload url', { error });
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});
