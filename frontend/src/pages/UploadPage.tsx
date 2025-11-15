import React, { useState } from 'react';
import { createMeme, getUploadUrl } from '../api';
import { useAuth } from '../auth';

export const UploadPage: React.FC = () => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(0);
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('You must be logged in to upload memes');
      return;
    }
    if (!file) {
      alert('Please choose an image file');
      return;
    }

    try {
      setSubmitting(true);
      setStatus('Requesting upload URL...');
      const { key, uploadUrl } = await getUploadUrl(file.type, token);

      setStatus('Uploading to S3...');
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload to storage failed with status ${uploadResponse.status}`);
      }

      setStatus('Creating meme record...');
      const meme = await createMeme(
        {
          title,
          key,
          price,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        },
        token
      );

      setStatus(`Uploaded! New meme ID: ${meme.id}`);
      setTitle('');
      setPrice(0);
      setTags('');
      setFile(null);
    } catch (error: any) {
      console.error('upload failed', error);
      setStatus(`Upload failed: ${error?.message ?? 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-2xl font-semibold">Upload a Meme</h1>
      <p className="text-sm text-slate-300">
        This form talks to the backend API to generate a pre-signed S3 URL and then creates a
        meme record in DynamoDB. Static images and animated GIFs are both supported.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Price (USD)</label>
          <input
            type="number"
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            min={0}
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Tags (comma separated)</label>
          <input
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="reaction, dank, wholesome"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Image file</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={`px-4 py-2 rounded text-sm ${
            submitting ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {submitting ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {status && <p className="text-sm text-slate-300">{status}</p>}
    </div>
  );
};
