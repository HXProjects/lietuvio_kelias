/**
 * Conjugation Page - Extends BasePage with conjugation-specific functionality
 */
class ConjugationPage extends BasePage {
    constructor() {
        super();
        this.conjugationData = null;
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
        this.learningMode = true; // true = learning mode, false = practice mode
        this.showAllAnswers = true; // Show answers by default in learning mode
    }

    /**
     * Initialize conjugation page specific functionality
     */
    async initializePage() {
        console.log('🔄 Initializing Conjugation Page...');

        // Initialize conjugation data
        await this.initializeConjugationData();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize UI
        this.initializeModeUI();
        await this.updateUI();

        console.log('✅ Conjugation Page initialized');
    }

    /**
     * Initialize conjugation data system
     */
    async initializeConjugationData() {
        try {
            if (window.ConjugationData) {
                this.conjugationData = new ConjugationData();
                await this.waitForTopicsToLoad();
                this.initializeTopicsUI();
            } else {
                throw new Error('ConjugationData class not available');
            }
        } catch (error) {
            console.error('Failed to initialize conjugation data:', error);
            this.showError('Failed to load conjugation data');
        }
    }

    /**
     * Wait for topics to load
     */
    async waitForTopicsToLoad() {
        console.log('Waiting for topics to load...');
        let attempts = 0;
        
        while (this.conjugationData.topics.length === 0 && this.conjugationData.isLoading) {
            attempts++;
            if (attempts % 10 === 0) {
                console.log(`Still waiting for topics... attempt ${attempts}`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (attempts > 50) {
                console.error('Timeout waiting for topics to load');
                break;
            }
        }
        
        console.log(`Topics loaded successfully. Available topics: ${this.conjugationData.topics.length}`);
    }

    /**
     * Initialize topics UI
     */
    initializeTopicsUI() {
        const topicFilters = document.getElementById('verb-topic-filters');
        const topics = this.conjugationData.getTopics();
        
        if (!topicFilters || topics.length === 0) {
            console.log('No topic filters element or no topics available');
            return;
        }

        topicFilters.innerHTML = topics.map(topic => `
            <button class="topic-btn" data-topic="${topic.id}">
                <i class="${topic.icon}"></i>
                ${topic.displayName}
            </button>
        `).join('');

        // Auto-select the first topic if available
        if (topics.length > 0) {
            this.switchToTopic(topics[0].id);
        }

        this.showTopicSelectionMessage();
    }

    /**
     * Setup page-specific event listeners
     */
    setupEventListeners() {
        // Call parent setup first
        this.setupCommonEventListeners();

        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMode(e.target.closest('.mode-btn').dataset.mode);
            });
        });

        // Mode toggle
        const modeToggle = document.getElementById('mode-toggle');
        if (modeToggle) {
            modeToggle.addEventListener('change', (e) => {
                this.toggleMode(e.target.checked);
            });
        }

        // Verb actions
        const newVerbBtn = document.getElementById('new-verb-btn');
        const showAllBtn = document.getElementById('show-all-btn');
        const pronounceBtn = document.getElementById('pronounce-btn');
        const changeTenseBtn = document.getElementById('change-tense-btn');

        if (newVerbBtn) newVerbBtn.onclick = () => this.loadNewVerb();
        if (showAllBtn) showAllBtn.onclick = () => this.toggleShowAll();
        if (pronounceBtn) pronounceBtn.onclick = () => this.pronounceVerb();
        if (changeTenseBtn) changeTenseBtn.onclick = () => this.openTenseModal();

        // Topic selection
        document.addEventListener('click', (event) => {
            const topicBtn = event.target.closest('.topic-btn');
            if (topicBtn) {
                const topicId = topicBtn.dataset.topic;
                this.switchToTopic(topicId);
            }
        });

        // Verb selection from list
        document.addEventListener('click', (event) => {
            const verbItem = event.target.closest('.verb-item');
            if (verbItem) {
                const infinitive = verbItem.dataset.infinitive;
                this.selectSpecificVerb(infinitive);
            }
        });

        // Conjugation checking
        document.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && event.target.classList.contains('conjugation-input')) {
                this.checkConjugation(event.target.dataset.pronoun);
            }
        });

        // Tense modal
        const closeTenseModal = document.getElementById('close-tense-modal');
        if (closeTenseModal) {
            closeTenseModal.onclick = () => this.closeTenseModal();
        }

        document.querySelectorAll('.tense-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeTense(e.target.dataset.tense);
                this.closeTenseModal();
            });
        });
    }

    /**
     * Switch to a specific topic
     */
    async switchToTopic(topicId) {
        try {
            console.log(`Switching to topic: ${topicId}`);
            
            const success = await this.conjugationData.switchToTopic(topicId);
            
            if (success) {
                // Update active topic button
                document.querySelectorAll('.topic-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.topic === topicId);
                });

                this.populateVerbList();
                this.gameStats.sessionProgress = 0;
                this.updateUI();
                this.loadNewVerb();
                
                this.showInfo(`Successfully switched to topic: ${topicId}`);
            } else {
                console.error(`Failed to switch to topic: ${topicId}`);
                this.showTopicSelectionMessage();
                this.hideVerbList();
            }
        } catch (error) {
            console.error('Error switching topic:', error);
            this.showError('Failed to switch topic');
        }
    }

    /**
     * Toggle between learning and practice modes
     */
    toggleMode(isPracticeMode) {
        this.learningMode = !isPracticeMode;
        
        const showAllBtn = document.getElementById('show-all-btn');
        if (this.learningMode) {
            if (showAllBtn) showAllBtn.style.display = 'none';
            this.showAllAnswers = true;
        } else {
            if (showAllBtn) showAllBtn.style.display = 'inline-flex';
            this.showAllAnswers = false;
        }
        
        this.renderConjugationGrid();
        
        const mode = this.learningMode ? 'Learning' : 'Practice';
        this.showInfo(`Switched to ${mode} Mode`);
    }

    /**
     * Load a new random verb
     */
    loadNewVerb() {
        console.log('Loading new verb...');
        const verb = this.conjugationData.getRandomVerb();
        
        if (!verb) {
            console.warn('No verb available to load');
            return;
        }
        
        this.updateVerbListSelection(verb.infinitive);
        
        if (!this.learningMode) {
            this.showAllAnswers = false;
        }
        
        this.updateVerbDisplay();
        this.renderConjugationGrid();
        this.updateStats();
        
        this.showInfo(`New verb: ${verb.infinitive} (${verb.english})`);
    }

    /**
     * Pronounce current verb
     */
    async pronounceVerb() {
        const verb = this.conjugationData.currentVerb;
        if (!verb) return;
        
        const pronounceBtn = document.getElementById('pronounce-btn');
        await this.pronounceText(verb.infinitive, 'lithuanian', pronounceBtn);
    }

    /**
     * Render conjugation grid
     */
    renderConjugationGrid() {
        const conjugations = this.conjugationData.getCurrentConjugations();
        const pronouns = this.conjugationData.getPronouns();
        const grid = document.getElementById('conjugation-grid');
        
        if (!conjugations || !grid) return;

        grid.innerHTML = pronouns.map(pronoun => {
            const conjugation = conjugations[pronoun];
            if (!conjugation) return '';

            return `
                <div class="conjugation-card" data-pronoun="${pronoun}">
                    <div class="pronoun-header">
                        <div class="pronoun-info">
                            <span class="pronoun">${pronoun}</span>
                            ${conjugation.stress ? `<span class="stress-pattern" title="Stress pattern">${conjugation.stress}</span>` : ''}
                        </div>
                        <button class="hint-btn" onclick="window.app.getCurrentPage().showHint('${pronoun}')" title="Show example">
                            <i class="fas fa-lightbulb"></i>
                        </button>
                    </div>
                    
                    <div class="conjugation-input-container">
                        ${this.learningMode ? 
                            `<div class="conjugation-display">
                                <span class="conjugation-form">${conjugation.form}</span>
                                <button class="play-btn" data-pronounce="${conjugation.form}" title="Listen to conjugation">
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
                            <button class="check-btn" onclick="window.app.getCurrentPage().checkConjugation('${pronoun}')" ${this.showAllAnswers ? 'style="display:none"' : ''}>
                                <i class="fas fa-check"></i>
                            </button>`
                        }
                    </div>
                    
                    <div class="example-container" style="display: ${this.learningMode ? 'block' : 'none'};">
                        <div class="example-sentence">
                            <span class="sentence-text">${conjugation.example}</span>
                            <button class="play-btn" data-pronounce="${conjugation.example}" title="Listen to pronunciation">
                                <i class="fas fa-play"></i>
                            </button>
                        </div>
                        <div class="example-translation">
                            <span class="sentence-text">${conjugation.translation}</span>
                        </div>
                    </div>
                    
                    <div class="feedback" style="display: none;"></div>
                </div>
            `;
        }).join('');

        // Add event listeners for inputs
        document.querySelectorAll('.conjugation-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const card = input.closest('.conjugation-card');
                const feedback = card.querySelector('.feedback');
                feedback.style.display = 'none';
                card.classList.remove('correct', 'incorrect');
            });
        });
    }

    /**
     * Check conjugation answer
     */
    checkConjugation(pronoun) {
        const input = document.querySelector(`input[data-pronoun="${pronoun}"]`);
        const answer = input.value.trim();
        const card = input.closest('.conjugation-card');
        const feedback = card.querySelector('.feedback');
        
        if (!answer) {
            this.showWarning('Please enter a conjugation!');
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
        const checkBtn = card.querySelector('.check-btn');
        if (checkBtn) checkBtn.style.display = 'none';
        
        this.updateStats();
        this.updateSessionProgress();
        
        if (isCorrect) {
            this.showSuccess('Excellent! 🎉');
        }
    }

    /**
     * Show/hide example for a pronoun
     */
    showHint(pronoun) {
        const card = document.querySelector(`[data-pronoun="${pronoun}"]`);
        const exampleContainer = card.querySelector('.example-container');
        
        if (exampleContainer.style.display === 'none') {
            exampleContainer.style.display = 'block';
        } else {
            exampleContainer.style.display = 'none';
        }
    }

    /**
     * Toggle show all answers
     */
    toggleShowAll() {
        this.showAllAnswers = !this.showAllAnswers;
        const btn = document.getElementById('show-all-btn');
        
        if (btn) {
            if (this.showAllAnswers) {
                btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide All';
                btn.classList.add('active');
            } else {
                btn.innerHTML = '<i class="fas fa-eye"></i> Show All';
                btn.classList.remove('active');
            }
        }
        
        this.renderConjugationGrid();
    }

    /**
     * Open tense selection modal
     */
    openTenseModal() {
        const modal = document.getElementById('tense-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Close tense selection modal
     */
    closeTenseModal() {
        const modal = document.getElementById('tense-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Change tense
     */
    changeTense(tense) {
        // Update active tense button
        document.querySelectorAll('.tense-option').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tense="${tense}"]`)?.classList.add('active');
        
        this.conjugationData.setTense(tense);
        this.updateVerbDisplay();
        this.renderConjugationGrid();
        
        const tenseInfo = this.conjugationData.getTenses().find(t => t.id === tense);
        this.showInfo(`Changed to ${tenseInfo.name} tense`);
    }

    /**
     * Update verb display
     */
    updateVerbDisplay() {
        const verb = this.conjugationData.currentVerb;
        if (!verb) return;

        const verbElement = document.getElementById('current-verb');
        const translationElement = document.getElementById('verb-translation');
        const tenseElement = document.getElementById('current-tense');

        if (verbElement) verbElement.textContent = verb.infinitive;
        
        if (translationElement) {
            let verbInfo = verb.english;
            if (verb.type) verbInfo += ` • ${verb.type}`;
            if (verb.transitivity) verbInfo += ` • ${verb.transitivity}`;
            
            translationElement.innerHTML = `
                <div class="verb-main-info">${verb.english}</div>
                <div class="verb-grammar-info">
                    <span class="grammar-tag">${verb.type}</span>
                    ${verb.conjugationGroup ? `<span class="grammar-tag conjugation-group">Group ${verb.conjugationGroup}</span>` : ''}
                    <span class="grammar-tag">${verb.transitivity}</span>
                </div>
            `;
        }
        
        if (tenseElement) {
            const tenseInfo = this.conjugationData.getTenses().find(t => t.id === this.conjugationData.currentTense);
            tenseElement.textContent = tenseInfo ? tenseInfo.name + ' Tense' : 'Present Tense';
        }
    }

    /**
     * Show topic selection message
     */
    showTopicSelectionMessage() {
        const verbElement = document.getElementById('current-verb');
        const translationElement = document.getElementById('verb-translation');
        const grid = document.getElementById('conjugation-grid');
        
        if (verbElement) verbElement.textContent = 'Select a topic to start';
        if (translationElement) translationElement.textContent = 'Choose a verb category from the sidebar';
        if (grid) grid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">Select a topic to practice verb conjugations</p>';
    }

    /**
     * Populate verb list
     */
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
        
        if (verbListTitle && currentTopic) {
            verbListTitle.textContent = `${currentTopic.displayName} (${verbs.length})`;
        }
        
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
        
        verbListSection.style.display = 'block';
    }

    /**
     * Hide verb list
     */
    hideVerbList() {
        const verbListSection = document.getElementById('verb-list-section');
        if (verbListSection) {
            verbListSection.style.display = 'none';
        }
    }

    /**
     * Select specific verb
     */
    selectSpecificVerb(infinitive) {
        const verb = this.conjugationData.findVerbByInfinitive(infinitive);
        if (verb) {
            this.conjugationData.setCurrentVerb(verb);
            this.updateVerbListSelection(infinitive);
            this.renderConjugationGrid();
            this.updateUI();
            console.log(`Selected verb: ${infinitive}`);
        }
    }

    /**
     * Update verb list selection
     */
    updateVerbListSelection(infinitive) {
        document.querySelectorAll('.verb-item').forEach(item => {
            item.classList.toggle('active', item.dataset.infinitive === infinitive);
        });
    }

    /**
     * Initialize mode UI
     */
    initializeModeUI() {
        const showAllBtn = document.getElementById('show-all-btn');
        if (this.learningMode) {
            if (showAllBtn) showAllBtn.style.display = 'none';
        } else {
            if (showAllBtn) showAllBtn.style.display = 'inline-flex';
        }
    }

    /**
     * Update game statistics
     */
    updateStats() {
        const scoreEl = document.getElementById('score');
        const streakEl = document.getElementById('streak');
        const levelEl = document.getElementById('level');
        const accuracyEl = document.getElementById('accuracy');

        if (scoreEl) scoreEl.textContent = this.gameStats.score;
        if (streakEl) streakEl.textContent = this.gameStats.streak;
        if (levelEl) levelEl.textContent = this.gameStats.level;
        
        if (accuracyEl) {
            const accuracy = this.gameStats.totalAnswers > 0 
                ? Math.round((this.gameStats.correctAnswers / this.gameStats.totalAnswers) * 100)
                : 100;
            accuracyEl.textContent = accuracy + '%';
        }
        
        this.gameStats.level = Math.floor(this.gameStats.score / 100) + 1;
    }

    /**
     * Update session progress
     */
    updateSessionProgress() {
        this.gameStats.sessionProgress = Math.min(this.gameStats.totalAnswers, this.gameStats.sessionTarget);
        const percentage = (this.gameStats.sessionProgress / this.gameStats.sessionTarget) * 100;
        
        const progressFill = document.getElementById('progress-fill');
        const progressCurrent = document.getElementById('progress-current');
        const progressTotal = document.getElementById('progress-total');

        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressCurrent) progressCurrent.textContent = this.gameStats.sessionProgress;
        if (progressTotal) progressTotal.textContent = this.gameStats.sessionTarget;
        
        if (this.gameStats.sessionProgress >= this.gameStats.sessionTarget) {
            this.showSuccess('🎉 Session complete! Great job!');
            setTimeout(() => {
                this.gameStats.sessionProgress = 0;
                this.gameStats.sessionTarget += 5;
                this.updateSessionProgress();
            }, 3000);
        }
    }

    /**
     * Update UI
     */
    updateUI() {
        this.updateStats();
        this.updateSessionProgress();
    }
}

// Global function for conjugation form pronunciation (backward compatibility)
window.speakConjugation = function(text, pronoun) {
    if (window.app && window.app.getCurrentPage()) {
        const page = window.app.getCurrentPage();
        page.pronounceText(text, 'lithuanian');
        
        // Visual feedback
        const card = document.querySelector(`[data-pronoun="${pronoun}"]`);
        if (card) {
            card.classList.add('speaking');
            setTimeout(() => card.classList.remove('speaking'), 2000);
        }
    }
};

// Make available globally
window.ConjugationPage = ConjugationPage;