// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

// Import other required libraries
const fs = require('fs');
const util = require('util');
const path = require('path');

// Creates a client with JSON key authentication
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: './cloud-key.json'
});

/**
 * Generate a unique key from text by removing spaces, punctuation, and converting to lowercase
 * @param {string} text - The input text
 * @returns {string} Clean key for filename using ASCII characters
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

/**
 * Load the audio cache index (tracks generated files)
 * @param {string} cacheDir - Directory containing audio files
 * @returns {object} Cache index object
 */
function loadAudioCache(cacheDir = '../audio_cache') {
  const cacheFile = path.join(cacheDir, 'cache_index.json');
  
  if (fs.existsSync(cacheFile)) {
    try {
      const cacheData = fs.readFileSync(cacheFile, 'utf8');
      return JSON.parse(cacheData);
    } catch (error) {
      console.warn('⚠️ Could not load cache index, starting fresh');
    }
  }
  
  return {};
}

/**
 * Save the audio cache index
 * @param {object} cache - Cache index object
 * @param {string} cacheDir - Directory containing audio files
 */
function saveAudioCache(cache, cacheDir = '../audio_cache') {
  const cacheFile = path.join(cacheDir, 'cache_index.json');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('❌ Could not save cache index:', error.message);
  }
}

/**
 * Generate Lithuanian text-to-speech audio with smart caching
 * @param {string} inputText - The text to synthesize
 * @param {object} options - Optional configuration
 * @returns {Promise<string>} Path to the generated audio file
 */
async function quickStart(inputText, options = {}) {
  // The text to synthesize
  const text = inputText || 'Labas rytas! Kaip sekasi?';
  
  // Configuration
  const cacheDir = options.cacheDir || '../audio_cache';
  const forceRegenerate = options.forceRegenerate || false;
  
  // Generate unique key for this text
  const textKey = generateTextKey(text);
  const filename = `${textKey}.mp3`;
  const filepath = path.join(cacheDir, filename);
  
  // Load cache index
  const cache = loadAudioCache(cacheDir);
  console.log(`🔍 Cache check for key "${textKey}": cache entry exists = ${!!cache[textKey]}, file exists = ${fs.existsSync(filepath)}`);
  
  // Check if we already have this audio file (PRIORITY: Always check cache first)
  if (!forceRegenerate && cache[textKey] && fs.existsSync(filepath)) {
    console.log(`🎵 Using cached audio: ${filename} (for: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}")`);
    console.log(`📁 Cache entry:`, cache[textKey]);
    return filepath;
  }
  
  if (!forceRegenerate && cache[textKey] && !fs.existsSync(filepath)) {
    console.warn(`⚠️  Cache entry exists but file missing: ${filepath}`);
  }
  
  if (!forceRegenerate && !cache[textKey] && fs.existsSync(filepath)) {
    console.warn(`⚠️  File exists but no cache entry for: ${textKey}`);
  }

  // Default Lithuanian voice configuration (optimized for learning)
  const defaultVoice = {
    languageCode: 'lt-LT', 
    name: 'lt-LT-Standard-A',  // Best Lithuanian female voice
    ssmlGender: 'FEMALE'
  };

  // Default audio configuration (optimized for language learning)
  const defaultAudioConfig = {
    audioEncoding: 'MP3',
    speakingRate: 0.85,        // Slightly slower for learning
    pitch: 0.0,                // Natural pitch
    volumeGainDb: 2.0,         // Slightly louder for clarity
    effectsProfileId: ['headphone-class-device']  // Optimized for headphones
  };

  // Merge with user options
  const voice = { ...defaultVoice, ...options.voice };
  const audioConfig = { ...defaultAudioConfig, ...options.audioConfig };

  // Construct the request
  const request = {
    input: { text: text },
    voice: voice,
    audioConfig: audioConfig,
  };

  try {
    console.log(`🔊 Generating new TTS: ${filename} (for: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}")`);
    
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);
    
    // Write the binary audio content to cache file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(filepath, response.audioContent, 'binary');
    
    // Update cache index
    cache[textKey] = {
      originalText: text,
      filename: filename,
      generatedAt: new Date().toISOString(),
      fileSize: response.audioContent.length,
      voice: voice.name,
      speakingRate: audioConfig.speakingRate
    };
    
    // Save updated cache
    saveAudioCache(cache, cacheDir);
    
    console.log(`✅ Generated and cached: ${filename}`);
    return filepath;
    
  } catch (error) {
    console.error('❌ Error generating TTS:', error.message);
    throw error;
  }
}

/**
 * Generate multiple audio files for vocabulary words with smart caching
 * @param {Array<string>} words - Array of words/phrases to synthesize
 * @param {object} options - Configuration options
 */
async function generateVocabularyAudio(words, options = {}) {
  const cacheDir = options.cacheDir || '../audio_cache';
  const batchDelay = options.batchDelay || 100; // ms between requests
  
  console.log(`🎯 Processing ${words.length} vocabulary items...`);
  
  const cache = loadAudioCache(cacheDir);
  const newItems = [];
  const cachedItems = [];
  
  // Check which items need generation
  for (const text of words) {
    const textKey = generateTextKey(text);
    const filepath = path.join(cacheDir, `${textKey}.mp3`);
    
    if (cache[textKey] && fs.existsSync(filepath)) {
      cachedItems.push(text);
    } else {
      newItems.push(text);
    }
  }
  
  console.log(`📊 Cache status: ${cachedItems.length} cached, ${newItems.length} new items to generate`);
  
  if (cachedItems.length > 0) {
    console.log(`🎵 Using cached audio for: ${cachedItems.slice(0, 5).join(', ')}${cachedItems.length > 5 ? '...' : ''}`);
  }
  
  // Generate new items
  for (let i = 0; i < newItems.length; i++) {
    const text = newItems[i];
    
    try {
      await quickStart(text, { cacheDir });
      console.log(`✅ [${i + 1}/${newItems.length}] Generated: ${generateTextKey(text)}.mp3`);
      
      // Small delay to avoid hitting API rate limits
      if (i < newItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
      
    } catch (error) {
      console.error(`❌ [${i + 1}/${newItems.length}] Failed "${text}":`, error.message);
    }
  }
  
  console.log('🎉 Vocabulary audio processing complete!');
  return {
    total: words.length,
    cached: cachedItems.length,
    generated: newItems.length,
    cacheDir: cacheDir
  };
}

/**
 * Get cache statistics
 * @param {string} cacheDir - Cache directory path
 */
function getCacheStats(cacheDir = '../audio_cache') {
  const cache = loadAudioCache(cacheDir);
  const cacheKeys = Object.keys(cache);
  
  if (cacheKeys.length === 0) {
    console.log('📊 Cache is empty');
    return { totalFiles: 0, totalSize: 0 };
  }
  
  let totalSize = 0;
  let validFiles = 0;
  
  cacheKeys.forEach(key => {
    const item = cache[key];
    const filepath = path.join(cacheDir, item.filename);
    
    if (fs.existsSync(filepath)) {
      validFiles++;
      totalSize += item.fileSize || 0;
    }
  });
  
  console.log(`📊 Cache Statistics:`);
  console.log(`   📁 Total cached items: ${validFiles}`);
  console.log(`   💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   📍 Cache directory: ${cacheDir}`);
  
  return {
    totalFiles: validFiles,
    totalItems: cacheKeys.length,
    totalSize: totalSize,
    cacheDir: cacheDir
  };
}

/**
 * Clear cache (remove all files and index)
 * @param {string} cacheDir - Cache directory path
 */
function clearCache(cacheDir = '../audio_cache') {
  try {
    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir);
      
      files.forEach(file => {
        fs.unlinkSync(path.join(cacheDir, file));
      });
      
      console.log(`🗑️ Cleared cache: ${files.length} files removed from ${cacheDir}`);
    } else {
      console.log('🗑️ Cache directory does not exist');
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
  }
}

// Example usage and testing
async function runTests() {
  try {
    console.log('🚀 Testing Lithuanian TTS with caching...\n');
    
    // Test 1: Generate single audio file
    console.log('Test 1: Single text generation');
    await quickStart('Labas rytas! Kaip sekasi?');
    
    // Test 2: Generate the same text again (should use cache)
    console.log('\nTest 2: Same text again (should use cache)');
    await quickStart('Labas rytas! Kaip sekasi?');
    
    // Test 3: Generate vocabulary batch
    console.log('\nTest 3: Vocabulary batch generation');
    const vocabularyWords = [
      'Labas rytas',
      'Ačiū',
      'Prašom', 
      'Atsiprašau',
      'Kiek tai kainuoja?',
      'Aš nekalbu lietuviškai',
      'Ar galite man padėti?'
    ];
    
    const result = await generateVocabularyAudio(vocabularyWords);
    console.log('\n📊 Batch result:', result);
    
    // Test 4: Show cache statistics
    console.log('\nTest 4: Cache statistics');
    getCacheStats();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

// Export functions for use in other modules
module.exports = {
  quickStart,
  generateVocabularyAudio,
  getCacheStats,
  clearCache,
  generateTextKey,
  loadAudioCache
};