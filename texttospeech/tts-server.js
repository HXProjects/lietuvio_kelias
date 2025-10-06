// TTS Server for Lithuanian Vocabulary Builder
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import our TTS functions
const { quickStart, generateVocabularyAudio, getCacheStats, generateTextKey } = require('./get_sound.js');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('../audio_cache')); // Serve audio files directly

// Also serve parent directory files with CORS (for topics access)
app.use('/topics', express.static('../topics', {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Content-Type', 'application/json');
  }
}));

// Serve main app files if needed
app.use('/app', express.static('..', {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (path.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    } else if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (path.endsWith('.html')) {
      res.set('Content-Type', 'text/html');
    }
  }
}));

/**
 * GET /tts/generate
 * Generate TTS audio for given text
 * Query params: text (required), force (optional)
 */
app.get('/tts/generate', async (req, res) => {
  try {
    const { text, force } = req.query;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }
    
    const textKey = generateTextKey(text);
    const filename = `${textKey}.mp3`;
    const filepath = path.join('../audio_cache', filename);
    
    console.log(`🎯 TTS Request: "${text}" -> key: "${textKey}", force: ${force === 'true'}`);
    
    // PRIORITY: Check cache first (unless force regeneration is requested)
    if (force !== 'true' && fs.existsSync(filepath)) {
      console.log(`🎵 Serving from cache: ${filename}`);
      return res.json({
        success: true,
        text: text,
        key: textKey,
        filename: filename,
        audioUrl: `http://localhost:${port}/${filename}`,
        cached: true
      });
    }
    
    const options = {
      cacheDir: '../audio_cache',
      forceRegenerate: force === 'true'
    };
    
    console.log(`🔊 Generating new audio for: "${text}"`);
    const audioPath = await quickStart(text, options);
    
    res.json({
      success: true,
      text: text,
      key: textKey,
      filename: filename,
      audioUrl: `http://localhost:${port}/${filename}`,
      cached: force !== 'true' && fs.existsSync(audioPath)
    });
    
  } catch (error) {
    console.error('TTS Generation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /tts/batch
 * Generate TTS audio for multiple texts
 * Body: { texts: ["text1", "text2", ...], options: {...} }
 */
app.post('/tts/batch', async (req, res) => {
  try {
    const { texts, options = {} } = req.body;
    
    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'Texts array is required' });
    }
    
    const result = await generateVocabularyAudio(texts, {
      cacheDir: '../audio_cache',
      ...options
    });
    
    // Generate response with URLs for each text
    const audioFiles = texts.map(text => {
      const textKey = generateTextKey(text);
      const filename = `${textKey}.mp3`;
      return {
        text: text,
        key: textKey,
        filename: filename,
        audioUrl: `http://localhost:${port}/${filename}`
      };
    });
    
    res.json({
      success: true,
      result: result,
      audioFiles: audioFiles
    });
    
  } catch (error) {
    console.error('Batch TTS Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /tts/cache/stats
 * Get cache statistics
 */
app.get('/tts/cache/stats', (req, res) => {
  try {
    const stats = getCacheStats('../audio_cache');
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /tts/cache/check/:key
 * Check if audio exists for given text key
 */
app.get('/tts/cache/check/:key', (req, res) => {
  try {
    const { key } = req.params;
    const filename = `${key}.mp3`;
    const filepath = path.join('../audio_cache', filename);
    
    const exists = fs.existsSync(filepath);
    
    res.json({
      success: true,
      key: key,
      filename: filename,
      exists: exists,
      audioUrl: exists ? `http://localhost:${port}/${filename}` : null
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Lithuanian TTS Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`🎯 Lithuanian TTS Server running on http://localhost:${port}`);
  console.log(`📁 Serving audio files from: ../audio_cache`);
  console.log(`🔗 API Endpoints:`);
  console.log(`   GET  /tts/generate?text=labas`);
  console.log(`   POST /tts/batch`);
  console.log(`   GET  /tts/cache/stats`);
  console.log(`   GET  /tts/cache/check/:key`);
  console.log(`   GET  /health`);
});

module.exports = app;