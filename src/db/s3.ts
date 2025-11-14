import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.REGION || 'us-east-1';
const bucketName = process.env.MEME_BUCKET_NAME || 'meme-marketplace-api-dev-images';

const s3Client = new S3Client({ region });

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    // Make uploaded meme images publicly readable so the frontend can display them
    ACL: 'public-read'
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 300 });
}

export function getPublicUrl(key: string): string {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}
