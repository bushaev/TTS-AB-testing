import express from 'express';
import cors from 'cors';
import path from 'path';
import { router as audioRouter } from './routes/audio';
import { router as userStateRouter } from './routes/userState';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
  next(err);
});

// API routes
app.use('/api/audio', audioRouter);
app.use('/api/state', userStateRouter);

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../dist')));

// Serve index.html for all other routes (for SPA routing)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Audio files will be served from: ${path.join(__dirname, '../audio')}`);
}); 