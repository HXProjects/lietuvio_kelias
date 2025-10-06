// Lithuanian TTS Audio Manager using local server
class AudioManager {
    constructor() {
        this.ttsClient = new LithuanianTTSClient('http://localhost:3001');
        this.isServerAvailable = false;
        this.fallbackTTS = null;
        this.init();
    }

    async init() {
        // Check if TTS server is available
        try {
            this.isServerAvailable = await this.ttsClient.isServerAvailable();
            console.log(this.isServerAvailable ? 
                '✅ Lithuanian TTS server connected' : 
                '⚠️ TTS server not available, using fallback'
            );
        } catch (error) {
            console.warn('TTS server check failed:', error);
            this.isServerAvailable = false;
        }

        // Initialize browser TTS fallback
        if ('speechSynthesis' in window) {
            this.fallbackTTS = window.speechSynthesis;
        }
    }

    loadVoices() {
        if (!this.tts) return;
        
        const voices = this.tts.getVoices();
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
        // Find Lithuanian voice
        this.voices.lithuanian = voices.find(voice => 
            voice.lang === 'lt-LT' || 
            voice.lang === 'lt' ||
            voice.name.toLowerCase().includes('lithuanian') ||
            voice.name.toLowerCase().includes('lietuv')
        );
        
        // Find English voice
        this.voices.english = voices.find(voice => 
            voice.lang === 'en-US' ||
            voice.lang === 'en-GB' ||
            voice.lang.startsWith('en')
        );
        
        // Fallback to any available voice
        if (!this.voices.lithuanian) {
            this.voices.lithuanian = this.voices.english || voices[0];
        }
        
        if (!this.voices.english) {
            this.voices.english = voices.find(v => v.lang.startsWith('en')) || voices[0];
        }
        
        this.isInitialized = voices.length > 0;
        
        if (this.voices.lithuanian) {
            console.log('✅ Lithuanian voice:', this.voices.lithuanian.name);
        } else {
            console.log('⚠️ No Lithuanian voice found, using fallback');
        }
    }

    async speak(text, language = 'lithuanian', options = {}) {
        if (!text || !text.trim()) {
            console.warn('Empty text provided to TTS');
            return false;
        }

        // Use same approach as vocabulary page - call TTS client directly
        if (language === 'lithuanian') {
            console.log('🎵 CONJUGATION: Attempting Lithuanian TTS for:', text);
            if (this.ttsClient) {
                try {
                    await this.ttsClient.speak(text, options.forceRegenerate || false);
                    console.log('✅ CONJUGATION: TTS successful');
                    return true;
                } catch (error) {
                    console.warn('❌ CONJUGATION: TTS Client failed:', error);
                    // Show specific error message as bottom popup
                    this.showBottomPopup(`🔊 ${error.message}`, 'error');
                    return false;
                }
            } else {
                console.warn('No TTS client available');
                return false;
            }
        } else {
            // Use browser TTS for English
            return this.speakWithFallback(text, language);
        }
    }

    // Show TTS unavailable message
    showTTSUnavailableMessage() {
        // Only show message once per session to avoid spam
        if (!this.hasShownUnavailableMessage) {
            this.hasShownUnavailableMessage = true;
            
            console.warn('🔊 CONJUGATION: Audio not available (not cached, TTS server offline)');
            
            // Show user-friendly message in the app
            if (window.app && window.app.showMessage) {
                window.app.showMessage('🔊 Audio not available (not cached, TTS server offline)', 'warning');
            } else {
                // Fallback: create temporary message element
                const message = document.createElement('div');
                message.className = 'message warning';
                message.innerHTML = '🔊 Audio not available (not cached, TTS server offline)';
                message.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #fff3cd; color: #856404; padding: 12px 20px; border: 1px solid #ffeaa7; border-radius: 5px; z-index: 1000; font-family: Inter, sans-serif;';
                
                document.body.appendChild(message);
                
                // Remove after 4 seconds
                setTimeout(() => {
                    if (message.parentNode) {
                        message.parentNode.removeChild(message);
                    }
                }, 4000);
            }
        }
    }

    showBottomPopup(text, type = 'info', duration = 4000) {
        // Create popup element
        const popup = document.createElement('div');
        popup.className = `bottom-popup ${type}`;
        popup.innerHTML = text;
        
        // Style the popup
        popup.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#28a745'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 90vw;
            text-align: center;
            animation: slideUp 0.3s ease-out;
        `;
        
        // Add animation keyframes if not already added
        if (!document.querySelector('#popup-animations')) {
            const style = document.createElement('style');
            style.id = 'popup-animations';
            style.textContent = `
                @keyframes slideUp {
                    from {
                        transform: translateX(-50%) translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes slideDown {
                    from {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(-50%) translateY(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(popup);
        
        // Auto-remove with slide down animation
        setTimeout(() => {
            popup.style.animation = 'slideDown 0.3s ease-in';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 300);
        }, duration);
    }

    speakWithFallback(text, language = 'lithuanian') {
        if (!this.fallbackTTS) {
            console.warn('No fallback TTS available');
            return false;
        }

        // Stop any ongoing speech
        this.fallbackTTS.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set language
        if (language === 'lithuanian') {
            utterance.lang = 'lt-LT';
        } else if (language === 'english') {
            utterance.lang = 'en-US';
        }

        // Set speech parameters optimized for learning
        utterance.rate = 0.8;  // Slower for learning
        utterance.pitch = 1.0;
        utterance.volume = 0.9;

        // Event handlers
        utterance.onstart = () => {
            console.log('🔊 Speaking (fallback):', text);
        };

        utterance.onerror = (event) => {
            console.error('Fallback TTS error:', event.error);
        };

        utterance.onend = () => {
            console.log('✅ Speech completed');
        };

        try {
            this.fallbackTTS.speak(utterance);
            return true;
        } catch (error) {
            console.error('Error speaking text:', error);
            return false;
        }
    }

    stop() {
        // Stop TTS server audio (not directly controllable)
        // Stop fallback TTS
        if (this.fallbackTTS) {
            this.fallbackTTS.cancel();
        }
    }

    // Utility method to speak with visual feedback
    async speakWithFeedback(text, language = 'lithuanian', feedbackElement = null) {
        if (feedbackElement) {
            feedbackElement.classList.add('speaking');
        }
        
        try {
            const success = await this.speak(text, language);
            
            if (feedbackElement) {
                setTimeout(() => {
                    feedbackElement.classList.remove('speaking');
                }, text.length * 50 + 1000); // Approximate speech duration
            }
            
            return success;
        } catch (error) {
            if (feedbackElement) {
                feedbackElement.classList.remove('speaking');
            }
            throw error;
        }
    }


    async checkServerStatus() {
        try {
            this.isServerAvailable = await this.ttsClient.isServerAvailable();
            return this.isServerAvailable;
        } catch (error) {
            this.isServerAvailable = false;
            return false;
        }
    }
}

// Lithuanian Conjugation Trainer Application
class ConjugationApp {
    constructor() {
        this.conjugationData = new ConjugationData();
        this.gameStats = {
            score: 0,
            streak: 0,
            level: 1,
            totalAnswers: 0,
            correctAnswers: 0,
            sessionProgress: 0,
            sessionTarget: 10
        };
        this.currentMode = 'practice'; // practice, quiz
        this.learningMode = true; // true = learning mode, false = practice mode (default to learning mode)
        this.showAllAnswers = true; // Show answers by default in learning mode
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        
        // Wait for topics to load (not verbs - user selects topic)
        await this.waitForTopicsToLoad();
        
        // Initialize topics UI
        this.initializeTopicsUI();
        
        // Initialize enhanced TTS system
        await this.setupTextToSpeech();
        
        // Initialize UI for default Learning mode
        this.initializeModeUI();
        
        // Show topic selection message instead of trying to load verb
        this.showTopicSelectionMessage();
        this.updateUI();
    }
    
    initializeModeUI() {
        // Set up UI for default Learning mode
        const showAllBtn = document.getElementById('show-all-btn');
        if (this.learningMode) {
            // Learning mode - hide show all button
            showAllBtn.style.display = 'none';
        } else {
            // Practice mode - show show all button
            showAllBtn.style.display = 'inline-flex';
        }
    }
    
    async waitForTopicsToLoad() {
        console.log('Waiting for topics to load...');
        let attempts = 0;
        // Wait until topics are loaded
        while (this.conjugationData.topics.length === 0 && this.conjugationData.isLoading) {
            attempts++;
            if (attempts % 10 === 0) {
                console.log(`Still waiting for topics... attempt ${attempts}`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Safety timeout after 5 seconds
            if (attempts > 50) {
                console.error('Timeout waiting for topics to load');
                break;
            }
        }
        
        console.log(`Topics loaded successfully. Available topics: ${this.conjugationData.topics.length}`);
    }
    
    updateLoadingStatus(message) {
        const verbElement = document.getElementById('current-verb');
        const translationElement = document.getElementById('verb-translation');
        if (verbElement) verbElement.textContent = message;
        if (translationElement) translationElement.textContent = 'Please wait...';
    }
    
    clearLoadingStatus() {
        // Status will be updated by loadNewVerb()
    }

    initializeTopicsUI() {
        const topicFilters = document.getElementById('verb-topic-filters');
        const topics = this.conjugationData.getTopics();
        
        if (!topicFilters || topics.length === 0) {
            console.log('No topic filters element or no topics available');
            return;
        }

        // Create topic buttons (sidebar style like vocabulary builder)
        topicFilters.innerHTML = topics.map(topic => `
            <button class="topic-btn" data-topic="${topic.id}">
                <i class="${topic.icon}"></i>
                ${topic.displayName}
            </button>
        `).join('');

        // Add click event listeners to topic buttons
        topicFilters.querySelectorAll('.topic-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const topicId = btn.dataset.topic;
                this.switchToTopic(topicId);
            });
        });
        
        // Show instructions if no topic selected
        this.showTopicSelectionMessage();
    }

    async switchToTopic(topicId) {
        try {
            console.log(`Switching to topic: ${topicId}`);
            
            const success = await this.conjugationData.switchToTopic(topicId);
            
            if (success) {
                // Update active topic button in sidebar
                document.querySelectorAll('.topic-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.topic === topicId);
                });

                // Show and populate verb list
                this.populateVerbList();
                
                // Reset game and load new verb from new topic
                this.gameStats.sessionProgress = 0;
                this.updateUI();
                this.loadNewVerb();
                
                console.log(`Successfully switched to topic: ${topicId}`);
            } else {
                console.error(`Failed to switch to topic: ${topicId}`);
                this.showTopicSelectionMessage();
                this.hideVerbList();
            }
        } catch (error) {
            console.error('Error switching topic:', error);
            this.showTopicSelectionMessage();
            this.hideVerbList();
        }
    }
    
    showTopicSelectionMessage() {
        const verbElement = document.getElementById('current-verb');
        const translationElement = document.getElementById('verb-translation');
        if (verbElement) verbElement.textContent = 'Select a topic to start';
        if (translationElement) translationElement.textContent = 'Choose a verb category from the sidebar';
        
        // Clear conjugation grid
        const grid = document.getElementById('conjugation-grid');
        if (grid) grid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">Select a topic to practice verb conjugations</p>';
    }
    
    populateVerbList() {
        const verbListSection = document.getElementById('verb-list-section');
        const verbListTitle = document.getElementById('verb-list-title');
        const verbList = document.getElementById('verb-list');
        const verbs = this.conjugationData.getVerbs();
        const currentTopic = this.conjugationData.getCurrentTopic();
        
        if (!verbListSection || !verbList || verbs.length === 0) {
            this.hideVerbList();
            return;
        }
        
        // Update title with topic name
        if (verbListTitle && currentTopic) {
            verbListTitle.textContent = `${currentTopic.displayName} (${verbs.length})`;
        }
        
        // Create verb list items
        verbList.innerHTML = verbs.map(verb => `
            <div class="verb-item" data-infinitive="${verb.infinitive}">
                <div class="verb-infinitive">${verb.infinitive}</div>
                <div class="verb-english">${verb.english}</div>
                <div class="verb-meta">
                    <span class="verb-type">${verb.type}</span>
                    ${verb.conjugationGroup ? `<span class="verb-group">Group ${verb.conjugationGroup}</span>` : ''}
                </div>
            </div>
        `).join('');
        
        // Add click event listeners to verb items
        verbList.querySelectorAll('.verb-item').forEach(item => {
            item.addEventListener('click', () => {
                const infinitive = item.dataset.infinitive;
                this.selectSpecificVerb(infinitive);
            });
        });
        
        // Show the verb list section
        verbListSection.style.display = 'block';
    }
    
    hideVerbList() {
        const verbListSection = document.getElementById('verb-list-section');
        if (verbListSection) {
            verbListSection.style.display = 'none';
        }
    }
    
    selectSpecificVerb(infinitive) {
        const verb = this.conjugationData.findVerbByInfinitive(infinitive);
        if (verb) {
            // Set as current verb
            this.conjugationData.setCurrentVerb(verb);
            
            // Update active state in verb list
            document.querySelectorAll('.verb-item').forEach(item => {
                item.classList.toggle('active', item.dataset.infinitive === infinitive);
            });
            
            // Update the conjugation display
            this.renderConjugationGrid();
            this.updateUI();
            
            console.log(`Selected verb: ${infinitive}`);
        }
    }

    setupEventListeners() {
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMode(e.target.closest('.mode-btn').dataset.mode);
            });
        });

        // Mode toggle
        document.getElementById('mode-toggle').addEventListener('change', (e) => {
            this.toggleMode(e.target.checked);
        });

        // Verb actions
        document.getElementById('new-verb-btn').addEventListener('click', () => this.loadNewVerb());
        document.getElementById('show-all-btn').addEventListener('click', () => this.toggleShowAll());
        document.getElementById('pronounce-btn').addEventListener('click', () => this.pronounceVerb());
        document.getElementById('change-tense-btn').addEventListener('click', () => this.openTenseModal());
        document.getElementById('tts-settings-btn').addEventListener('click', () => this.openTTSSettings());

        // Tense modal
        document.getElementById('close-tense-modal').addEventListener('click', () => this.closeTenseModal());
        document.querySelectorAll('.tense-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTense(e.target.dataset.tense);
                this.closeTenseModal();
            });
        });

        // Close modal on background click
        document.getElementById('tense-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('tense-modal')) {
                this.closeTenseModal();
            }
        });
    }

    async setupTextToSpeech() {
        try {
            console.log('🎵 CONJUGATION: Initializing TTS System...');
            window.audioManager = new AudioManager();
            this.audioManager = window.audioManager;
            console.log('✅ CONJUGATION: TTS System Ready');
        } catch (error) {
            console.warn('⚠️ CONJUGATION: TTS setup failed, using basic fallback:', error);
            // Create minimal TTS system
            window.audioManager = {
                speak: (text, language) => {
                    if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.lang = language === 'lithuanian' ? 'lt-LT' : 'en-US';
                        utterance.rate = 0.7;
                        speechSynthesis.speak(utterance);
                        return true;
                    }
                    return false;
                },
                stop: () => {
                    if ('speechSynthesis' in window) {
                        speechSynthesis.cancel();
                    }
                },
                showTTSUnavailableMessage: () => {
                    console.warn('🔊 TTS system not available');
                }
            };
            this.audioManager = window.audioManager;
        }
    }

    switchMode(mode) {
        // Update active button
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // For now, only verbs are implemented
        if (mode === 'verbs') {
            this.currentMode = mode;
            this.loadNewVerb();
        } else {
            this.showMessage('Coming soon! Currently only verb conjugation is available.', 'info');
        }
    }

    toggleMode(isPracticeMode) {
        this.learningMode = !isPracticeMode; // unchecked = learning mode, checked = practice mode
        
        // Update UI elements based on mode
        const showAllBtn = document.getElementById('show-all-btn');
        if (this.learningMode) {
            // Learning mode - hide show all button, always show answers
            showAllBtn.style.display = 'none';
            this.showAllAnswers = true;
        } else {
            // Practice mode - show show all button, hide answers by default
            showAllBtn.style.display = 'inline-flex';
            this.showAllAnswers = false;
        }
        
        // Re-render the grid with new mode
        this.renderConjugationGrid();
        
        // Show mode change message
        const mode = this.learningMode ? 'Learning' : 'Practice';
        this.showMessage(`Switched to ${mode} Mode`, 'info');
    }

    loadNewVerb() {
        console.log('Loading new verb...');
        const verb = this.conjugationData.getRandomVerb();
        console.log('Selected verb:', verb);
        
        if (!verb) {
            console.warn('No verb available to load');
            return;
        }
        
        // Update verb list selection to highlight current verb
        this.updateVerbListSelection(verb.infinitive);
        
        // Reset show all only in practice mode
        if (!this.learningMode) {
            this.showAllAnswers = false;
        }
        
        this.updateVerbDisplay();
        this.renderConjugationGrid();
        this.updateStats();
        
        this.showMessage(`New verb: ${verb.infinitive} (${verb.english})`, 'info');
    }
    
    updateVerbListSelection(infinitive) {
        // Update active state in verb list
        document.querySelectorAll('.verb-item').forEach(item => {
            item.classList.toggle('active', item.dataset.infinitive === infinitive);
        });
    }

    updateVerbDisplay() {
        const verb = this.conjugationData.currentVerb;
        if (!verb) return;

        document.getElementById('current-verb').textContent = verb.infinitive;
        
        // Enhanced verb information
        let verbInfo = verb.english;
        if (verb.type) {
            verbInfo += ` • ${verb.type}`;
        }
        if (verb.transitivity) {
            verbInfo += ` • ${verb.transitivity}`;
        }
        if (verb.government && verb.government.case) {
            verbInfo += ` • requires ${verb.government.case} case`;
        }
        
        document.getElementById('verb-translation').innerHTML = `
            <div class="verb-main-info">${verb.english}</div>
            <div class="verb-grammar-info">
                <span class="grammar-tag">${verb.type}</span>
                ${verb.conjugationGroup ? `<span class="grammar-tag conjugation-group" title="Lithuanian conjugation group">Group ${verb.conjugationGroup}</span>` : ''}
                <span class="grammar-tag">${verb.transitivity}</span>
                ${verb.government ? `<span class="grammar-tag government" title="${verb.government.description}">${verb.government.case} case</span>` : ''}
                ${verb.aspectPair ? `<span class="grammar-tag aspect" title="Perfective aspect">→ ${verb.aspectPair}</span>` : ''}
            </div>
            ${verb.government ? `
                <div class="government-example">
                    <span class="example-text">${verb.government.example}</span>
                    <button class="play-btn" onclick="window.audioManager.speak('${verb.government.example.replace(/'/g, "\\\'")}', 'lithuanian')" title="Listen to example">
                        <i class="fas fa-play"></i>
                    </button>
                </div>` : ''}
        `;
        
        const tenseInfo = this.conjugationData.getTenses().find(t => t.id === this.conjugationData.currentTense);
        document.getElementById('current-tense').textContent = tenseInfo ? tenseInfo.name + ' Tense' : 'Present Tense';
    }

    renderConjugationGrid() {
        const conjugations = this.conjugationData.getCurrentConjugations();
        const pronouns = this.conjugationData.getPronouns();
        const grid = document.getElementById('conjugation-grid');
        
        if (!conjugations) return;

        grid.innerHTML = pronouns.map(pronoun => {
            const conjugation = conjugations[pronoun];
            return `
                <div class="conjugation-card" data-pronoun="${pronoun}">
                    <div class="pronoun-header">
                        <div class="pronoun-info">
                            <span class="pronoun">${pronoun}</span>
                            ${conjugation.stress ? `<span class="stress-pattern" title="Stress pattern">${conjugation.stress}</span>` : ''}
                        </div>
                        <button class="hint-btn" onclick="app.showHint('${pronoun}')" title="Show example">
                            <i class="fas fa-lightbulb"></i>
                        </button>
                    </div>
                    
                    <div class="conjugation-input-container">
                        ${this.learningMode ? 
                            `<div class="conjugation-display">
                                <span class="conjugation-form">${conjugation.form}</span>
                                <button class="play-btn" onclick="speakConjugation('${conjugation.form}', '${pronoun}')" title="Listen to conjugation">
                                    <i class="fas fa-play"></i>
                                </button>
                            </div>` :
                            `<input 
                                type="text" 
                                class="conjugation-input" 
                                data-pronoun="${pronoun}"
                                placeholder="Enter conjugation..."
                                ${this.showAllAnswers ? `value="${conjugation.form}"` : ''}
                                ${this.showAllAnswers ? 'readonly' : ''}
                            >
                            <button class="check-btn" onclick="app.checkConjugation('${pronoun}')" ${this.showAllAnswers ? 'style="display:none"' : ''}>
                                <i class="fas fa-check"></i>
                            </button>`
                        }
                    </div>
                    
                    <div class="example-container" style="display: ${this.learningMode ? 'block' : 'none'};">
                        <div class="example-sentence">
                            <span class="sentence-text">${conjugation.example}</span>
                            <button class="play-btn" onclick="window.audioManager.speak('${conjugation.example.replace(/'/g, "\\\'")}', 'lithuanian')" title="Listen to pronunciation">
                                <i class="fas fa-play"></i>
                            </button>
                        </div>
                        <div class="example-translation">
                            <span class="sentence-text">${conjugation.translation}</span>
                            <button class="play-btn" onclick="window.audioManager.speak('${conjugation.translation.replace(/'/g, "\\\'")}', 'english')" title="Listen to translation">
                                <i class="fas fa-play"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="feedback" style="display: none;"></div>
                </div>
            `;
        }).join('');

        // Add event listeners for inputs
        document.querySelectorAll('.conjugation-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkConjugation(input.dataset.pronoun);
                }
            });

            input.addEventListener('input', (e) => {
                // Clear previous feedback when user starts typing
                const card = input.closest('.conjugation-card');
                const feedback = card.querySelector('.feedback');
                feedback.style.display = 'none';
                card.classList.remove('correct', 'incorrect');
            });
        });
    }

    checkConjugation(pronoun) {
        const input = document.querySelector(`input[data-pronoun="${pronoun}"]`);
        const answer = input.value.trim();
        const card = input.closest('.conjugation-card');
        const feedback = card.querySelector('.feedback');
        
        if (!answer) {
            this.showMessage('Please enter a conjugation!', 'warning');
            return;
        }

        const isCorrect = this.conjugationData.checkAnswer(pronoun, answer);
        const correctAnswer = this.conjugationData.getCorrectAnswer(pronoun);
        
        // Update stats
        this.gameStats.totalAnswers++;
        if (isCorrect) {
            this.gameStats.correctAnswers++;
            this.gameStats.streak++;
            this.gameStats.score += 10 * this.gameStats.streak;
        } else {
            this.gameStats.streak = 0;
        }
        
        // Show feedback
        card.classList.add(isCorrect ? 'correct' : 'incorrect');
        feedback.innerHTML = isCorrect 
            ? '<i class="fas fa-check-circle"></i> Correct!'
            : `<i class="fas fa-times-circle"></i> Incorrect. Correct answer: <strong>${correctAnswer.form}</strong>`;
        feedback.style.display = 'block';
        
        // Disable input and hide check button
        input.readonly = true;
        card.querySelector('.check-btn').style.display = 'none';
        
        this.updateStats();
        this.updateSessionProgress();
        
        // Show success message for correct answers
        if (isCorrect) {
            this.showMessage('Excellent! 🎉', 'success');
        }
    }

    showHint(pronoun) {
        const card = document.querySelector(`[data-pronoun="${pronoun}"]`);
        const exampleContainer = card.querySelector('.example-container');
        
        if (exampleContainer.style.display === 'none') {
            exampleContainer.style.display = 'block';
        } else {
            exampleContainer.style.display = 'none';
        }
    }

    toggleShowAll() {
        this.showAllAnswers = !this.showAllAnswers;
        const btn = document.getElementById('show-all-btn');
        
        if (this.showAllAnswers) {
            btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide All';
            btn.classList.add('active');
        } else {
            btn.innerHTML = '<i class="fas fa-eye"></i> Show All';
            btn.classList.remove('active');
        }
        
        this.renderConjugationGrid();
    }

    pronounceVerb() {
        const verb = this.conjugationData.currentVerb;
        if (!verb) return;
        
        this.audioManager.speak(verb.infinitive, 'lithuanian');
        this.showMessage(`🔊 ${verb.infinitive}`, 'info');
    }

    openTenseModal() {
        document.getElementById('tense-modal').classList.add('active');
    }

    closeTenseModal() {
        document.getElementById('tense-modal').classList.remove('active');
    }

    async openTTSSettings() {
        await this.updateTTSSettingsModal();
        document.getElementById('tts-settings-modal').classList.add('active');
    }

    closeTTSSettings() {
        document.getElementById('tts-settings-modal').classList.remove('active');
    }

    validateGoogleApiKey(apiKey) {
        // Google Cloud API keys typically start with "AIza" and are 39 characters long
        const googleKeyPattern = /^AIza[0-9A-Za-z\-_]{35}$/;
        return googleKeyPattern.test(apiKey);
    }

    updateApiKeyStatus(provider, type, message) {
        const statusElement = document.getElementById(`${provider}-key-status`);
        if (statusElement) {
            statusElement.className = `api-key-status ${type}`;
            statusElement.innerHTML = `
                <i class="fas ${type === 'success' ? 'fa-check-circle text-success' : 
                              type === 'error' ? 'fa-exclamation-triangle text-error' : 
                              'fa-exclamation-triangle text-warning'}"></i>
                ${message}
            `;
        }
    }

    showProviderSettings(provider) {
        // Hide all provider settings
        const googleSettings = document.getElementById('google-settings');
        const azureSettings = document.getElementById('azure-settings');
        
        if (googleSettings) googleSettings.style.display = 'none';
        if (azureSettings) azureSettings.style.display = 'none';
        
        // Show selected provider settings
        if (provider === 'google' && googleSettings) {
            googleSettings.style.display = 'block';
            // Initialize status if key exists
            const apiKeyInput = document.getElementById('google-api-key');
            if (apiKeyInput && apiKeyInput.value.trim()) {
                const isValid = this.validateGoogleApiKey(apiKeyInput.value.trim());
                this.updateApiKeyStatus('google', isValid ? 'success' : 'error', 
                                      isValid ? 'Valid API key format' : 'Invalid API key format');
            } else {
                this.updateApiKeyStatus('google', 'warning', 'No API key configured');
            }
        } else if (provider === 'azure' && azureSettings) {
            azureSettings.style.display = 'block';
        }
    }

    showSetupGuide() {
        const guideWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        guideWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Google Cloud TTS Setup Guide</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        max-width: 800px; 
                        margin: 0 auto; 
                        padding: 20px;
                        line-height: 1.6;
                        color: #333;
                    }
                    h1 { color: #2E7D32; border-bottom: 2px solid #FDD835; padding-bottom: 10px; }
                    h2 { color: #2E7D32; margin-top: 30px; }
                    .step { 
                        background: #f8f9fa; 
                        padding: 15px; 
                        margin: 15px 0; 
                        border-left: 4px solid #FDD835;
                        border-radius: 0 5px 5px 0;
                    }
                    .warning { 
                        background: #fff3cd; 
                        padding: 10px; 
                        border: 1px solid #ffeaa7;
                        border-radius: 5px;
                        margin: 15px 0;
                    }
                    code { 
                        background: #e9ecef; 
                        padding: 2px 6px; 
                        border-radius: 3px;
                        font-family: 'Courier New', monospace;
                    }
                    a { color: #2E7D32; text-decoration: none; font-weight: 500; }
                    a:hover { text-decoration: underline; }
                    .cost-info { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>🔊 Google Cloud Text-to-Speech Setup</h1>
                
                <div class="warning">
                    <strong>⏱️ Setup Time:</strong> 5-10 minutes<br>
                    <strong>💳 Billing Required:</strong> Yes (but 1M characters/month free)
                </div>

                <h2>Step-by-Step Instructions</h2>
                
                <div class="step">
                    <strong>1. Create Google Cloud Account</strong>
                    <br>Visit <a href="https://console.cloud.google.com" target="_parent">Google Cloud Console</a> and sign in
                </div>

                <div class="step">
                    <strong>2. Create New Project</strong>
                    <br>• Click project dropdown → "New Project"
                    <br>• Name: "lithuanian-vocabulary-tts"
                    <br>• Click "Create"
                </div>

                <div class="step">
                    <strong>3. Enable Text-to-Speech API</strong>
                    <br>• Go to "APIs & Services" → "Library"
                    <br>• Search "Text-to-Speech API"
                    <br>• Click "Enable"
                </div>

                <div class="step">
                    <strong>4. Set Up Billing (Required)</strong>
                    <br>• Go to "Billing" in left menu
                    <br>• Click "Link billing account"
                    <br>• Add payment method (free tier still requires this)
                </div>

                <div class="step">
                    <strong>5. Create API Key</strong>
                    <br>• Go to "APIs & Services" → "Credentials"
                    <br>• Click "Create Credentials" → "API Key"
                    <br>• Copy the key (starts with "AIza...")
                </div>

                <div class="step">
                    <strong>6. Secure Your API Key</strong>
                    <br>• Click "Restrict Key" 
                    <br>• Select "Restrict key"
                    <br>• Choose "Cloud Text-to-Speech API"
                    <br>• Click "Save"
                </div>

                <div class="cost-info">
                    <h3>💰 Pricing Information</h3>
                    <strong>Free Tier:</strong> 1,000,000 characters per month<br>
                    <strong>Paid Usage:</strong> $4.00 per 1M characters<br>
                    <br>
                    <strong>For Language Learning:</strong><br>
                    • Average word: ~8 characters<br>
                    • 1000 words = 8,000 characters<br>
                    • Free tier = ~125,000 words/month<br>
                    • Plenty for intensive learning! 🎓
                </div>

                <div class="step">
                    <strong>7. Paste API Key</strong>
                    <br>Return to your vocabulary app and paste the API key in the settings
                </div>

                <h2>🔧 Troubleshooting</h2>
                <p><strong>API Key Invalid:</strong> Ensure it starts with "AIza" and is 39 characters</p>
                <p><strong>Billing Required:</strong> Must set up billing even for free tier</p>
                <p><strong>No Audio:</strong> Check browser audio permissions</p>
            </body>
            </html>
        `);
        guideWindow.document.close();
    }

    async updateTTSSettingsModal() {
        try {
            // Check server status
            const isServerRunning = await this.audioManager.checkServerStatus();
            const serverStatusText = document.getElementById('server-status-text');
            const serverInfo = document.getElementById('server-info');
            const serverInstructions = document.getElementById('server-instructions');
            
            if (serverStatusText) {
                if (isServerRunning) {
                    serverStatusText.innerHTML = '<span class="text-success">✅ TTS Server is running</span>';
                    if (serverInfo) serverInfo.style.display = 'block';
                    if (serverInstructions) serverInstructions.style.display = 'none';
                } else {
                    serverStatusText.innerHTML = '<span class="text-error">❌ TTS Server not available</span>';
                    if (serverInfo) serverInfo.style.display = 'none';
                    if (serverInstructions) serverInstructions.style.display = 'block';
                }
            }

            // Setup event listeners
            this.setupTTSSettingsListeners();
            
        } catch (error) {
            console.warn('Error updating TTS settings:', error);
            const serverStatusText = document.getElementById('server-status-text');
            if (serverStatusText) {
                serverStatusText.innerHTML = '<span class="text-error">❌ Error checking server</span>';
            }
        }
    }

    setupTTSSettingsListeners() {
        try {
            // Close modal
            const closeBtn = document.getElementById('close-tts-modal');
            if (closeBtn) closeBtn.onclick = () => this.closeTTSSettings();

            // Server status check
            const checkServerBtn = document.getElementById('check-server');
            if (checkServerBtn) {
                checkServerBtn.onclick = async () => {
                    checkServerBtn.disabled = true;
                    checkServerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                    
                    try {
                        await this.updateTTSSettingsModal();
                    } finally {
                        checkServerBtn.disabled = false;
                        checkServerBtn.innerHTML = '<i class="fas fa-refresh"></i> Check Server';
                    }
                };
            }

            // Test TTS buttons
            const testLithuanianBtn = document.getElementById('test-tts');
            if (testLithuanianBtn) {
                testLithuanianBtn.onclick = () => {
                    const text = document.getElementById('test-text')?.value || 'Labas rytas! Kaip sekasi?';
                    this.audioManager.speak(text, 'lithuanian');
                };
            }

            const testEnglishBtn = document.getElementById('test-tts-en');
            if (testEnglishBtn) {
                testEnglishBtn.onclick = () => {
                    const text = document.getElementById('test-text')?.value || 'Hello! How are you?';
                    this.audioManager.speak(text, 'english');
                };
            }

            // Close on background click
            const modal = document.getElementById('tts-settings-modal');
            if (modal) {
                modal.onclick = (e) => {
                    if (e.target === modal) {
                        this.closeTTSSettings();
                    }
                };
            }
        } catch (error) {
            console.warn('Error setting up TTS settings listeners:', error);
        }
    }

    changeTense(tense) {
        // Update active tense button
        document.querySelectorAll('.tense-option').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tense="${tense}"]`).classList.add('active');
        
        // Update data and UI
        this.conjugationData.setTense(tense);
        this.updateVerbDisplay();
        this.renderConjugationGrid();
        
        const tenseInfo = this.conjugationData.getTenses().find(t => t.id === tense);
        this.showMessage(`Changed to ${tenseInfo.name} tense`, 'info');
    }

    updateStats() {
        document.getElementById('score').textContent = this.gameStats.score;
        document.getElementById('streak').textContent = this.gameStats.streak;
        document.getElementById('level').textContent = this.gameStats.level;
        
        const accuracy = this.gameStats.totalAnswers > 0 
            ? Math.round((this.gameStats.correctAnswers / this.gameStats.totalAnswers) * 100)
            : 100;
        document.getElementById('accuracy').textContent = accuracy + '%';
        
        // Update level based on score
        this.gameStats.level = Math.floor(this.gameStats.score / 100) + 1;
    }

    updateSessionProgress() {
        this.gameStats.sessionProgress = Math.min(this.gameStats.totalAnswers, this.gameStats.sessionTarget);
        const percentage = (this.gameStats.sessionProgress / this.gameStats.sessionTarget) * 100;
        
        document.getElementById('progress-fill').style.width = percentage + '%';
        document.getElementById('progress-current').textContent = this.gameStats.sessionProgress;
        document.getElementById('progress-total').textContent = this.gameStats.sessionTarget;
        
        if (this.gameStats.sessionProgress >= this.gameStats.sessionTarget) {
            this.showMessage('🎉 Session complete! Great job!', 'success');
            // Reset session progress for next session
            setTimeout(() => {
                this.gameStats.sessionProgress = 0;
                this.gameStats.sessionTarget += 5; // Increase target
                this.updateSessionProgress();
            }, 3000);
        }
    }

    updateUI() {
        this.updateStats();
        this.updateSessionProgress();
    }

    showMessage(text, type = 'info') {
        // Create and show a temporary message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.innerHTML = text;
        
        // Insert at the top of the main content
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(message, mainContent.firstChild);
        
        // Remove after 3 seconds
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    showBottomPopup(text, type = 'info', duration = 4000) {
        // Create popup element
        const popup = document.createElement('div');
        popup.className = `bottom-popup ${type}`;
        popup.innerHTML = text;
        
        // Style the popup
        popup.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#28a745'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 90vw;
            text-align: center;
            animation: slideUp 0.3s ease-out;
        `;
        
        // Add animation keyframes if not already added
        if (!document.querySelector('#popup-animations')) {
            const style = document.createElement('style');
            style.id = 'popup-animations';
            style.textContent = `
                @keyframes slideUp {
                    from {
                        transform: translateX(-50%) translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes slideDown {
                    from {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(-50%) translateY(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(popup);
        
        // Auto-remove with slide down animation
        setTimeout(() => {
            popup.style.animation = 'slideDown 0.3s ease-in';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 300);
        }, duration);
    }
}

// Global function for conjugation form pronunciation
function speakConjugation(text, pronoun) {
    if (window.audioManager) {
        window.audioManager.speak(text, 'lithuanian');
        // Visual feedback
        const card = document.querySelector(`[data-pronoun="${pronoun}"]`);
        if (card) {
            card.classList.add('speaking');
            setTimeout(() => card.classList.remove('speaking'), 2000);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new ConjugationApp();
});