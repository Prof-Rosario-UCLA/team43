import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './db.js';

dotenv.config();

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Only serve uploaded files locally (GAE uses /tmp which can't be exposed)
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static('uploads'));
}

// Multer upload configuration
const upload = multer({
  storage: multer.diskStorage({
    destination: process.env.NODE_ENV === 'production' ? '/tmp' : 'uploads/',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = Date.now() + ext;
      cb(null, filename);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed!'));
    }
    cb(null, true);
  }
});

// Get upload history (latest 20 uploads)
app.get('/api/records', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ message: 'Database not ready' });
    }

    const records = await db.collection('uploads')
      .find({})
      .sort({ uploadTime: -1 })
      .limit(20)
      .toArray();

    res.json(records);
  } catch (err) {
    console.error('❌ Failed to fetch records:', err.message);
    res.status(500).json({ message: 'Error fetching upload records' });
  }
});


// Connect to MongoDB
let db;
connectDB().then(database => {
  db = database;
  console.log("✅ MongoDB connected");
});

// Upload API (saves file + DB record)
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log('📥 Received file:', req.file.originalname);

  try {
    const record = {
      filename: req.file.filename,
      uploadTime: new Date(),
      extractedText: '', // placeholder for OCR/GPT content
    };
    if (db) {
      await db.collection('uploads').insertOne(record);
      console.log(`✅ Saved record for: ${req.file.filename}`);
    }
    res.json({
      message: 'Upload successful',
      filename: req.file.filename
    });
  } catch (err) {
    console.error('❌ Failed to save record:', err.message);
    res.status(500).json({ message: 'Upload failed: could not save record' });
  }
});

// 🔥 Temporary cleanup route (DEV ONLY)
app.get('/api/clear-records', async (req, res) => {
  try {
    const result = await db.collection('uploads').deleteMany({});
    res.send(`✅ Cleared ${result.deletedCount} record(s).`);
  } catch (err) {
    res.status(500).send('❌ Failed to clear records: ' + err.message);
  }
});


// Simple test route
app.get('/api/hello', async (req, res) => {
  const collections = db ? await db.listCollections().toArray() : [];
  res.send('Hello from server! DB contains: ' + collections.map(c => c.name).join(', '));
});

// Fallback: Serve React frontend for any non-API route
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
