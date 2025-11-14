import { MemeCreateSchema } from './routes/memes';

describe('MemeCreateSchema', () => {
  it('accepts valid payload', () => {
    const result = MemeCreateSchema.safeParse({
      title: 'Test meme',
      key: 'user/123',
      tags: ['funny'],
      price: 0
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = MemeCreateSchema.safeParse({
      key: 'user/123',
      tags: [],
      price: 0
    });
    expect(result.success).toBe(false);
  });
});
