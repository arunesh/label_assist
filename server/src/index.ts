import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import healthRouter from './routes/health.js';
import verifyRouter from './routes/verify.js';
import recompareRouter from './routes/recompare.js';
import batchRouter from './routes/batch.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024;

// Middleware
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api', healthRouter);
app.use('/api', upload.single('image'), verifyRouter);
app.use('/api', recompareRouter);
app.use('/api', batchRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
