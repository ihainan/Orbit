import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import postsRouter from './routes/posts.js';
import mediaRouter from './routes/media.js';
import userRouter from './routes/user.js';
import avatarsRouter from './routes/avatars.js';

// Import middleware
import errorHandler from './middleware/errorHandler.js';

// Import database to test connection
import pool from './config/database.js';
import User from './models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 51001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Orbit backend is running' });
});

// API routes
app.use('/api/posts', postsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/user', userRouter);
app.use('/api/avatars', avatarsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: 'The requested resource was not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
  await User.ensureDefault();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Orbit backend server is running on 0.0.0.0:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await pool.end();
  process.exit(0);
});

export default app;
