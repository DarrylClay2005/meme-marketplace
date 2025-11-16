import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = process.env.REGION || 'us-east-1';
const bucketName = process.env.MEME_BUCKET_NAME || 'meme-marketplace-api-dev-images';

const s3Client = new S3Client({ region });

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType
    // Note: We do NOT set ACLs here because the bucket uses ObjectOwnership=BucketOwnerEnforced
    // and public read access is granted via the bucket policy instead.
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 300 });
}

export function getPublicUrl(key: string): string {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

export function extractKeyFromUrl(url: string): string | null {
  const prefix = `https://${bucketName}.s3.${region}.amazonaws.com/`
  if (url.startsWith(prefix)) return url.substring(prefix.length)
  try {
    const u = new URL(url)
    return u.pathname.startsWith('/') ? u.pathname.substring(1) : u.pathname
  } catch {
    return null
  }
}

export async function deleteObjectByKey(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }))
}

export async function getReadUrl(key: string, expiresIn = 60): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: bucketName, Key: key })
  return getSignedUrl(s3Client, cmd, { expiresIn })
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: key
      })
    );
    return true;
  } catch (err: any) {
    // If the object is not found, AWS SDK v3 will throw an error with name 'NotFound'
    if (err && (err.name === 'NotFound' || err.name === 'NoSuchKey')) {
      return false;
    }
    throw err;
  }
}
