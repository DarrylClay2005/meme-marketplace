import express from 'express';
import cors from 'cors';
import { memeRoutes } from './routes/memes';
import { authRoutes } from './routes/auth';
import { uploadRoutes } from './routes/upload';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/memes', memeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
