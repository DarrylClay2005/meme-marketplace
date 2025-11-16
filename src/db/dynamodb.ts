import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, BatchWriteCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.REGION || 'us-east-1';
const tableName = process.env.MEME_TABLE_NAME || 'meme-marketplace-api-dev-memes';
const likesTableName = process.env.MEME_LIKES_TABLE_NAME || 'meme-marketplace-api-dev-likes';
const usersTableName = process.env.MEME_USERS_TABLE_NAME || 'meme-marketplace-api-dev-users';
const usernamesTableName = process.env.MEME_USERNAMES_TABLE_NAME || 'meme-marketplace-api-dev-usernames';
const downloadsTableName = process.env.MEME_DOWNLOADS_TABLE_NAME || 'meme-marketplace-api-dev-downloads';
const purchasesTableName = process.env.MEME_PURCHASES_TABLE_NAME || 'meme-marketplace-api-dev-purchases';

const client = new DynamoDBClient({ region });
export const docClient = DynamoDBDocumentClient.from(client);

export interface Meme {
  id: string;
  title: string;
  imageUrl: string;
  tags: string[];
  uploadedBy: string;
  likes: number;
  purchases: number;
  price: number;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Simple set of starter memes so the homepage isn't empty on first load.
// These use fixed IDs so we don't insert duplicates if seeding runs multiple times.
const STARTER_MEMES: Meme[] = [
  {
    id: 'starter-1-distracted-boyfriend',
    title: 'Distracted Boyfriend',
    imageUrl: 'https://i.imgflip.com/1ur9b0.jpg',
    tags: ['classic', 'relationship', 'reaction'],
    uploadedBy: 'system',
    likes: 0,
    purchases: 0,
    price: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'starter-2-drake-hotline',
    title: 'Drake Hotline Bling',
    imageUrl: 'https://i.imgflip.com/30b1gx.jpg',
    tags: ['drake', 'preference', 'reaction'],
    uploadedBy: 'system',
    likes: 0,
    purchases: 0,
    price: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'starter-3-doge',
    title: 'Doge Wow',
    imageUrl: 'https://i.imgflip.com/4t0m5.jpg',
    tags: ['doge', 'crypto', 'wow'],
    uploadedBy: 'system',
    likes: 0,
    purchases: 0,
    price: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'starter-4-one-does-not-simply',
    title: 'One Does Not Simply',
    imageUrl: 'https://i.imgflip.com/1bij.jpg',
    tags: ['lotr', 'classic'],
    uploadedBy: 'system',
    likes: 0,
    purchases: 0,
    price: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'starter-5-success-kid',
    title: 'Success Kid',
    imageUrl: 'https://i.imgflip.com/1bhk.jpg',
    tags: ['success', 'wholesome'],
    uploadedBy: 'system',
    likes: 0,
    purchases: 0,
    price: 0,
    createdAt: new Date().toISOString()
  }
];

export async function createMeme(meme: Meme): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: meme
    })
  );
}

export async function getMeme(id: string): Promise<Meme | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { id }
    })
  );
  if (!result.Item) return null;
  const raw = result.Item as any;
  const meme: Meme = {
    purchases: 0,
    ...raw
  };
  if (typeof meme.purchases !== 'number') {
    meme.purchases = 0;
  }
  return meme;
}

export async function listMemes(): Promise<Meme[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: tableName
    })
  );

  const items = (result.Items as any[]) || [];
  return items.map((raw) => {
    const meme: Meme = {
      purchases: 0,
      ...raw
    };
    if (typeof meme.purchases !== 'number') {
      meme.purchases = 0;
    }
    return meme;
  });
}

export async function ensureStarterMemes(): Promise<void> {
  const existing = await listMemes();
  if (existing && existing.length > 0) return;

  // Only write if none exist yet, using fixed IDs to avoid duplicates.
  await docClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [tableName]: STARTER_MEMES.map((meme) => ({
          PutRequest: {
            Item: meme
          }
        }))
      }
    })
  );
}

export async function incrementLikes(id: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: 'SET likes = if_not_exists(likes, :zero) + :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0
      }
    })
  );
}

export async function decrementLikes(id: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: 'SET likes = if_not_exists(likes, :zero) - :dec',
      ExpressionAttributeValues: {
        ':dec': 1,
        ':zero': 0
      }
    })
  );
}

export async function incrementPurchases(id: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: 'SET purchases = if_not_exists(purchases, :zero) + :inc',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0
      }
    })
  );
}

export async function recordUserLike(userId: string, memeId: string): Promise<boolean> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: likesTableName,
        Item: {
          userId,
          memeId,
          createdAt: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(memeId)'
      })
    );
    return true;
  } catch (err: any) {
    if (err && err.name === 'ConditionalCheckFailedException') {
      // User already liked this meme; not an error
      return false;
    }
    throw err;
  }
}

export async function removeUserLike(userId: string, memeId: string): Promise<boolean> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: likesTableName,
        Key: {
          userId,
          memeId
        },
        ConditionExpression: 'attribute_exists(memeId)'
      })
    );
    return true;
  } catch (err: any) {
    if (err && err.name === 'ConditionalCheckFailedException') {
      // User had not liked this meme; not an error
      return false;
    }
    throw err;
  }
}

export async function getUserLikedMemes(userId: string): Promise<Meme[]> {
  const likesResult = await docClient.send(
    new QueryCommand({
      TableName: likesTableName,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: {
        ':u': userId
      }
    })
  );

  const likes = (likesResult.Items as { memeId: string }[] | undefined) ?? [];
  if (!likes.length) return [];

  const memes = await Promise.all(likes.map((like) => getMeme(like.memeId)));
  return memes.filter((meme): meme is Meme => Boolean(meme));
}

export async function recordUserDownload(userId: string, memeId: string): Promise<void> {
  // Upsert one item per user+meme. This deduplicates while updating the timestamp.
  await docClient.send(
    new UpdateCommand({
      TableName: downloadsTableName,
      Key: { userId, memeId },
      UpdateExpression: 'SET downloadedAt = :ts',
      ExpressionAttributeValues: { ':ts': new Date().toISOString() }
    })
  );
}

export async function getUserDownloadRecords(userId: string): Promise<{ memeId: string; downloadedAt?: string }[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: downloadsTableName,
      IndexName: 'DownloadsByTime',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId },
      ScanIndexForward: false
    })
  );
  const items = (result.Items as { userId: string; memeId: string; downloadedAt?: string }[] | undefined) ?? [];
  return items.map(i => ({ memeId: i.memeId, downloadedAt: i.downloadedAt }));
}

export async function getDownloadsCountForMeme(memeId: string): Promise<number> {
  const result = await docClient.send(new QueryCommand({
    TableName: downloadsTableName,
    IndexName: 'DownloadsByMeme',
    KeyConditionExpression: 'memeId = :m',
    ExpressionAttributeValues: { ':m': memeId },
    Select: 'COUNT'
  }))
  return result.Count || 0
}

export async function getUserDownloadedMemes(userId: string): Promise<Meme[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: downloadsTableName,
      IndexName: 'DownloadsByTime',
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: {
        ':u': userId
      },
      ScanIndexForward: false
    })
  );
  const items = (result.Items as { memeId: string }[] | undefined) ?? [];
  if (!items.length) return [];
  const memes = await Promise.all(items.map((d) => getMeme(d.memeId)));
  return memes.filter((meme): meme is Meme => Boolean(meme));
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: usersTableName,
      Key: { userId }
    })
  );
  if (!result.Item) return null;
  return result.Item as UserProfile;
}

export async function putUserProfile(profile: UserProfile): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: usersTableName,
      Item: profile
    })
  );
}

export async function reserveUsername(userId: string, username: string): Promise<boolean> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: usernamesTableName,
        Item: {
          username,
          userId,
          createdAt: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(username)'
      })
    );
    return true;
  } catch (err: any) {
    if (err && err.name === 'ConditionalCheckFailedException') {
      return false;
    }
    throw err;
  }
}

export async function releaseUsername(username: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: usernamesTableName,
      Key: { username }
    })
  );
}

export async function deleteMeme(id: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { id }
    })
  );
}

export async function recordUserPurchaseIfNew(userId: string, memeId: string): Promise<boolean> {
  try {
    await docClient.send(new PutCommand({
      TableName: purchasesTableName,
      Item: { userId, memeId, purchasedAt: new Date().toISOString() },
      ConditionExpression: 'attribute_not_exists(memeId)'
    }))
    return true
  } catch (err: any) {
    if (err && err.name === 'ConditionalCheckFailedException') return false
    throw err
  }
}

export async function hasUserPurchased(userId: string, memeId: string): Promise<boolean> {
  const res = await docClient.send(new GetCommand({
    TableName: purchasesTableName,
    Key: { userId, memeId }
  }))
  return !!res.Item
}
