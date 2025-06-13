import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './db.js'; // 

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// ✅ Multer 
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

// ✅ 
let db;
connectDB().then(database => {
  db = database;
  console.log("✅ MongoDB connected");
});

// ✅ 
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log('Received file:', req.file.originalname);

  // 
  try {
    const record = {
      filename: req.file.filename,
      uploadTime: new Date(),
      extractedText: '', // 
    };
    if (db) {
      await db.collection('uploads').insertOne(record);
    }
  } catch (err) {
    console.error('❌ Failed to save record:', err.message);
  }

  res.json({
    message: 'Upload successful',
    filename: req.file.filename
  });
});

// ✅ 
app.get('/api/hello', async (req, res) => {
  const collections = db ? await db.listCollections().toArray() : [];
  res.send('Hello from server! DB contains: ' + collections.map(c => c.name).join(', '));
});

// ✅ React fallback
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ 
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
