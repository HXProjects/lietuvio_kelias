const fs = require('fs');
const path = require('path');
const { generateTextKey } = require('./get_sound.js');

/**
 * Transliterate Lithuanian characters to ASCII for filenames
 */
function transliterateText(text) {
  return text
    .replace(/ą/g, 'a')
    .replace(/č/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ė/g, 'e')
    .replace(/į/g, 'i')
    .replace(/š/g, 's')
    .replace(/ų/g, 'u')
    .replace(/ū/g, 'u')
    .replace(/ž/g, 'z');
}

/**
 * Rebuild cache index and rename files to use ASCII characters
 */
function rebuildCache() {
  const cacheDir = '../audio_cache';
  const backupFile = path.join(cacheDir, 'cache_index.json.backup');
  const newCacheFile = path.join(cacheDir, 'cache_index.json');
  
  console.log('🔄 Rebuilding audio cache with ASCII filenames...');
  
  // Load backup cache data (with encoding issues)
  let oldCache = {};
  if (fs.existsSync(backupFile)) {
    try {
      const backupData = fs.readFileSync(backupFile, 'utf8');
      oldCache = JSON.parse(backupData);
      console.log(`📂 Loaded ${Object.keys(oldCache).length} entries from backup`);
    } catch (error) {
      console.warn('⚠️  Could not load backup cache:', error.message);
    }
  }
  
  // Get all MP3 files
  const audioFiles = fs.readdirSync(cacheDir).filter(file => file.endsWith('.mp3'));
  console.log(`🎵 Found ${audioFiles.length} audio files`);
  
  const newCache = {};
  const renamedFiles = [];
  
  // Process each audio file
  for (const filename of audioFiles) {
    const oldPath = path.join(cacheDir, filename);
    const baseName = filename.replace('.mp3', '');
    
    // Try to find original text from backup cache
    let originalText = null;
    let cacheEntry = null;
    
    // Search through old cache entries
    for (const [key, entry] of Object.entries(oldCache)) {
      if (entry.filename === filename || key === baseName) {
        originalText = entry.originalText;
        cacheEntry = entry;
        break;
      }
    }
    
    if (!originalText) {
      // Try to reverse-engineer from filename
      originalText = baseName.charAt(0).toUpperCase() + baseName.slice(1);
      console.log(`⚠️  No cache entry found for ${filename}, using: "${originalText}"`);
    }
    
    // Generate new ASCII filename
    const newKey = generateTextKey(originalText);
    const newFilename = `${newKey}.mp3`;
    const newPath = path.join(cacheDir, newFilename);
    
    // Rename file if needed
    if (filename !== newFilename) {
      try {
        fs.renameSync(oldPath, newPath);
        renamedFiles.push({ old: filename, new: newFilename });
        console.log(`📝 Renamed: ${filename} → ${newFilename}`);
      } catch (error) {
        console.error(`❌ Failed to rename ${filename}:`, error.message);
        continue;
      }
    }
    
    // Create new cache entry
    newCache[newKey] = {
      originalText: originalText,
      filename: newFilename,
      generatedAt: cacheEntry?.generatedAt || new Date().toISOString(),
      fileSize: fs.statSync(newPath).size,
      voice: cacheEntry?.voice || 'lt-LT-Standard-A',
      speakingRate: cacheEntry?.speakingRate || 0.85
    };
  }
  
  // Write new cache index
  fs.writeFileSync(newCacheFile, JSON.stringify(newCache, null, 2), 'utf8');
  
  console.log(`\n✅ Cache rebuild complete!`);
  console.log(`📊 ${Object.keys(newCache).length} entries in new cache`);
  console.log(`🔄 ${renamedFiles.length} files renamed`);
  console.log(`💾 New cache saved to: ${newCacheFile}`);
  
  return newCache;
}

// Run the rebuild
if (require.main === module) {
  rebuildCache();
}

module.exports = { rebuildCache, transliterateText };