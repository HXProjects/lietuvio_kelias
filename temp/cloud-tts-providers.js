// Cloud Text-to-Speech Configuration and Provider Management
class CloudTTSConfig {
    constructor() {
        this.currentProvider = 'google'; // Default provider
        this.fallbackToLocal = true;
        this.enableCaching = true;
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
        
        // Provider configurations
        this.providers = {
            google: {
                name: 'Google Cloud Text-to-Speech',
                apiKey: '', // Set via setApiKey()
                endpoint: 'https://texttospeech.googleapis.com/v1/text:synthesize',
                voices: {
                    lithuanian: {
                        languageCode: 'lt-LT',
                        name: 'lt-LT-Standard-A',  // Best Lithuanian female voice
                        ssmlGender: 'FEMALE'
                    },
                    english: {
                        languageCode: 'en-US',
                        name: 'en-US-Standard-J',  // Clear male voice for contrast
                        ssmlGender: 'MALE'
                    }
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: 0.85,  // Optimized for language learning
                    pitch: 0,
                    volumeGainDb: 2.0,   // Clearer audio
                    volumeGainDb: 0
                }
            },
            azure: {
                name: 'Azure Cognitive Services',
                apiKey: '',
                region: 'eastus',
                endpoint: 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1',
                voices: {
                    lithuanian: 'lt-LT-LeonasNeural',
                    english: 'en-US-AriaNeural'
                }
            },
            aws: {
                name: 'Amazon Polly',
                accessKeyId: '',
                secretAccessKey: '',
                region: 'us-east-1',
                voices: {
                    lithuanian: 'Joanna', // AWS doesn't have Lithuanian, fallback to English
                    english: 'Joanna'
                }
            },
            local: {
                name: 'Browser Speech Synthesis',
                enabled: true
            }
        };
    }

    // Set API credentials for a provider
    setCredentials(provider, credentials) {
        if (this.providers[provider]) {
            Object.assign(this.providers[provider], credentials);
            console.log(`✅ Credentials set for ${this.providers[provider].name}`);
        }
    }

    // Switch to a different provider
    setProvider(provider) {
        if (this.providers[provider]) {
            this.currentProvider = provider;
            console.log(`🔄 Switched to ${this.providers[provider].name}`);
            return true;
        }
        console.error(`❌ Provider '${provider}' not found`);
        return false;
    }

    // Get current provider config
    getCurrentProvider() {
        return this.providers[this.currentProvider];
    }

    // Get available providers
    getAvailableProviders() {
        return Object.keys(this.providers).map(key => ({
            id: key,
            name: this.providers[key].name,
            configured: this.isProviderConfigured(key)
        }));
    }

    // Check if provider is properly configured
    isProviderConfigured(provider) {
        const config = this.providers[provider];
        if (!config) return false;
        
        switch (provider) {
            case 'google':
                return !!config.apiKey;
            case 'azure':
                return !!config.apiKey && !!config.region;
            case 'aws':
                return !!config.accessKeyId && !!config.secretAccessKey;
            case 'local':
                return 'speechSynthesis' in window;
            default:
                return false;
        }
    }
}

// Abstract base class for TTS providers
class TTSProvider {
    constructor(config) {
        this.config = config;
    }

    async speak(text, language = 'lithuanian', options = {}) {
        throw new Error('speak() method must be implemented by provider');
    }

    async generateAudio(text, language = 'lithuanian', options = {}) {
        throw new Error('generateAudio() method must be implemented by provider');
    }

    isAvailable() {
        throw new Error('isAvailable() method must be implemented by provider');
    }
}

// Google Cloud Text-to-Speech Provider
class GoogleTTSProvider extends TTSProvider {
    async speak(text, language = 'lithuanian', options = {}) {
        try {
            const audioData = await this.generateAudio(text, language, options);
            return this.playAudio(audioData);
        } catch (error) {
            console.error('Google TTS error:', error);
            throw error;
        }
    }

    async generateAudio(text, language = 'lithuanian', options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Google TTS not properly configured');
        }

        const voice = this.config.voices[language] || this.config.voices.english;
        
        const requestBody = {
            input: { text: text },
            voice: voice,
            audioConfig: {
                ...this.config.audioConfig,
                ...options.audioConfig
            }
        };

        const response = await fetch(`${this.config.endpoint}?key=${this.config.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Google TTS API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.audioContent; // Base64 encoded audio
    }

    async playAudio(audioContent) {
        return new Promise((resolve, reject) => {
            try {
                // Convert base64 to blob
                const byteCharacters = atob(audioContent);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'audio/mpeg' });
                
                // Create audio element and play
                const audio = new Audio();
                audio.src = URL.createObjectURL(blob);
                
                audio.onended = () => {
                    URL.revokeObjectURL(audio.src);
                    resolve();
                };
                
                audio.onerror = () => {
                    URL.revokeObjectURL(audio.src);
                    reject(new Error('Audio playback failed'));
                };
                
                audio.play().catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    isAvailable() {
        return !!this.config.apiKey;
    }
}

// Azure Cognitive Services TTS Provider
class AzureTTSProvider extends TTSProvider {
    async speak(text, language = 'lithuanian', options = {}) {
        try {
            const audioData = await this.generateAudio(text, language, options);
            return this.playAudio(audioData);
        } catch (error) {
            console.error('Azure TTS error:', error);
            throw error;
        }
    }

    async generateAudio(text, language = 'lithuanian', options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Azure TTS not properly configured');
        }

        const voice = this.config.voices[language] || this.config.voices.english;
        
        const ssml = `<speak version='1.0' xml:lang='${language === 'lithuanian' ? 'lt-LT' : 'en-US'}'>
            <voice name='${voice}'>${text}</voice>
        </speak>`;

        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': this.config.apiKey,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
            },
            body: ssml
        });

        if (!response.ok) {
            throw new Error(`Azure TTS API error: ${response.status} ${response.statusText}`);
        }

        return await response.arrayBuffer();
    }

    async playAudio(audioBuffer) {
        return new Promise((resolve, reject) => {
            try {
                const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
                const audio = new Audio();
                audio.src = URL.createObjectURL(blob);
                
                audio.onended = () => {
                    URL.revokeObjectURL(audio.src);
                    resolve();
                };
                
                audio.onerror = () => {
                    URL.revokeObjectURL(audio.src);
                    reject(new Error('Audio playback failed'));
                };
                
                audio.play().catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    isAvailable() {
        return !!this.config.apiKey && !!this.config.region;
    }
}

// Local Browser TTS Provider (fallback)
class LocalTTSProvider extends TTSProvider {
    constructor(config) {
        super(config);
        this.tts = null;
        this.voices = {
            lithuanian: null,
            english: null
        };
        this.init();
    }

    init() {
        if ('speechSynthesis' in window) {
            this.tts = window.speechSynthesis;
            this.loadVoices();
            
            if (this.tts.onvoiceschanged !== undefined) {
                this.tts.onvoiceschanged = () => this.loadVoices();
            }
        }
    }

    loadVoices() {
        if (!this.tts) return;
        
        const voices = this.tts.getVoices();
        
        this.voices.lithuanian = voices.find(voice => 
            voice.lang === 'lt-LT' || voice.lang === 'lt'
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        
        this.voices.english = voices.find(voice => 
            voice.lang.startsWith('en')
        ) || voices[0];
    }

    async speak(text, language = 'lithuanian', options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Local TTS not available');
        }

        return new Promise((resolve, reject) => {
            this.tts.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.voices[language] || this.voices.english;
            utterance.rate = options.rate || 0.7;
            utterance.pitch = options.pitch || 1.0;
            utterance.volume = options.volume || 0.8;
            
            if (language === 'lithuanian') {
                utterance.lang = 'lt-LT';
            } else {
                utterance.lang = 'en-US';
            }

            utterance.onend = () => resolve();
            utterance.onerror = (event) => reject(new Error(`TTS error: ${event.error}`));

            this.tts.speak(utterance);
        });
    }

    async generateAudio(text, language = 'lithuanian', options = {}) {
        // Local TTS doesn't generate audio files, only speaks directly
        throw new Error('Local TTS does not support audio generation');
    }

    isAvailable() {
        return 'speechSynthesis' in window && this.tts;
    }
}

// Export the classes
window.CloudTTSConfig = CloudTTSConfig;
window.TTSProvider = TTSProvider;
window.GoogleTTSProvider = GoogleTTSProvider;
window.AzureTTSProvider = AzureTTSProvider;
window.LocalTTSProvider = LocalTTSProvider;