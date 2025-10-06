/**
 * Core Audio Manager - Shared TTS functionality
 * Handles cache-first audio playback and error management
 */
class AudioManager {
    constructor() {
        this.ttsClient = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the audio manager with TTS client
     */
    async init() {
        try {
            // Import TTS client (assumes it's globally available)
            if (window.LithuanianTTSClient) {
                this.ttsClient = new window.LithuanianTTSClient('http://localhost:3001');
                this.isInitialized = true;
                console.log('✅ AudioManager initialized with Lithuanian TTS client');
            } else {
                throw new Error('LithuanianTTSClient not available');
            }
        } catch (error) {
            console.warn('⚠️ AudioManager initialization failed:', error);
            this.isInitialized = false;
        }
    }

    /**
     * Speak text with cache-first approach
     * @param {string} text - Text to speak
     * @param {string} language - Language ('lithuanian' or 'english')
     * @param {object} options - Additional options
     * @returns {Promise<boolean>} Success status
     */
    async speak(text, language = 'lithuanian', options = {}) {
        if (!text || !text.trim()) {
            console.warn('Empty text provided to AudioManager.speak()');
            return false;
        }

        // Handle Lithuanian text with TTS client
        if (language === 'lithuanian' && this.isInitialized && this.ttsClient) {
            try {
                await this.ttsClient.speak(text, options.forceRegenerate || false);
                console.log('✅ AudioManager: TTS successful for:', text);
                return true;
            } catch (error) {
                console.warn('❌ AudioManager: TTS failed:', error);
                // Let the calling code handle the error display
                throw error;
            }
        }

        // Handle English text with browser TTS
        if (language === 'english') {
            return this.speakWithBrowserTTS(text, language);
        }

        // No TTS client available
        if (!this.isInitialized) {
            throw new Error('Audio is not available right now. Please try again later.');
        }

        return false;
    }

    /**
     * Fallback browser TTS for English
     * @param {string} text - Text to speak
     * @param {string} language - Language code
     * @returns {boolean} Success status
     */
    speakWithBrowserTTS(text, language) {
        if (!('speechSynthesis' in window)) {
            console.warn('Browser TTS not supported');
            return false;
        }

        try {
            // Stop any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'lithuanian' ? 'lt-LT' : 'en-US';
            utterance.rate = 0.7;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            utterance.onstart = () => {
                console.log('🔊 Speaking with browser TTS:', text);
            };

            utterance.onerror = (event) => {
                console.error('Browser TTS error:', event.error);
            };

            window.speechSynthesis.speak(utterance);
            return true;
        } catch (error) {
            console.error('Browser TTS failed:', error);
            return false;
        }
    }

    /**
     * Stop all audio playback
     */
    stop() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    /**
     * Check if TTS is available
     * @returns {boolean} Availability status
     */
    isAvailable() {
        return this.isInitialized && this.ttsClient !== null;
    }
}

// Export for ES6 modules or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
} else {
    window.AudioManager = AudioManager;
}