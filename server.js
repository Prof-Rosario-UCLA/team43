import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './db.js';
import OpenAI from 'openai'; // ✅ New OpenAI SDK v4 import

dotenv.config();

// Setup __dirname for ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files only in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static('uploads'));
}

// Connect to MongoDB
let db;
connectDB().then(database => {
  db = database;
  console.log("✅ MongoDB connected");
});

// Configure file uploads with Multer
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

// Initialize OpenAI client (v4 style)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Upload endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  console.log('📥 Received file:', req.file.originalname);

  try {
    const record = {
      filename: req.file.filename,
      uploadTime: new Date(),
      extractedText: '',   // placeholder for OCR result
      keywords: '',        // will be filled by GPT
    };

    const result = await db.collection('uploads').insertOne(record);
    const insertedId = result.insertedId;

    // Placeholder extracted text (replace with OCR result later)
    const extractedText = 'This is a placeholder text for OCR extraction.';

    // Use Chat Completions API (gpt-3.5-turbo)
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Extract 3 to 5 keywords from the following question:\n"${extractedText}"\nReturn them comma-separated.`,
        },
      ],
    });
    
    const keywords = completion.choices[0].message.content.trim();

    // Update the record with extracted content
    await db.collection('uploads').updateOne(
      { _id: insertedId },
      { $set: { extractedText, keywords } }
    );

    res.json({ message: 'Upload successful', filename: req.file.filename });
  } catch (err) {
    console.error('❌ Upload failed:', err.message);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Get latest upload records
app.get('/api/records', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ message: 'Database not ready' });

    const records = await db.collection('uploads')
      .find({})
      .sort({ uploadTime: -1 })
      .limit(20)
      .toArray();

    res.json(records);
  } catch (err) {
    console.error('❌ Failed to fetch records:', err.message);
    res.status(500).json({ message: 'Fetch failed' });
  }
});

// Clear all records from database
app.get('/api/clear-records', async (req, res) => {
  try {
    const result = await db.collection('uploads').deleteMany({});
    res.send(`✅ Cleared ${result.deletedCount} record(s).`);
  } catch (err) {
    res.status(500).send('❌ Failed to clear records: ' + err.message);
  }
});

// Debug route to check DB collections
app.get('/api/hello', async (req, res) => {
  const collections = db ? await db.listCollections().toArray() : [];
  res.send('Hello from server! DB contains: ' + collections.map(c => c.name).join(', '));
});

// Fallback to React frontend for non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
