import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.REGION || 'us-east-1';
const tableName = process.env.MEME_TABLE_NAME || 'meme-marketplace-api-dev-memes';

const client = new DynamoDBClient({ region });
export const docClient = DynamoDBDocumentClient.from(client);

export interface Meme {
  id: string;
  title: string;
  imageUrl: string;
  tags: string[];
  uploadedBy: string;
  likes: number;
  price: number;
  createdAt: string;
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
  return (result.Item as Meme) || null;
}

export async function listMemes(): Promise<Meme[]> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: tableName
    })
  );

  const items = (result.Items as Meme[]) || [];
  return items;
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
