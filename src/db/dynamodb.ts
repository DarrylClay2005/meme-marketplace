import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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
  return (result.Items as Meme[]) || [];
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
