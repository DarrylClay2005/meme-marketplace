import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getPublicUrl } from '../db/s3';
import { getUserProfile, putUserProfile, UserProfile, reserveUsername, releaseUsername } from '../db/dynamodb';

export const userRoutes = Router();

const UserProfileUpdateSchema = z.object({
  username: z.string().trim().min(1).max(32).optional(),
  avatarKey: z.string().trim().min(1).optional()
});

function buildDefaultProfile(userId: string, email: string | undefined): UserProfile {
  const baseName = email?.split('@')[0] || `user-${userId.slice(0, 8)}`;
  const now = new Date().toISOString();
  return {
    userId,
    username: baseName,
    createdAt: now,
    updatedAt: now
  };
}

async function ensureUniqueUsername(userId: string, baseName: string): Promise<string> {
  const maxAttempts = 5;
  let candidate = baseName;

  for (let i = 0; i < maxAttempts; i++) {
    const reserved = await reserveUsername(userId, candidate);
    if (reserved) return candidate;
    const suffix = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    candidate = `${baseName}${suffix}`;
  }

  throw new Error('Could not allocate unique username');
}

userRoutes.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.sub;
    const email = req.user!.email;
    let profile = await getUserProfile(userId);
    if (!profile) {
      let baseProfile = buildDefaultProfile(userId, email);
      const uniqueUsername = await ensureUniqueUsername(userId, baseProfile.username);
      baseProfile.username = uniqueUsername;
      await putUserProfile(baseProfile);
      profile = baseProfile;
    }
    res.json(profile);
  } catch (error) {
    console.error('[users] failed to get current user profile', { error });
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

userRoutes.put('/me', requireAuth, async (req: AuthRequest, res) => {
  const parseResult = UserProfileUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.flatten() });
    return;
  }

  try {
    const userId = req.user!.sub;
    const email = req.user!.email;
    let profile = await getUserProfile(userId);
    if (!profile) {
      profile = buildDefaultProfile(userId, email);
    }

    const previousUsername = profile.username;
    const { username, avatarKey } = parseResult.data;

    if (username !== undefined) {
      const desired = username.trim();
      if (desired && desired !== previousUsername) {
        const reserved = await reserveUsername(userId, desired);
        if (!reserved) {
          res.status(409).json({ error: 'Username already taken' });
          return;
        }
        profile.username = desired;
      }
    }
    if (avatarKey) {
      profile.profileImageUrl = getPublicUrl(avatarKey);
    }
    profile.updatedAt = new Date().toISOString();

    await putUserProfile(profile);

    if (profile.username && profile.username !== previousUsername && previousUsername) {
      try {
        await releaseUsername(previousUsername);
      } catch (err) {
        console.error('[users] failed to release old username', { previousUsername, err });
      }
    }

    res.json(profile);
  } catch (error) {
    console.error('[users] failed to update current user profile', { error });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

userRoutes.get('/:id', async (req, res) => {
  try {
    const profile = await getUserProfile(req.params.id);
    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return a public view of the profile
    res.json({
      userId: profile.userId,
      username: profile.username,
      profileImageUrl: profile.profileImageUrl
    });
  } catch (error) {
    console.error('[users] failed to get profile', { id: req.params.id, error });
    res.status(500).json({ error: 'Failed to load profile' });
  }
});