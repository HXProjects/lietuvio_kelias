// Enhanced Audio Manager with Cloud TTS Support
class EnhancedAudioManager {
    constructor() {
        this.config = new CloudTTSConfig();
        this.providers = new Map();
        this.cache = new Map(); // Audio cache for better performance
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        // Initialize all available providers
        await this.initializeProviders();
        
        // Load cached audio if available
        this.loadCache();
        
        this.isInitialized = true;
        console.log('🎵 Enhanced AudioManager initialized');
    }

    async initializeProviders() {
        // Initialize Google Cloud TTS
        const googleConfig = this.config.providers.google;
        this.providers.set('google', new GoogleTTSProvider(googleConfig));

        // Initialize Azure TTS
        const azureConfig = this.config.providers.azure;
        this.providers.set('azure', new AzureTTSProvider(azureConfig));

        // Initialize Local TTS (always available as fallback)
        const localConfig = this.config.providers.local;
        this.providers.set('local', new LocalTTSProvider(localConfig));

        console.log('📡 TTS Providers initialized:', Array.from(this.providers.keys()));
    }

    // Set API credentials for cloud providers
    setCredentials(provider, credentials) {
        this.config.setCredentials(provider, credentials);
        
        // Reinitialize the specific provider
        if (provider === 'google') {
            this.providers.set('google', new GoogleTTSProvider(this.config.providers.google));
        } else if (provider === 'azure') {
            this.providers.set('azure', new AzureTTSProvider(this.config.providers.azure));
        }
        
        return this;
    }

    // Switch TTS provider
    setProvider(provider) {
        const success = this.config.setProvider(provider);
        if (success) {
            console.log(`🔄 Switched to ${this.config.getCurrentProvider().name}`);
        }
        return success;
    }

    // Main speak method with automatic fallback
    async speak(text, language = 'lithuanian', options = {}) {
        if (!text || !text.trim()) {
            console.warn('⚠️ Empty text provided to speak()');
            return false;
        }

        // Clean text for caching
        const cacheKey = this.getCacheKey(text, language);
        
        // Check cache first if enabled
        if (this.config.enableCaching && this.cache.has(cacheKey)) {
            const cachedAudio = this.cache.get(cacheKey);
            if (this.isCacheValid(cachedAudio)) {
                console.log('🔄 Playing from cache:', text.substring(0, 30) + '...');
                return this.playCachedAudio(cachedAudio.data);
            } else {
                this.cache.delete(cacheKey);
            }
        }

        // Try current provider first
        try {
            const currentProvider = this.getCurrentProvider();
            if (currentProvider && currentProvider.isAvailable()) {
                console.log(`🎤 Speaking with ${this.config.getCurrentProvider().name}:`, text.substring(0, 30) + '...');
                
                await currentProvider.speak(text, language, options);
                
                // Cache the successful request
                if (this.config.enableCaching) {
                    this.cacheAudioRequest(cacheKey, text, language);
                }
                
                return true;
            }
        } catch (error) {
            console.warn(`⚠️ ${this.config.getCurrentProvider().name} failed:`, error.message);
        }

        // Fallback to local TTS
        if (this.config.fallbackToLocal) {
            try {
                const localProvider = this.providers.get('local');
                if (localProvider && localProvider.isAvailable()) {
                    console.log('🔄 Falling back to local TTS');
                    await localProvider.speak(text, language, options);
                    return true;
                }
            } catch (error) {
                console.error('❌ Local TTS also failed:', error.message);
            }
        }

        console.error('❌ All TTS providers failed');
        return false;
    }

    // Generate audio file (for cloud providers)
    async generateAudio(text, language = 'lithuanian', options = {}) {
        const currentProvider = this.getCurrentProvider();
        
        if (!currentProvider || !currentProvider.isAvailable()) {
            throw new Error('No available cloud TTS provider for audio generation');
        }

        try {
            return await currentProvider.generateAudio(text, language, options);
        } catch (error) {
            console.error('Audio generation failed:', error);
            throw error;
        }
    }

    // Get current provider instance
    getCurrentProvider() {
        return this.providers.get(this.config.currentProvider);
    }

    // Provider management
    getAvailableProviders() {
        return this.config.getAvailableProviders().map(provider => ({
            ...provider,
            isActive: provider.id === this.config.currentProvider,
            isAvailable: this.providers.get(provider.id)?.isAvailable() || false
        }));
    }

    // Cache management
    getCacheKey(text, language) {
        return `${language}_${btoa(text).substring(0, 32)}`;
    }

    cacheAudioRequest(key, text, language) {
        this.cache.set(key, {
            text,
            language,
            timestamp: Date.now(),
            data: null // For local TTS, we don't cache audio data
        });

        // Cleanup old cache entries
        this.cleanupCache();
    }

    isCacheValid(cachedItem) {
        const age = Date.now() - cachedItem.timestamp;
        return age < this.config.cacheExpiry;
    }

    async playCachedAudio(audioData) {
        if (!audioData) return true; // For local TTS requests
        
        // Implement cached audio playback for cloud providers
        // This would play previously downloaded audio
        return true;
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.config.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }

    loadCache() {
        try {
            const cached = localStorage.getItem('tts_cache');
            if (cached) {
                const cacheData = JSON.parse(cached);
                this.cache = new Map(cacheData);
                console.log('📁 Loaded TTS cache with', this.cache.size, 'entries');
            }
        } catch (error) {
            console.warn('Failed to load TTS cache:', error);
        }
    }

    saveCache() {
        try {
            const cacheArray = Array.from(this.cache.entries());
            localStorage.setItem('tts_cache', JSON.stringify(cacheArray));
        } catch (error) {
            console.warn('Failed to save TTS cache:', error);
        }
    }

    // Utility methods
    stop() {
        // Stop all providers
        this.providers.forEach(provider => {
            if (provider.stop) {
                provider.stop();
            }
        });
        
        // Stop local TTS specifically
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    // Configuration methods
    enableCaching(enabled = true) {
        this.config.enableCaching = enabled;
        if (!enabled) {
            this.cache.clear();
        }
    }

    setFallbackToLocal(enabled = true) {
        this.config.fallbackToLocal = enabled;
    }

    // Provider status
    getProviderStatus() {
        const status = {};
        this.providers.forEach((provider, key) => {
            status[key] = {
                name: this.config.providers[key].name,
                available: provider.isAvailable(),
                configured: this.config.isProviderConfigured(key),
                active: key === this.config.currentProvider
            };
        });
        return status;
    }

    // Setup wizard for easy configuration
    async setupWizard() {
        console.log('🔧 TTS Setup Wizard');
        console.log('Available providers:', this.getAvailableProviders());
        console.log('Current status:', this.getProviderStatus());
        console.log('');
        console.log('To configure Google Cloud TTS:');
        console.log('audioManager.setCredentials("google", { apiKey: "YOUR_API_KEY" })');
        console.log('');
        console.log('To configure Azure TTS:');
        console.log('audioManager.setCredentials("azure", { apiKey: "YOUR_API_KEY", region: "YOUR_REGION" })');
        console.log('');
        console.log('To switch providers:');
        console.log('audioManager.setProvider("google") // or "azure", "local"');
    }
}

// Export the enhanced audio manager
window.EnhancedAudioManager = EnhancedAudioManager;