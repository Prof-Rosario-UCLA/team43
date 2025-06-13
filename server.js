import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ObjectId } from 'mongodb';
import connectDB from './db.js';
import OpenAI from 'openai';
import Tesseract from 'tesseract.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static('uploads'));
}

let db;
connectDB().then(database => {
  db = database;
  console.log("✅ MongoDB connected");
});

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Upload endpoint with OCR + keyword extraction
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  console.log('📥 Received file:', req.file.originalname);

  try {
    const record = {
      filename: req.file.filename,
      uploadTime: new Date(),
      extractedText: '',
      keywords: '',
      solution: '', // <- optional solution field, initially blank
    };

    const result = await db.collection('uploads').insertOne(record);
    const insertedId = result.insertedId;

    // OCR step
    const imagePath =
      process.env.NODE_ENV === 'production'
        ? path.join('/tmp', req.file.filename)
        : path.join(__dirname, 'uploads', req.file.filename);

    const ocr = await Tesseract.recognize(imagePath, 'eng');
    const extractedText = ocr.data.text.trim().slice(0, 500);
    console.log('🔍 OCR Result:', extractedText);

    // Keyword extraction step
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

// 🔍 Solve question using GPT (on-demand)
app.post('/api/solve/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const record = await db.collection('uploads').findOne({ _id: new ObjectId(id) });

    if (!record || !record.extractedText) {
      return res.status(404).json({ message: 'Record not found or no text to solve.' });
    }

    console.log(`🤖 Solving for: ${record.extractedText}`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Please solve the following question in detail:\n"${record.extractedText}"`,
        },
      ],
    });

    const solution = completion.choices[0].message.content.trim();

    await db.collection('uploads').updateOne(
      { _id: new ObjectId(id) },
      { $set: { solution } }
    );

    res.json({ solution });
  } catch (err) {
    console.error('❌ Failed to solve:', err.message);
    res.status(500).json({ message: 'Solve failed' });
  }
});

// Get latest records
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

// Delete single record
app.delete('/api/records/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.collection('uploads').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      res.json({ message: '✅ Record deleted' });
    } else {
      res.status(404).json({ message: '❌ Record not found' });
    }
  } catch (err) {
    console.error('❌ Failed to delete record:', err.message);
    res.status(500).json({ message: 'Error deleting record' });
  }
});

// Clear all records
app.get('/api/clear-records', async (req, res) => {
  try {
    const result = await db.collection('uploads').deleteMany({});
    res.send(`✅ Cleared ${result.deletedCount} record(s).`);
  } catch (err) {
    res.status(500).send('❌ Failed to clear records: ' + err.message);
  }
});

// Debug route
app.get('/api/hello', async (req, res) => {
  const collections = db ? await db.listCollections().toArray() : [];
  res.send('Hello from server! DB contains: ' + collections.map(c => c.name).join(', '));
});

// Frontend fallback
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
