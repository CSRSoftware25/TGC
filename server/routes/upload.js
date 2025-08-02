const express = require('express');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const Message = require('../models/Message');

const router = express.Router();

// Upload file
router.post('/file', auth, upload.single('file'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileSize = req.file.size;
    const fileName = req.file.originalname;
    
    // Determine file type
    let fileType = 'file';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        url: fileUrl,
        name: fileName,
        size: fileSize,
        type: fileType,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Delete file
router.delete('/file/:filename', auth, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get file info
router.get('/file/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.json({
        filename: filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 