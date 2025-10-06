// Simple CORS-enabled server for Lithuanian Vocabulary Builder
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 8080;

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON
app.use(express.json());

// Serve static files with CORS headers
app.use(express.static('.', {
  setHeaders: (res, filePath) => {
    // Set CORS headers for all files
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Set proper content types
    if (filePath.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    }
  }
}));

// Explicit route for topics folder
app.get('/topics/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'topics', filename);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'application/json');
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving topic file:', err);
      res.status(404).json({ error: 'Topic file not found' });
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Lithuanian Vocabulary Builder Server',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🎯 Server running on http://localhost:${port}`);
  console.log(`📚 Vocabulary: http://localhost:${port}/index.html`);
  console.log(`🔤 Conjugation: http://localhost:${port}/conjugation.html`);
});