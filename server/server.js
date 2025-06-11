const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (for development and deployment flexibility)
app.use(cors());
app.use(express.json());

// Serve uploaded files statically from the "uploads" directory
app.use('/uploads', express.static('uploads'));

// Configure multer to store files in "uploads/" with a timestamped filename
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = Date.now() + ext;
      cb(null, filename);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed!'));
    }
    cb(null, true);
  }
});

// Upload route to handle file upload from the frontend
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log('Received file:', req.file.originalname);
  res.json({
    message: 'Upload successful',
    filename: req.file.filename // send filename back to frontend
  });
});

// Test route
app.get('/api/hello', (req, res) => {
  res.send('Hello from server!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
