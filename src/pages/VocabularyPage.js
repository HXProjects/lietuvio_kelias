/**
 * Vocabulary Page - Extends BasePage with vocabulary-specific functionality
 */
class VocabularyPage extends BasePage {
    constructor() {
        super();
        this.vocabularyData = null;
        this.flashcards = [];
        this.currentCard = 0;
        this.ttsClient = null;
        this.ttsServerAvailable = false;
        this.studySession = { active: false };
        this.currentTopicId = null; // Track current topic for legacy compatibility
    }

    /**
     * Initialize vocabulary page specific functionality
     */
    async initializePage() {
        console.log('🔤 VocabularyPage: Initializing...');

        // Initialize TTS client
        this.initializeTTSClient();

        // Setup event listeners
        this.setupEventListeners();

        // Load initial UI
        await this.updateUI();

        console.log('✅ VocabularyPage: Initialization complete');
    }

    /**
     * Initialize vocabulary data system
     */
    async initializeVocabularyData() {
        console.log('🔤 VocabularyPage: initializeVocabularyData starting...');
        try {
            console.log('🔤 VocabularyPage: Checking for VocabularyData class...');
            if (window.VocabularyData) {
                console.log('🔤 VocabularyPage: VocabularyData class found, creating instance...');
                this.vocabularyData = new VocabularyData();
                
                // Legacy VocabularyData doesn't have init(), but we need to ensure it's ready
                console.log('🔤 VocabularyPage: VocabularyData instance created');
                
                // Test if we can load topic data immediately
                console.log('🔤 VocabularyPage: Testing topic loading...');
                try {
                    const testTopic = await this.vocabularyData.loadTopicFile('everyday');
                    console.log('🔤 VocabularyPage: Test topic load result:', testTopic);
                    if (testTopic && testTopic.phrases) {
                        console.log(`🔤 VocabularyPage: Test successful - found ${testTopic.phrases.length} phrases in everyday topic`);
                    } else {
                        console.warn('🔤 VocabularyPage: Test topic has no phrases');
                    }
                } catch (testError) {
                    console.error('🔤 VocabularyPage: Test topic load failed:', testError);
                }
                
            } else {
                throw new Error('VocabularyData class not available');
            }
        } catch (error) {
            console.error('🔤 VocabularyPage: Failed to initialize vocabulary data:', error);
            this.showError('Failed to load vocabulary data');
        }
    }

    /**
     * Initialize TTS client
     */
    initializeTTSClient() {
        if (window.LithuanianTTSClient) {
            this.ttsClient = new LithuanianTTSClient('http://localhost:3001');
            this.checkTTSServerStatus();
        }
    }

    /**
     * Check TTS server availability
     */
    async checkTTSServerStatus() {
        try {
            if (this.ttsClient) {
                this.ttsServerAvailable = await this.ttsClient.isServerAvailable();
                console.log(`TTS Server Status: ${this.ttsServerAvailable ? 'Available' : 'Offline'}`);
            }
        } catch (error) {
            console.warn('TTS server check failed:', error);
            this.ttsServerAvailable = false;
        }
    }

    /**
     * Setup page-specific event listeners
     */
    setupEventListeners() {
        // Call parent setup first
        this.setupCommonEventListeners();

        // Topic filters
        document.addEventListener('click', (event) => {
            const topicBtn = event.target.closest('.topic-btn');
            if (topicBtn) {
                const topicId = topicBtn.dataset.topic;
                this.switchTopic(topicId);
            }
        });

        // Study session controls
        const startStudyBtn = document.getElementById('start-study-session');
        if (startStudyBtn) {
            startStudyBtn.onclick = () => this.startPracticeSession();
        }

        // Flashcard navigation
        const nextBtn = document.getElementById('next-flashcard');
        const prevBtn = document.getElementById('prev-flashcard');
        if (nextBtn) nextBtn.onclick = () => this.nextFlashcard();
        if (prevBtn) prevBtn.onclick = () => this.prevFlashcard();

        // Difficulty feedback
        document.addEventListener('click', (event) => {
            const difficultyBtn = event.target.closest('.difficulty-btn');
            if (difficultyBtn) {
                const difficulty = parseInt(difficultyBtn.dataset.difficulty);
                this.handleFeedback(difficulty);
            }
        });

        // TTS settings
        const ttsSettingsBtn = document.getElementById('tts-settings-btn');
        if (ttsSettingsBtn) {
            ttsSettingsBtn.onclick = () => this.openTTSSettings();
        }
    }

    /**
     * Switch to a specific topic
     */
    async switchTopic(topicId) {
        try {
            console.log(`🔧 VocabularyPage: Switching to topic: ${topicId}`);
            
            // Legacy VocabularyData doesn't have switchTopic, so we'll simulate it
            this.currentTopicId = topicId;
            
            // Update active topic button
            document.querySelectorAll('.topic-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.topic === topicId);
            });

            await this.updateVocabularyGrid();
            this.showInfo(`Switched to ${topicId} topic`);

        } catch (error) {
            console.error('🔧 VocabularyPage: Failed to switch topic:', error);
            this.showError('Failed to switch topic');
        }
    }

    /**
     * Handle word pronunciation with button feedback
     */
    async pronounceWord(word, button = null) {
        if (!word) return;

        // Find button if not provided
        if (!button) {
            button = this.findButton(word);
        }

        try {
            await this.pronounceText(word, 'lithuanian', button);
        } catch (error) {
            // Error handling is done in BasePage.pronounceText
        }
    }

    /**
     * Start practice session
     */
    startPracticeSession() {
        if (!this.vocabularyData) {
            this.showError('Vocabulary data not loaded');
            return;
        }

        const dueWords = this.vocabularyData.getWordsForReview();
        
        if (dueWords.length === 0) {
            this.showInfo('No words due for review! Try adding new words or come back later.');
            return;
        }

        this.studySession = {
            active: true,
            startTime: new Date(),
            results: []
        };

        this.flashcards = dueWords.slice(0, 20); // Limit to 20 words per session
        this.currentCard = 0;
        
        this.showFlashcardMode();
        this.showCurrentFlashcard();
        this.showSuccess('Study session started! 📚');
    }

    /**
     * Show current flashcard
     */
    showCurrentFlashcard() {
        if (this.flashcards.length === 0) return;

        const card = this.flashcards[this.currentCard];
        const cardElement = document.getElementById('current-flashcard');
        
        if (cardElement && card) {
            cardElement.innerHTML = `
                <div class="flashcard-content">
                    <div class="word-lithuanian">
                        ${card.lithuanian}
                        <button class="pronunciation-btn" data-pronounce="${card.lithuanian}">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                    <div class="word-english">${card.english}</div>
                    <div class="word-progress">${this.currentCard + 1} / ${this.flashcards.length}</div>
                </div>
            `;
        }
    }

    /**
     * Navigate flashcards
     */
    nextFlashcard() {
        if (this.currentCard < this.flashcards.length - 1) {
            this.currentCard++;
            this.showCurrentFlashcard();
        } else {
            this.endStudySession();
        }
    }

    prevFlashcard() {
        if (this.currentCard > 0) {
            this.currentCard--;
            this.showCurrentFlashcard();
        }
    }

    /**
     * Handle difficulty feedback
     */
    handleFeedback(difficulty) {
        if (this.flashcards.length === 0) return;

        const currentWord = this.flashcards[this.currentCard];
        
        // Update SRS data
        if (this.vocabularyData && currentWord) {
            this.vocabularyData.updateWordDifficulty(currentWord.id, difficulty);
        }

        // Record session result
        this.studySession.results.push({
            word: currentWord,
            difficulty: difficulty,
            timestamp: new Date()
        });

        // Show feedback message
        const messages = {
            1: 'Hard - This word will be shown more frequently.',
            2: 'Medium - Good progress!',
            3: 'Easy - This word will be reviewed less frequently.'
        };
        
        this.showInfo(messages[difficulty]);

        // Auto-advance to next card
        setTimeout(() => {
            this.nextFlashcard();
        }, 1000);
    }

    /**
     * End study session
     */
    endStudySession() {
        if (this.studySession.active) {
            const sessionDuration = new Date() - this.studySession.startTime;
            const wordsStudied = this.studySession.results.length;
            
            this.showSuccess(`Study session complete! 🎉 Studied ${wordsStudied} words in ${Math.round(sessionDuration / 60000)} minutes.`);
            
            // Save session data
            this.saveStudySession();
            
            this.studySession.active = false;
            this.hideFlashcardMode();
        }
    }

    /**
     * Save study session data
     */
    saveStudySession() {
        try {
            const sessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
            sessions.push({
                date: new Date().toISOString(),
                wordsStudied: this.studySession.results.length,
                sessionDuration: new Date() - this.studySession.startTime,
                results: this.studySession.results
            });
            localStorage.setItem('studySessions', JSON.stringify(sessions));
        } catch (error) {
            console.warn('Failed to save study session:', error);
        }
    }

    /**
     * Show flashcard mode UI
     */
    showFlashcardMode() {
        const flashcardSection = document.getElementById('flashcard-section');
        const vocabularyGrid = document.getElementById('vocabulary-grid');
        
        if (flashcardSection) flashcardSection.style.display = 'block';
        if (vocabularyGrid) vocabularyGrid.style.display = 'none';
    }

    /**
     * Hide flashcard mode UI
     */
    hideFlashcardMode() {
        const flashcardSection = document.getElementById('flashcard-section');
        const vocabularyGrid = document.getElementById('vocabulary-grid');
        
        if (flashcardSection) flashcardSection.style.display = 'none';
        if (vocabularyGrid) vocabularyGrid.style.display = 'block';
        
        // Refresh the main UI
        this.updateUI();
    }

    /**
     * Open TTS settings modal
     */
    openTTSSettings() {
        const content = `
            <div class="tts-settings-content">
                <div class="setting-group">
                    <label>TTS Server Status</label>
                    <div class="server-status">
                        <span class="${this.ttsServerAvailable ? 'status-online' : 'status-offline'}">
                            ${this.ttsServerAvailable ? '✅ Online' : '❌ Offline'}
                        </span>
                        <button onclick="window.app.getCurrentPage().checkTTSServerStatus()" class="btn btn-secondary">
                            Check Status
                        </button>
                    </div>
                </div>
                
                <div class="setting-group">
                    <label>Test Pronunciation</label>
                    <div class="tts-test">
                        <input type="text" id="test-text" placeholder="Enter Lithuanian text..." value="Labas rytas!">
                        <button onclick="window.app.getCurrentPage().testTTS()" class="btn btn-primary">
                            Test TTS
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.uiManager.showModal('tts-settings-modal', 'TTS Settings', content);
    }

    /**
     * Test TTS functionality
     */
    async testTTS() {
        const testInput = document.getElementById('test-text');
        const text = testInput ? testInput.value.trim() : 'Labas rytas!';
        
        if (text) {
            await this.pronounceText(text);
        }
    }

    /**
     * Update main UI
     */
    async updateUI() {
        try {
            await this.updateTopicFilters();
            await this.updateVocabularyGrid();
            this.updateStats();
        } catch (error) {
            console.error('Failed to update UI:', error);
        }
    }

    /**
     * Update topic filters
     */
    async updateTopicFilters() {
        const filtersContainer = document.getElementById('topic-filters');
        if (!filtersContainer) {
            console.warn('VocabularyPage: Missing topic filters container');
            return;
        }

        try {
            // Load topics config directly
            const response = await fetch('topics/config.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const config = await response.json();
            
            if (!config.topics || !Array.isArray(config.topics)) {
                throw new Error('Invalid topics config format');
            }
            
            console.log(`✅ Loaded ${config.topics.length} topics from config`);
            
            filtersContainer.innerHTML = config.topics.map(topic => `
                <button class="topic-btn" data-topic="${topic.id}">
                    <i class="${topic.icon}"></i>
                    ${topic.displayName}
                </button>
            `).join('');
            
            // Auto-select first topic if none is selected
            if (!this.currentTopicId && config.topics.length > 0) {
                await this.switchTopic(config.topics[0].id);
            }
            
        } catch (error) {
            console.error('VocabularyPage: Error loading topics:', error);
            filtersContainer.innerHTML = '<p>Error loading topics</p>';
        }
    }

    /**
     * Update vocabulary grid
     */
    async updateVocabularyGrid() {
        const gridContainer = document.getElementById('vocabulary-grid');
        if (!gridContainer) {
            console.warn('VocabularyPage: Missing gridContainer');
            return;
        }

        try {
            let currentVocabulary = [];
            
            if (this.currentTopicId) {
                // Load topic data directly using fetch (same as legacy system)
                try {
                    const response = await fetch(`topics/${this.currentTopicId}.json`);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const topicData = await response.json();
                    
                    if (topicData && topicData.phrases) {
                        currentVocabulary = topicData.phrases;
                        console.log(`✅ Loaded ${currentVocabulary.length} phrases from ${this.currentTopicId}`);
                    } else {
                        console.warn(`Topic ${this.currentTopicId} has no phrases`);
                    }
                } catch (error) {
                    console.error(`Failed to load topic ${this.currentTopicId}:`, error);
                }
            }
            
            if (currentVocabulary.length === 0) {
                gridContainer.innerHTML = this.currentTopicId ? 
                    '<p class="no-vocabulary">No vocabulary found for this topic</p>' :
                    '<p class="no-vocabulary">Select a topic to view vocabulary</p>';
                return;
            }

            gridContainer.innerHTML = currentVocabulary.map(item => `
                <div class="vocabulary-card">
                    <div class="word-lithuanian">
                        ${item.lithuanian}
                        <button class="pronunciation-btn" data-pronounce="${item.lithuanian}">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                    <div class="word-english">${item.english}</div>
                    <div class="word-meta">
                        <span class="part-of-speech">${item.partOfSpeech || 'phrase'}</span>
                        <span class="difficulty">${item.difficulty || 'A1'}</span>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error in updateVocabularyGrid:', error);
            gridContainer.innerHTML = '<p class="error">Error loading vocabulary</p>';
        }
    }

    /**
     * Update statistics display
     */
    updateStats() {
        // Implementation depends on your existing stats structure
        // This would update elements like word count, study streak, etc.
    }

    /**
     * Cleanup page resources
     */
    cleanup() {
        super.cleanup();
        
        if (this.studySession.active) {
            this.endStudySession();
        }
    }
}

// Make available globally
window.VocabularyPage = VocabularyPage;