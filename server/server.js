// Main Server for Lithuanian Vocabulary Builder
// Serves static files and provides APIs for both vocabulary and TTS
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

/**
 * Generate text key for filename (same logic as TTS server)
 */
function generateTextKey(text) {
  return text
    .toLowerCase()
    // Transliterate Lithuanian characters to ASCII equivalents
    .replace(/ą/g, 'a')
    .replace(/č/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ė/g, 'e')
    .replace(/į/g, 'i')
    .replace(/š/g, 's')
    .replace(/ų/g, 'u')
    .replace(/ū/g, 'u')
    .replace(/ž/g, 'z')
    // Remove all remaining non-ASCII letters, spaces, and punctuation
    .replace(/[^a-z]/g, '')
    .substring(0, 50); // Limit length for filesystem compatibility
}

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API endpoint for verbs config (must be before static routes)
app.get('/verbs/config.json', (req, res) => {
  console.log(`📝 REQUEST RECEIVED: /verbs/config.json`);
  try {
    const verbsConfigPath = path.join(__dirname, '../verbs/config.json');
    console.log(`📝 __dirname: ${__dirname}`);
    console.log(`📝 Full path: ${verbsConfigPath}`);
    console.log(`📝 File exists: ${require('fs').existsSync(verbsConfigPath)}`);
    
    // Also check current working directory
    console.log(`📝 Process cwd: ${process.cwd()}`);
    const altPath = path.join(process.cwd(), 'verbs/config.json');
    console.log(`📝 Alternative path: ${altPath}`);
    console.log(`📝 Alt path exists: ${require('fs').existsSync(altPath)}`);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // Try to read the file
    const fs = require('fs');
    const finalPath = fs.existsSync(verbsConfigPath) ? verbsConfigPath : altPath;
    console.log(`📝 Using path: ${finalPath}`);
    
    if (!fs.existsSync(finalPath)) {
      return res.status(404).json({ error: 'Verbs config file not found', path: finalPath });
    }
    
    const content = fs.readFileSync(finalPath, 'utf8');
    console.log(`📝 File content length: ${content.length}`);
    res.send(content);
  } catch (error) {
    console.error('❌ Error serving verbs config:', error);
    res.status(500).json({ error: 'Failed to load verbs config', details: error.message });
  }
});

// API endpoints for individual verb files
app.get('/verbs/:filename', (req, res) => {
  const filename = req.params.filename;
  console.log(`📝 REQUEST RECEIVED: /verbs/${filename}`);
  try {
    const verbFilePath = path.join(__dirname, '../verbs', filename);
    console.log(`📝 Full path: ${verbFilePath}`);
    
    if (!require('fs').existsSync(verbFilePath)) {
      return res.status(404).json({ error: 'Verb file not found' });
    }
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    const fs = require('fs');
    const content = fs.readFileSync(verbFilePath, 'utf8');
    res.send(content);
  } catch (error) {
    console.error('❌ Error serving verb file:', error);
    res.status(500).json({ error: 'Failed to load verb file', details: error.message });
  }
});

// Serve static files (HTML, CSS, JS) from public directory
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => {
    // Set CORS headers for all static files
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Set proper content types
    if (filePath.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    } else if (filePath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    } else if (filePath.endsWith('.html')) {
      res.set('Content-Type', 'text/html');
    }
  }
}));

// Serve src files
app.use('/src', express.static(path.join(__dirname, '../src')));

// Serve scripts files
app.use('/scripts', express.static(path.join(__dirname, '../scripts')));

// Serve topics with explicit CORS headers
app.use('/topics', express.static(path.join(__dirname, '../topics'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Content-Type', 'application/json');
  }
}));

// Serve audio files from TTS cache
const audioPath = path.join(__dirname, '../audio_cache');
console.log(`🔊 Setting up audio static route: /audio_cache -> ${audioPath}`);

app.use('/audio_cache', express.static(audioPath, {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'audio/mpeg');
    console.log(`📁 Serving audio file: ${path}`);
  }
}));

// Debug endpoint to list available audio files
app.get('/api/audio/list', (req, res) => {
  try {
    const audioDir = path.join(__dirname, 'audio_cache');
    const files = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));
    console.log(`📁 Audio cache contains ${files.length} files`);
    res.json({
      success: true,
      audioDir: audioDir,
      fileCount: files.length,
      files: files.slice(0, 10), // Return first 10 files as sample
      sampleUrls: files.slice(0, 5).map(file => `http://localhost:${port}/audio/${file}`)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API Routes for vocabulary data
app.get('/api/topics', async (req, res) => {
  try {
    const configPath = path.join(__dirname, 'topics', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    const topicsWithCounts = await Promise.all(
      config.topics.map(async (topic) => {
        try {
          const topicPath = path.join(__dirname, 'topics', `${topic.id}.json`);
          const topicData = JSON.parse(fs.readFileSync(topicPath, 'utf8'));
          return {
            ...topic,
            phraseCount: topicData.phrases ? topicData.phrases.length : 0
          };
        } catch (error) {
          console.warn(`Failed to load topic ${topic.id}:`, error.message);
          return {
            ...topic,
            phraseCount: 0
          };
        }
      })
    );
    
    res.json({
      success: true,
      topics: topicsWithCounts
    });
  } catch (error) {
    console.error('Error loading topics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load topics configuration'
    });
  }
});

// API route for individual topic data
app.get('/api/topics/:topicId', (req, res) => {
  try {
    const { topicId } = req.params;
    const topicPath = path.join(__dirname, 'topics', `${topicId}.json`);
    
    if (!fs.existsSync(topicPath)) {
      return res.status(404).json({
        success: false,
        error: `Topic '${topicId}' not found`
      });
    }
    
    const topicData = JSON.parse(fs.readFileSync(topicPath, 'utf8'));
    res.json({
      success: true,
      topic: topicData
    });
  } catch (error) {
    console.error(`Error loading topic ${req.params.topicId}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to load topic '${req.params.topicId}'`
    });
  }
});

// Fallback TTS API - serves cached audio when TTS server is unavailable
app.get('/tts/generate', (req, res) => {
  try {
    const { text } = req.query;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text parameter is required' 
      });
    }
    
    const textKey = generateTextKey(text);
    const filename = `${textKey}.mp3`;
    const filepath = path.join(__dirname, 'audio_cache', filename);
    
    console.log(`🔄 Fallback TTS: Checking cache for "${text}" -> ${filename}`);
    
    // Check if cached audio file exists
    if (fs.existsSync(filepath)) {
      console.log(`🎵 Serving cached audio via fallback: ${filename}`);
      return res.json({
        success: true,
        text: text,
        key: textKey,
        filename: filename,
        audioUrl: `http://localhost:${port}/audio/${filename}`,
        cached: true,
        source: 'fallback'
      });
    } else {
      console.log(`❌ No cached audio found for: ${filename}`);
      return res.status(404).json({
        success: false,
        error: 'Audio not available in cache and TTS server is not running',
        suggestion: 'Please start the TTS server to generate new audio'
      });
    }
    
  } catch (error) {
    console.error('Fallback TTS Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fallback TTS service error'
    });
  }
});

// Health check endpoint
app.get('/tts/health', (req, res) => {
  res.json({
    success: true,
    service: 'Fallback TTS (Cache Only)',
    status: 'running',
    timestamp: new Date().toISOString(),
    note: 'This endpoint only serves cached audio files'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Lithuanian Vocabulary Builder Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      vocabulary: 'http://localhost:8080/',
      conjugation: 'http://localhost:8080/conjugation.html',
      api: {
        topics: '/api/topics',
        topicData: '/api/topics/:topicId'
      },
      tts: '/tts/*'
    }
  });
});

// Default route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle 404s - serve 404 for unknown routes
app.use((req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/tts/') && req.path.endsWith('.html')) {
    res.status(404).send('File not found');
  } else if (req.path.startsWith('/api/') || req.path.startsWith('/tts/')) {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found'
    });
  } else {
    res.status(404).send('File not found');
  }
});

// Start server
app.listen(port, () => {
  console.log(`🎯 Lithuanian Vocabulary Builder Server running on http://localhost:${port}`);
  console.log(`📚 Vocabulary Builder: http://localhost:${port}/`);
  console.log(`🔤 Conjugation Trainer: http://localhost:${port}/conjugation.html`);
  console.log(`📁 Serving topics from: ./topics/`);
  console.log(`🔊 TTS Audio from: ./audio_cache/`);
  console.log(`🔗 API Endpoints:`);
  console.log(`   GET /api/topics - List all topics`);
  console.log(`   GET /api/topics/:id - Get topic data`);
  console.log(`   GET /health - Health check`);
  console.log(`   TTS API proxied to localhost:3001`);
});

module.exports = app;