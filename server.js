const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// ✅ Serve front-end first (this line must come first)
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Multer upload config
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

// Upload API
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  console.log('Received file:', req.file.originalname);
  res.json({
    message: 'Upload successful',
    filename: req.file.filename
  });
});

// Simple API for test
app.get('/api/hello', (req, res) => {
  res.send('Hello from server!');
});

// React fallback for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
