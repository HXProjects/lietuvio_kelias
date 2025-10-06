/**
 * Lithuanian TTS Client Integration
 * Integrates Node.js TTS server with the web vocabulary application
 */

class LithuanianTTSClient {
    constructor(serverUrl = 'http://localhost:3001', fallbackUrl = 'http://localhost:8080') {
        this.serverUrl = serverUrl;
        this.fallbackUrl = fallbackUrl;
        this.cache = new Map(); // Client-side cache for audio URLs
        this.usesFallback = false; // Track if we're using fallback server
    }

    /**
     * Check if audio file exists in cache (try both servers)
     * @param {string} text - Text to check
     * @returns {Promise<string|null>} Audio URL if cached, null otherwise
     */
    async checkCacheDirectly(text) {
        const textKey = this.generateTextKey(text);
        const filename = `${textKey}.mp3`;
        
        console.log(`🔍 CACHE CHECK START for text: "${text}"`);
        console.log(`📝 Generated text key: "${textKey}"`);
        console.log(`📁 Looking for filename: ${filename}`);
        
        // Try TTS server first (port 3001) - we know this works
        const ttsUrl = `${this.serverUrl}/${filename}`;
        console.log(`🌐 Testing TTS server cache: ${ttsUrl}`);
        
        try {
            console.log(`📡 Making HEAD request to TTS server...`);
            const response = await fetch(ttsUrl, { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            console.log(`📊 TTS Server Response: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                console.log(`✅ CACHE HIT: Found cached audio at TTS server: ${ttsUrl}`);
                return ttsUrl;
            } else {
                console.log(`❌ TTS Server miss: HTTP ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ TTS Server error: ${error.message}`);
        }
        
        // Fallback: Try main server /audio_cache/ route
        const cacheUrl = `${this.fallbackUrl}/audio_cache/${filename}`;
        console.log(`🌐 Testing main server cache: ${cacheUrl}`);
        
        try {
            console.log(`📡 Making HEAD request to main server...`);
            const response = await fetch(cacheUrl, { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            
            console.log(`📊 Main Server Response: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                console.log(`✅ CACHE HIT: Found cached audio at main server: ${cacheUrl}`);
                return cacheUrl;
            } else {
                console.log(`❌ Main Server miss: HTTP ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Main Server error: ${error.message}`);
        }
        
        console.log(`❌ CACHE MISS: File not found on any server`);
        return null;
    }

    /**
     * Generate and play TTS audio for given text
     * Cache-first approach: Check cache → TTS server → Fallback server → Error
     * @param {string} text - Text to convert to speech
     * @param {boolean} forceRegenerate - Force regeneration even if cached
     * @returns {Promise<void>}
     */
    async speak(text, forceRegenerate = false) {
        console.log(`🎤 TTS SPEAK: "${text}" (force: ${forceRegenerate})`);
        
        try {
            // STEP 1: Check cache directly first (unless forcing regeneration)
            if (!forceRegenerate) {
                console.log(`🔍 STEP 1: Checking cache...`);
                const cachedUrl = await this.checkCacheDirectly(text);
                if (cachedUrl) {
                    console.log(`🎵 PLAYING FROM CACHE: ${cachedUrl}`);
                    await this.playAudio(cachedUrl);
                    console.log(`✅ CACHE AUDIO SUCCESS`);
                    return;
                } else {
                    console.log(`❌ CACHE MISS - proceeding to servers`);
                }
            }
            
            // STEP 2: Try servers
            console.log(`🔍 STEP 2: Trying TTS servers...`);
            const audioUrl = await this.getAudioUrl(text, forceRegenerate);
            console.log(`🎵 PLAYING FROM SERVER: ${audioUrl}`);
            await this.playAudio(audioUrl);
            console.log(`✅ SERVER AUDIO SUCCESS`);
            
        } catch (error) {
            console.error('❌ TTS FAILED - ALL METHODS EXHAUSTED:', error.message);
            throw new Error('Audio is not available right now. Please try again later.');
        }
    }

    /**
     * Get audio URL for given text (with caching)
     * @param {string} text - Text to convert
     * @param {boolean} forceRegenerate - Force regeneration
     * @returns {Promise<string>} Audio URL
     */
    async getAudioUrl(text, forceRegenerate = false) {
        const cacheKey = this.generateTextKey(text);
        
        console.log(`🔍 TTS Client: Requesting audio for "${text}" (key: ${cacheKey})`);
        
        // Check client-side cache first (unless forcing regeneration)
        if (!forceRegenerate && this.cache.has(cacheKey)) {
            console.log(`🎵 Using client-side cached URL for: ${cacheKey}`);
            return this.cache.get(cacheKey);
        }

        // Try TTS server first, then fallback to main server
        const servers = [
            { url: this.serverUrl, name: 'TTS Server' },
            { url: this.fallbackUrl, name: 'Fallback Server' }
        ];

        for (const server of servers) {
            try {
                const params = new URLSearchParams({
                    text: text,
                    force: forceRegenerate.toString()
                });

                console.log(`🌐 Trying ${server.name}: ${server.url}/tts/generate?${params}`);
                const response = await fetch(`${server.url}/tts/generate?${params}`);
                
                if (!response.ok) {
                    console.warn(`⚠️ ${server.name} returned ${response.status}`);
                    continue; // Try next server
                }

                const result = await response.json();
                
                if (!result.success) {
                    console.warn(`⚠️ ${server.name} error: ${result.error}`);
                    continue; // Try next server
                }

                console.log(`✅ ${server.name} response: ${result.cached ? 'cached' : 'generated'} -> ${result.audioUrl}`);
                
                // Cache the audio URL
                this.cache.set(cacheKey, result.audioUrl);
                this.usesFallback = (server.url === this.fallbackUrl);
                
                return result.audioUrl;

            } catch (error) {
                console.warn(`❌ ${server.name} failed:`, error.message);
                continue; // Try next server
            }
        }

        // If all servers failed
        throw new Error('All TTS servers unavailable and no cached audio found');

        // Cache the audio URL
        this.cache.set(cacheKey, result.audioUrl);
        
        return result.audioUrl;
    }

    /**
     * Generate multiple audio files for vocabulary batch
     * @param {Array<string>} texts - Array of texts to convert
     * @returns {Promise<Array>} Array of audio file info
     */
    async generateBatch(texts) {
        try {
            const response = await fetch(`${this.serverUrl}/tts/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ texts })
            });

            if (!response.ok) {
                throw new Error(`Batch TTS Error: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Batch TTS generation failed');
            }

            // Cache all audio URLs
            result.audioFiles.forEach(file => {
                this.cache.set(file.key, file.audioUrl);
            });

            return result.audioFiles;
            
        } catch (error) {
            console.error('Batch TTS Error:', error);
            throw error;
        }
    }

    /**
     * Check if audio exists for given text
     * @param {string} text - Text to check
     * @returns {Promise<boolean>} True if audio exists
     */
    async checkExists(text) {
        try {
            const textKey = this.generateTextKey(text);
            const response = await fetch(`${this.serverUrl}/tts/cache/check/${textKey}`);
            
            if (!response.ok) {
                return false;
            }

            const result = await response.json();
            return result.success && result.exists;
            
        } catch (error) {
            console.warn('Cache check failed:', error);
            return false;
        }
    }

    /**
     * Get server cache statistics
     * @returns {Promise<object>} Cache stats
     */
    async getCacheStats() {
        try {
            const response = await fetch(`${this.serverUrl}/tts/cache/stats`);
            
            if (!response.ok) {
                throw new Error(`Stats Error: ${response.status}`);
            }

            const result = await response.json();
            return result.success ? result.stats : null;
            
        } catch (error) {
            console.error('Cache stats error:', error);
            return null;
        }
    }

    /**
     * Play audio from URL
     * @param {string} audioUrl - URL of audio file
     * @returns {Promise<void>}
     */
    async playAudio(audioUrl) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);
            
            audio.onended = () => resolve();
            audio.onerror = (error) => reject(new Error('Audio playback failed'));
            audio.oncanplaythrough = () => audio.play();
            
            audio.load();
        });
    }

    /**
     * Fallback to browser TTS
     * @param {string} text - Text to speak
     */
    fallbackSpeak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'lt-LT';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        } else {
            console.warn('No TTS available (server or browser)');
        }
    }

    /**
     * Generate text key (same algorithm as server)
     * @param {string} text - Input text
     * @returns {string} Text key
     */
    generateTextKey(text) {
        console.log("entering generateTextKey with text:", text);
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
            .substring(0, 50);
    }

    /**
     * Check if TTS server is available (tries main server, then fallback)
     * @returns {Promise<boolean>} True if any server is running
     */
    async isServerAvailable() {
        // Try TTS server first
        try {
            const response = await fetch(`${this.serverUrl}/tts/health`, {
                method: 'GET',
                timeout: 3000
            });
            
            if (response.ok) {
                console.log('✅ TTS Server (3001) is available');
                this.usesFallback = false;
                return true;
            }
        } catch (error) {
            console.warn('⚠️ TTS Server (3001) not available:', error.message);
        }

        // Try fallback server
        try {
            const response = await fetch(`${this.fallbackUrl}/tts/health`, {
                method: 'GET',
                timeout: 3000
            });
            
            if (response.ok) {
                console.log('✅ Fallback TTS Server (8080) is available');
                this.usesFallback = true;
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Fallback TTS Server (8080) not available:', error.message);
        }

        console.error('❌ No TTS servers available');
        return false;
    }
}

// Export for use in vocabulary apps
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LithuanianTTSClient;
} else {
    window.LithuanianTTSClient = LithuanianTTSClient;
}