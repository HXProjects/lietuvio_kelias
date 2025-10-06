// Main Application Logic
class VocabularyApp {
    constructor() {
        this.vocabularyData = new VocabularyData();
        this.srsSystem = new SRSSystem();
        this.currentFlashcardIndex = 0;
        this.flashcards = [];
        this.isFlashcardFlipped = false;
        this.currentQuiz = null;
        this.studySession = {
            active: false,
            startTime: null,
            results: []
        };
        this.selectedTopic = 'all';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadInitialData();
        this.updateUI();
        this.setupTextToSpeech();
    }

    setupEventListeners() {
        // Tab navigation
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.closest('.tab-button').dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Add word modal
        const addWordBtn = document.getElementById('add-word-btn');
        const addWordModal = document.getElementById('add-word-modal');
        const closeModal = document.getElementById('close-modal');
        const cancelAdd = document.getElementById('cancel-add');
        const addWordForm = document.getElementById('add-word-form');

        addWordBtn.addEventListener('click', () => this.openAddWordModal());
        closeModal.addEventListener('click', () => this.closeAddWordModal());
        cancelAdd.addEventListener('click', () => this.closeAddWordModal());
        addWordForm.addEventListener('submit', (e) => this.handleAddWord(e));

        // TTS Settings
        const ttsSettingsBtn = document.getElementById('tts-settings-btn');
        if (ttsSettingsBtn) {
            ttsSettingsBtn.addEventListener('click', () => this.openTTSSettings());
        }

        // Practice button
        const practiceBtn = document.getElementById('practice-btn');
        practiceBtn.addEventListener('click', () => this.startPracticeSession());

        // Flashcard controls
        const flipBtn = document.getElementById('flip-card');
        const prevBtn = document.getElementById('prev-card');
        const nextBtn = document.getElementById('next-card');
        const shuffleBtn = document.getElementById('shuffle-btn');
        const pronounceBtn = document.getElementById('pronounce-btn');

        if (flipBtn) flipBtn.addEventListener('click', () => this.flipFlashcard());
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousFlashcard());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextFlashcard());
        if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.shuffleFlashcards());
        if (pronounceBtn) pronounceBtn.addEventListener('click', () => this.pronounceWord());
        
        // Example pronunciation button
        const pronounceExampleBtn = document.getElementById('pronounce-example-btn');
        if (pronounceExampleBtn) pronounceExampleBtn.addEventListener('click', () => this.pronounceExample());

        // Difficulty feedback buttons
        const feedbackBtns = document.querySelectorAll('.feedback-btn');
        feedbackBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const difficulty = parseInt(e.target.closest('.feedback-btn').dataset.difficulty);
                this.handleFeedback(difficulty);
            });
        });

        // Quiz controls
        const startQuizBtn = document.getElementById('start-quiz-btn');
        if (startQuizBtn) startQuizBtn.addEventListener('click', () => this.startQuiz());

        // Topic filtering
        const topicBtns = document.querySelectorAll('.topic-btn');
        topicBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const topic = e.target.closest('.topic-btn').dataset.topic;
                this.filterByTopic(topic);
            });
        });

        // Close modal on background click
        addWordModal.addEventListener('click', (e) => {
            if (e.target === addWordModal) {
                this.closeAddWordModal();
            }
        });
    }

    async setupTextToSpeech() {
        // Initialize Lithuanian TTS client with fallback URL
        this.ttsClient = new LithuanianTTSClient('http://localhost:3001', 'http://localhost:8080');
        this.ttsServerAvailable = false;
        
        try {
            // Check if any TTS server is available (primary or fallback)
            this.ttsServerAvailable = await this.ttsClient.isServerAvailable();
            
            if (this.ttsServerAvailable) {
                console.log('✅ TTS system available (server or fallback)');
            } else {
                console.warn('⚠️ No TTS servers available, will use browser fallback only');
            }
        } catch (error) {
            console.warn('TTS server check failed:', error);
            this.ttsServerAvailable = false;
        }
        
        // Initialize browser TTS fallback
        if ('speechSynthesis' in window) {
            this.tts = window.speechSynthesis;
            this.ttsVoice = null;
            this.ttsAvailable = false;
            
            // Function to find Lithuanian voice for fallback
            const findLithuanianVoice = () => {
                const voices = this.tts.getVoices();
                console.log('Available fallback voices:', voices.map(v => `${v.name} (${v.lang})`));
                
                // Look for Lithuanian voices in order of preference
                const lithuanianVoice = voices.find(voice => 
                    voice.lang === 'lt-LT' || 
                    voice.lang === 'lt' || 
                    voice.name.toLowerCase().includes('lithuanian') ||
                    voice.name.toLowerCase().includes('lietuv')
                );
                
                if (lithuanianVoice) {
                    this.ttsVoice = lithuanianVoice;
                    this.ttsAvailable = true;
                    console.log('Lithuanian fallback voice found:', lithuanianVoice.name);
                } else {
                    // Fallback to English or first available voice for demo
                    const fallbackVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
                    if (fallbackVoice) {
                        this.ttsVoice = fallbackVoice;
                        this.ttsAvailable = false; // Mark as not truly Lithuanian
                        console.log('No Lithuanian voice found. Using fallback:', fallbackVoice.name);
                    }
                }
            };
            
            // Try immediately and on voice change
            findLithuanianVoice();
            this.tts.onvoiceschanged = findLithuanianVoice;
            
            // Also try after a short delay (some browsers load voices asynchronously)
            setTimeout(findLithuanianVoice, 100);
        } else {
            console.warn('Browser does not support speech synthesis');
        }
    }

    async loadInitialData() {
        // Wait for vocabulary data to be loaded from JSON files
        await this.vocabularyData.initializeSampleData();
        
        // Update sidebar with dynamically loaded topics
        await this.updateTopicsSidebar();
        
        // Populate topic dropdown in Add Word modal
        await this.populateTopicDropdown();
        
        this.flashcards = this.vocabularyData.getRandomWords();
        await this.updateWordList();
        this.updateFlashcard();
        this.updateProgress();
    }

    async updateUI() {
        await this.updateWordList();
        this.updateFlashcard();
        this.updateProgress();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Load specific content if needed
        if (tabName === 'flashcards') {
            this.refreshFlashcards();
        } else if (tabName === 'progress') {
            this.updateProgress();
        }
    }

    openAddWordModal() {
        document.getElementById('add-word-modal').classList.add('active');
    }

    closeAddWordModal() {
        document.getElementById('add-word-modal').classList.remove('active');
        document.getElementById('add-word-form').reset();
    }

    async handleAddWord(e) {
        e.preventDefault();
        
        const wordData = {
            lithuanian: document.getElementById('lithuanian-word').value.trim(),
            english: document.getElementById('english-translation').value.trim(),
            partOfSpeech: document.getElementById('part-of-speech').value,
            exampleSentence: document.getElementById('example-sentence').value.trim(),
            sentenceTranslation: document.getElementById('sentence-translation').value.trim(),
            difficulty: document.getElementById('difficulty').value,
            tags: [document.getElementById('topic').value]
        };

        // Validate required fields
        if (!wordData.lithuanian || !wordData.english) {
            this.showMessage('Please fill in both Lithuanian word and English translation.', 'error');
            return;
        }

        try {
            this.vocabularyData.addWord(wordData);
            this.closeAddWordModal();
            await this.updateUI();
            this.showMessage('Word added successfully!', 'success');
        } catch (error) {
            this.showMessage('Error adding word. Please try again.', 'error');
        }
    }

    async updateWordList() {
        const wordList = document.getElementById('word-list');
        let words = this.vocabularyData.getAllWords();
        
        console.log(`🔍 Debug: Total words before filtering: ${words.length}`);
        console.log(`🔍 Debug: Selected topic: ${this.selectedTopic}`);
        
        // Filter by selected topic
        if (this.selectedTopic !== 'all') {
            const wordsBeforeFilter = words.length;
            words = words.filter(word => word.tags.includes(this.selectedTopic));
            console.log(`🔍 Debug: Words after filtering by '${this.selectedTopic}': ${words.length} (from ${wordsBeforeFilter})`);
            
            if (words.length === 0) {
                console.log(`🔍 Debug: No words found for topic '${this.selectedTopic}'. Available tags in data:`, 
                    [...new Set(this.vocabularyData.getAllWords().flatMap(w => w.tags))].sort());
            }
        }

        if (words.length === 0) {
            const topicDisplayName = await this.getTopicDisplayName(this.selectedTopic);
            const message = this.selectedTopic === 'all' 
                ? 'No phrases yet' 
                : `No phrases in "${topicDisplayName}" category`;
            
            wordList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>${message}</h3>
                    <p>Add some Lithuanian phrases to get started!</p>
                </div>
            `;
            await this.updateTopicStats(words);
            return;
        }

        // Calculate pagination
        const totalPages = Math.ceil(words.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedWords = words.slice(startIndex, endIndex);

        console.log(`📊 Displaying ${paginatedWords.length} of ${words.length} words for topic "${this.selectedTopic}" (page ${this.currentPage}/${totalPages})`);
        
        wordList.innerHTML = paginatedWords.map(word => `
            <div class="word-card" data-word-id="${word.id}">
                <div class="word-header">
                    <div class="word-main">
                        <h3 class="lithuanian-word">${word.lithuanian}</h3>
                        <p class="english-translation">${word.english}</p>
                    </div>
                    <span class="part-of-speech">${word.partOfSpeech}</span>
                </div>
                
                ${word.exampleSentence ? `
                    <div class="word-example">
                        <div class="example-sentence-container">
                            <p class="example-sentence">${word.exampleSentence}</p>
                            <button class="example-pronunciation-btn" onclick="app.pronounceSpecificWord('${word.exampleSentence.replace(/'/g, "\\'")}')" title="Listen to example pronunciation">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                        <p class="example-translation">${word.sentenceTranslation}</p>
                    </div>
                ` : ''}
                
                <div class="word-actions">
                    <button class="btn btn-primary pronunciation-btn" onclick="app.pronounceSpecificWord('${word.lithuanian}')" title="Play Lithuanian pronunciation">
                        <i class="fas fa-volume-up"></i>
                        🔊</button>
                    <button class="btn btn-secondary" onclick="app.editWord('${word.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-secondary" onclick="app.deleteWord('${word.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
                
                <div class="word-stats">
                    <small>Level: ${word.srsData.level}/10 | Reviews: ${word.srsData.totalReviews} | 
                    Success: ${word.srsData.totalReviews > 0 ? Math.round((word.srsData.correctAnswers / word.srsData.totalReviews) * 100) : 0}%</small>
                </div>
            </div>
        `).join('');
        
        // Add pagination controls
        this.addPaginationControls(wordList, words.length, totalPages);
        
        await this.updateTopicStats(words);
    }
    
    async filterByTopic(topic) {
        this.selectedTopic = topic;
        this.currentPage = 1; // Reset to first page when changing topics
        
        // Update active topic button
        document.querySelectorAll('.topic-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-topic="${topic}"]`).classList.add('active');
        
        // Update word list
        await this.updateWordList();
    }
    
    async getTopicDisplayName(topicId) {
        if (topicId === 'all') return 'All Phrases';
        
        try {
            const availableTopics = await this.vocabularyData.getAvailableTopics();
            const topic = availableTopics.find(t => t.id === topicId);
            return topic ? topic.name : (topicId.charAt(0).toUpperCase() + topicId.slice(1));
        } catch (error) {
            console.warn('Failed to get topic display name:', error);
            // Return capitalized version of topicId as fallback
            return topicId.charAt(0).toUpperCase() + topicId.slice(1);
        }
    }
    
    addPaginationControls(container, totalItems, totalPages) {
        if (totalPages <= 1) return; // No pagination needed
        
        const paginationHTML = `
            <div class="pagination-container">
                <div class="pagination-info">
                    Showing ${(this.currentPage - 1) * this.itemsPerPage + 1}-${Math.min(this.currentPage * this.itemsPerPage, totalItems)} of ${totalItems} phrases
                </div>
                <div class="pagination-controls">
                    <button class="btn btn-secondary pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="app.changePage(${this.currentPage - 1})">
                        <i class="fas fa-chevron-left"></i> Previous
                    </button>
                    <div class="pagination-numbers">
                        ${this.generatePageNumbers(totalPages)}
                    </div>
                    <button class="btn btn-secondary pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="app.changePage(${this.currentPage + 1})">
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', paginationHTML);
    }
    
    generatePageNumbers(totalPages) {
        let pageNumbers = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Add first page and ellipsis if needed
        if (startPage > 1) {
            pageNumbers += `<button class="btn btn-secondary pagination-number" onclick="app.changePage(1)">1</button>`;
            if (startPage > 2) {
                pageNumbers += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // Add visible page numbers
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage ? 'active' : '';
            pageNumbers += `<button class="btn btn-secondary pagination-number ${isActive}" onclick="app.changePage(${i})">${i}</button>`;
        }
        
        // Add last page and ellipsis if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers += `<span class="pagination-ellipsis">...</span>`;
            }
            pageNumbers += `<button class="btn btn-secondary pagination-number" onclick="app.changePage(${totalPages})">${totalPages}</button>`;
        }
        
        return pageNumbers;
    }
    
    async changePage(page) {
        this.currentPage = page;
        await this.updateWordList();
        // Scroll to top of word list
        document.getElementById('word-list').scrollIntoView({ behavior: 'smooth' });
    }

    async updateTopicStats(filteredWords) {
        try {
            const topicName = await this.getTopicDisplayName(this.selectedTopic);
            const masteredCount = filteredWords.filter(w => w.srsData.level >= 8).length;
            
            document.getElementById('selected-topic-name').textContent = topicName;
            document.getElementById('topic-count').textContent = `${filteredWords.length} phrases`;
            document.getElementById('topic-mastered').textContent = `${masteredCount} mastered`;
        } catch (error) {
            console.error('Failed to update topic stats:', error);
            // Fallback to basic display
            document.getElementById('selected-topic-name').textContent = this.selectedTopic === 'all' ? 'All Phrases' : this.selectedTopic;
            document.getElementById('topic-count').textContent = `${filteredWords.length} phrases`;
            document.getElementById('topic-mastered').textContent = `${filteredWords.filter(w => w.srsData.level >= 8).length} mastered`;
        }
    }
    
    // Update topics sidebar with dynamically loaded topics
    async updateTopicsSidebar() {
        try {
            const availableTopics = await this.vocabularyData.getAvailableTopics();
            const topicFilters = document.getElementById('topic-filters');
            
            if (!topicFilters) return;
            
            // Clear existing content
            topicFilters.innerHTML = '';
            
            // Add "All Phrases" button first
            const allButton = document.createElement('button');
            allButton.className = 'topic-btn active';
            allButton.setAttribute('data-topic', 'all');
            allButton.innerHTML = `
                <i class="fas fa-globe"></i>
                All Phrases
            `;
            allButton.addEventListener('click', (e) => {
                this.filterByTopic('all');
            });
            topicFilters.appendChild(allButton);
            
            // Add dynamically loaded topics from config.json
            availableTopics.forEach(topic => {
                const button = document.createElement('button');
                button.className = 'topic-btn';
                button.setAttribute('data-topic', topic.id);
                button.innerHTML = `
                    <i class="${topic.icon}"></i>
                    ${topic.name}
                `;
                
                // Add click event listener
                button.addEventListener('click', (e) => {
                    this.filterByTopic(topic.id);
                });
                
                topicFilters.appendChild(button);
            });
            
            console.log(`✅ Updated sidebar with ${availableTopics.length} topics from config.json`);
            
        } catch (error) {
            console.error('Failed to update topics sidebar:', error);
        }
    }

    async populateTopicDropdown() {
        try {
            const availableTopics = await this.vocabularyData.getAvailableTopics();
            const topicSelect = document.getElementById('topic');
            
            if (!topicSelect) return;
            
            // Clear existing options
            topicSelect.innerHTML = '';
            
            // Add options for each topic from config.json
            availableTopics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic.id;
                option.textContent = topic.name;
                topicSelect.appendChild(option);
            });
            
            console.log(`✅ Populated topic dropdown with ${availableTopics.length} topics from config.json`);
            
        } catch (error) {
            console.error('Failed to populate topic dropdown:', error);
        }
    }

    refreshFlashcards() {
        this.flashcards = this.vocabularyData.getRandomWords();
        this.currentFlashcardIndex = 0;
        this.updateFlashcard();
    }

    updateFlashcard() {
        if (this.flashcards.length === 0) {
            document.getElementById('flashcard-container').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-layer-group" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>No flashcards available</h3>
                    <p>Add some vocabulary words to start practicing!</p>
                </div>
            `;
            return;
        }

        const currentWord = this.flashcards[this.currentFlashcardIndex];
        if (!currentWord) return;

        // Update card content
        document.getElementById('card-lithuanian').textContent = currentWord.lithuanian;
        document.getElementById('card-pos').textContent = currentWord.partOfSpeech;
        document.getElementById('card-translation').textContent = currentWord.english;
        document.getElementById('card-example').textContent = currentWord.exampleSentence || 'No example available';
        document.getElementById('card-example-translation').textContent = currentWord.sentenceTranslation || '';

        // Update counter
        document.getElementById('card-counter').textContent = `${this.currentFlashcardIndex + 1} of ${this.flashcards.length}`;

        // Reset flip state
        document.getElementById('flashcard').classList.remove('flipped');
        this.isFlashcardFlipped = false;
    }

    flipFlashcard() {
        const flashcard = document.getElementById('flashcard');
        flashcard.classList.toggle('flipped');
        this.isFlashcardFlipped = !this.isFlashcardFlipped;
    }

    nextFlashcard() {
        if (this.currentFlashcardIndex < this.flashcards.length - 1) {
            this.currentFlashcardIndex++;
        } else {
            this.currentFlashcardIndex = 0; // Loop back to first card
        }
        this.updateFlashcard();
    }

    previousFlashcard() {
        if (this.currentFlashcardIndex > 0) {
            this.currentFlashcardIndex--;
        } else {
            this.currentFlashcardIndex = this.flashcards.length - 1; // Loop to last card
        }
        this.updateFlashcard();
    }

    shuffleFlashcards() {
        this.flashcards = this.vocabularyData.getRandomWords();
        this.currentFlashcardIndex = 0;
        this.updateFlashcard();
        this.showMessage('Flashcards shuffled!', 'info');
    }

    pronounceWord() {
        const currentWord = this.flashcards[this.currentFlashcardIndex];
        if (currentWord) {
            this.pronounceSpecificWord(currentWord.lithuanian);
        }
    }

    pronounceExample() {
        const currentWord = this.flashcards[this.currentFlashcardIndex];
        if (currentWord && currentWord.exampleSentence) {
            this.pronounceSpecificWord(currentWord.exampleSentence);
        }
    }

    async pronounceSpecificWord(word) {
        // Find the button that was clicked for visual feedback
        const buttons = document.querySelectorAll('.pronunciation-btn, .example-pronunciation-btn');
        let activeButton = null;
        
        // Check if it's the main word pronunciation button
        const pronounceBtn = document.getElementById('pronounce-btn');
        const pronounceExampleBtn = document.getElementById('pronounce-example-btn');
        
        const currentWord = this.flashcards[this.currentFlashcardIndex];
        if (currentWord) {
            if (word === currentWord.lithuanian) {
                activeButton = pronounceBtn;
            } else if (word === currentWord.exampleSentence) {
                activeButton = pronounceExampleBtn;
            }
        }
        
        // Fallback: Find the button for this specific word in word list
        if (!activeButton) {
            buttons.forEach(btn => {
                if (btn.onclick && btn.onclick.toString().includes(word)) {
                    activeButton = btn;
                }
            });
        }

        try {
            // Add visual feedback
            if (activeButton) {
                activeButton.classList.add('playing');
                if (activeButton.classList.contains('example-pronunciation-btn')) {
                    activeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                } else {
                    activeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Playing...';
                }
            }

            // Always try TTS client first (it has smart cache-first fallback)
            if (this.ttsClient) {
                try {
                    await this.ttsClient.speak(word);
                    console.log('🔊 Pronounced with TTS client (cache or server):', word);
                    // Don't show success popup for normal pronunciation - too noisy
                } catch (error) {
                    console.warn('TTS Client failed:', error);
                    // Show specific error message as bottom popup
                    this.showBottomPopup(`🔊 ${error.message}`, 'error');
                }
            } else {
                // No TTS client available
                this.showBottomPopup('❌ Audio is not available right now', 'error');
            }
        } catch (error) {
            console.error('TTS Error:', error);
            this.showBottomPopup('🔊 Audio is not available right now. Please try again later.', 'error');
            // Don't call fallback TTS - just show error message
        } finally {
            // Restore button state after a delay
            setTimeout(() => {
                if (activeButton) {
                    activeButton.classList.remove('playing');
                    if (activeButton.classList.contains('example-pronunciation-btn')) {
                        activeButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                    } else {
                        activeButton.innerHTML = '<i class="fas fa-volume-up"></i> 🔊';
                    }
                }
            }, 2000);
        }
    }

    pronounceWithFallbackTTS(word) {
        if (this.tts && this.ttsVoice) {
            // Stop any ongoing speech
            this.tts.cancel();
            
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.voice = this.ttsVoice;
            utterance.rate = 0.7; // Slower for learning
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            
            // Set language explicitly if we have Lithuanian voice
            if (this.ttsAvailable) {
                utterance.lang = 'lt-LT';
            }
            
            utterance.onerror = (event) => {
                console.log('Speech synthesis error:', event.error);
                this.showMessage('Pronunciation error occurred', 'error');
            };
            
            utterance.onstart = () => {
                console.log('🔊 Speaking (fallback):', word);
            };
            
            this.tts.speak(utterance);
            
            // Show warning if not using Lithuanian voice
            if (!this.ttsAvailable) {
                this.showMessage('Note: Lithuanian voice not available, using fallback pronunciation', 'info');
            }
        } else {
            this.showMessage('Text-to-speech not supported in this browser', 'error');
        }
    }

    handleFeedback(difficulty) {
        if (this.flashcards.length === 0) return;
        
        const currentWord = this.flashcards[this.currentFlashcardIndex];
        const correct = difficulty > 1; // Consider medium and easy as correct
        
        // Update SRS data
        this.vocabularyData.updateWordSRS(currentWord.id, correct);
        
        // Record session data
        if (this.studySession.active) {
            this.studySession.results.push({
                wordId: currentWord.id,
                correct: correct,
                userRating: difficulty,
                timestamp: new Date().toISOString()
            });
        }
        
        // Move to next card
        this.nextFlashcard();
        this.updateProgress();
        
        // Provide feedback
        const messages = {
            1: 'Keep practicing! This word will show up more frequently.',
            2: 'Good progress! This word will appear again soon.',
            3: 'Excellent! This word will be reviewed less frequently.'
        };
        
        this.showMessage(messages[difficulty], 'info');
    }

    startPracticeSession() {
        const dueWords = this.vocabularyData.getWordsForReview();
        
        if (dueWords.length === 0) {
            this.showMessage('No words due for review! Try adding new words or come back later.', 'info');
            return;
        }

        this.studySession = {
            active: true,
            startTime: new Date(),
            results: []
        };

        this.flashcards = dueWords.slice(0, 20); // Limit to 20 words per session
        this.currentFlashcardIndex = 0;
        this.switchTab('flashcards');
        this.updateFlashcard();
        
        this.showMessage(`Practice session started! ${this.flashcards.length} words to review.`, 'success');
    }

    startQuiz() {
        const words = this.vocabularyData.getRandomWords(10);
        if (words.length < 4) {
            this.showMessage('You need at least 4 words to start a quiz!', 'error');
            return;
        }

        this.currentQuiz = {
            words: words,
            currentIndex: 0,
            score: 0,
            answers: []
        };

        this.showQuizQuestion();
    }

    showQuizQuestion() {
        if (!this.currentQuiz) return;

        const quiz = this.currentQuiz;
        const currentWord = quiz.words[quiz.currentIndex];
        const container = document.getElementById('quiz-container');

        // Generate wrong answers
        const allWords = this.vocabularyData.getAllWords();
        const wrongAnswers = allWords
            .filter(w => w.id !== currentWord.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        const options = [currentWord, ...wrongAnswers]
            .sort(() => 0.5 - Math.random())
            .map(word => word.english);

        container.innerHTML = `
            <div class="quiz-question">
                <h3>Question ${quiz.currentIndex + 1} of ${quiz.words.length}</h3>
                <p>What does "<strong>${currentWord.lithuanian}</strong>" mean?</p>
                <div class="quiz-options">
                    ${options.map(option => `
                        <div class="quiz-option" onclick="app.selectQuizAnswer('${option}', '${currentWord.english}')">
                            ${option}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    selectQuizAnswer(selected, correct) {
        const quiz = this.currentQuiz;
        const isCorrect = selected === correct;
        
        if (isCorrect) {
            quiz.score++;
        }
        
        quiz.answers.push({
            question: quiz.words[quiz.currentIndex].lithuanian,
            selected: selected,
            correct: correct,
            isCorrect: isCorrect
        });

        // Visual feedback
        const options = document.querySelectorAll('.quiz-option');
        options.forEach(option => {
            if (option.textContent.trim() === selected) {
                option.classList.add(isCorrect ? 'correct' : 'incorrect');
            } else if (option.textContent.trim() === correct) {
                option.classList.add('correct');
            }
            option.style.pointerEvents = 'none';
        });

        // Move to next question after delay
        setTimeout(() => {
            quiz.currentIndex++;
            if (quiz.currentIndex < quiz.words.length) {
                this.showQuizQuestion();
            } else {
                this.showQuizResults();
            }
        }, 1500);
    }

    showQuizResults() {
        const quiz = this.currentQuiz;
        const percentage = Math.round((quiz.score / quiz.words.length) * 100);
        const container = document.getElementById('quiz-container');

        container.innerHTML = `
            <div class="quiz-results">
                <h3>Quiz Complete!</h3>
                <div class="score-display">
                    <div class="score-circle">
                        <span class="score-percentage">${percentage}%</span>
                        <span class="score-fraction">${quiz.score}/${quiz.words.length}</span>
                    </div>
                </div>
                <div class="quiz-actions">
                    <button class="btn btn-primary" onclick="app.startQuiz()">
                        <i class="fas fa-redo"></i>
                        Try Again
                    </button>
                    <button class="btn btn-secondary" onclick="app.reviewQuizAnswers()">
                        <i class="fas fa-list"></i>
                        Review Answers
                    </button>
                </div>
            </div>
        `;

        // Update progress based on quiz performance
        quiz.answers.forEach(answer => {
            const word = quiz.words.find(w => w.lithuanian === answer.question);
            if (word) {
                this.vocabularyData.updateWordSRS(word.id, answer.isCorrect);
            }
        });
    }

    reviewQuizAnswers() {
        // Implementation for reviewing quiz answers
        const quiz = this.currentQuiz;
        const container = document.getElementById('quiz-container');
        
        container.innerHTML = `
            <div class="quiz-review">
                <h3>Review Your Answers</h3>
                ${quiz.answers.map(answer => `
                    <div class="answer-review ${answer.isCorrect ? 'correct' : 'incorrect'}">
                        <div class="question">${answer.question}</div>
                        <div class="your-answer">Your answer: ${answer.selected}</div>
                        ${!answer.isCorrect ? `<div class="correct-answer">Correct answer: ${answer.correct}</div>` : ''}
                    </div>
                `).join('')}
                <button class="btn btn-primary" onclick="app.startQuiz()">
                    <i class="fas fa-redo"></i>
                    New Quiz
                </button>
            </div>
        `;
    }

    updateProgress() {
        const stats = this.vocabularyData.getStatistics();
        const srsStats = this.srsSystem.generateStats(this.vocabularyData.getAllWords());

        document.getElementById('total-words').textContent = stats.totalWords;
        document.getElementById('mastered-words').textContent = stats.masteredWords;
        document.getElementById('study-time').textContent = this.getStudyTime();
        document.getElementById('streak-days').textContent = srsStats.streakDays;
    }

    getStudyTime() {
        const sessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
        const totalMinutes = sessions.reduce((sum, session) => sum + (session.sessionDuration / 60), 0);
        return Math.round(totalMinutes);
    }

    editWord(wordId) {
        // Implementation for editing words
        this.showMessage('Edit functionality coming soon!', 'info');
    }

    async deleteWord(wordId) {
        if (confirm('Are you sure you want to delete this word?')) {
            this.vocabularyData.deleteWord(wordId);
            await this.updateUI();
            this.showMessage('Word deleted successfully!', 'success');
        }
    }

    showMessage(text, type = 'info') {
        // Create and show a temporary message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
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

    // TTS Settings Methods
    openTTSSettings() {
        this.updateTTSSettingsModal();
        document.getElementById('tts-settings-modal').classList.add('active');
    }

    closeTTSSettings() {
        document.getElementById('tts-settings-modal').classList.remove('active');
    }

    async updateTTSSettingsModal() {
        try {
            // Check server status
            const isServerRunning = this.ttsServerAvailable;
            const serverStatusText = document.getElementById('server-status-text');
            const serverInfo = document.getElementById('server-info');
            const serverInstructions = document.getElementById('server-instructions');
            
            if (serverStatusText) {
                if (isServerRunning) {
                    serverStatusText.innerHTML = '<span style="color: var(--lt-green)">✅ TTS Server is running</span>';
                    if (serverInfo) serverInfo.style.display = 'block';
                    if (serverInstructions) serverInstructions.style.display = 'none';
                } else {
                    serverStatusText.innerHTML = '<span style="color: var(--lt-red)">❌ TTS Server not available</span>';
                    if (serverInfo) serverInfo.style.display = 'none';
                    if (serverInstructions) serverInstructions.style.display = 'block';
                }
            }

            // Setup event listeners
            this.setupTTSSettingsListeners();
            
        } catch (error) {
            console.warn('Error updating TTS settings:', error);
        }
    }

    setupTTSSettingsListeners() {
        try {
            // Close modal
            const closeBtn = document.getElementById('close-tts-modal');
            if (closeBtn) {
                closeBtn.onclick = () => this.closeTTSSettings();
            }

            // Server status check
            const checkServerBtn = document.getElementById('check-server');
            if (checkServerBtn) {
                checkServerBtn.onclick = async () => {
                    checkServerBtn.disabled = true;
                    checkServerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                    
                    try {
                        this.ttsServerAvailable = await this.ttsClient.isServerAvailable();
                        this.updateTTSSettingsModal();
                    } finally {
                        checkServerBtn.disabled = false;
                        checkServerBtn.innerHTML = '<i class="fas fa-refresh"></i> Check Server';
                    }
                };
            }

            // Batch generation buttons
            const generateCurrentBtn = document.getElementById('generate-current-topic');
            if (generateCurrentBtn) {
                generateCurrentBtn.onclick = () => this.generateCurrentTopicAudio();
            }

            const generateAllBtn = document.getElementById('generate-all-topics');
            if (generateAllBtn) {
                generateAllBtn.onclick = () => this.generateAllTopicsAudio();
            }

            // Test TTS buttons
            const testBtn = document.getElementById('test-tts');
            if (testBtn) {
                testBtn.onclick = () => {
                    const text = document.getElementById('test-text')?.value || 'Labas rytas! Kaip sekasi?';
                    this.pronounceSpecificWord(text);
                };
            }

            const testEnBtn = document.getElementById('test-tts-en');
            if (testEnBtn) {
                testEnBtn.onclick = () => {
                    const text = document.getElementById('test-text')?.value || 'Hello! How are you?';
                    this.pronounceWithFallbackTTS(text);
                };
            }

            // Cache stats
            const showStatsBtn = document.getElementById('show-cache-stats');
            if (showStatsBtn) {
                showStatsBtn.onclick = () => this.showCacheStats();
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

    async generateCurrentTopicAudio() {
        if (!this.ttsServerAvailable) {
            this.showMessage('TTS server is not available', 'error');
            return;
        }

        try {
            // Get current topic words
            const currentWords = this.flashcards.map(card => card.lithuanian);
            
            if (currentWords.length === 0) {
                this.showMessage('No words to generate audio for', 'warning');
                return;
            }

            this.showBatchProgress(true);
            const result = await this.ttsClient.generateBatch(currentWords);
            
            this.showMessage(`Generated audio for ${result.generated} new words, ${result.cached} were already cached`, 'success');
            this.showBatchProgress(false);
            
        } catch (error) {
            console.error('Batch generation error:', error);
            this.showMessage('Error generating batch audio', 'error');
            this.showBatchProgress(false);
        }
    }

    async generateAllTopicsAudio() {
        if (!this.ttsServerAvailable) {
            this.showMessage('TTS server is not available', 'error');
            return;
        }

        try {
            // Get all vocabulary words
            const allWords = [];
            const allData = await this.vocabularyData.getAllVocabulary();
            
            Object.values(allData).forEach(topicData => {
                if (topicData.vocabulary) {
                    topicData.vocabulary.forEach(item => {
                        allWords.push(item.lithuanian);
                    });
                }
            });

            if (allWords.length === 0) {
                this.showMessage('No words found to generate audio for', 'warning');
                return;
            }

            this.showBatchProgress(true);
            const result = await this.ttsClient.generateBatch(allWords);
            
            this.showMessage(`Generated audio for ${result.generated} new words, ${result.cached} were already cached (Total: ${result.total})`, 'success');
            this.showBatchProgress(false);
            
        } catch (error) {
            console.error('Batch generation error:', error);
            this.showMessage('Error generating batch audio', 'error');
            this.showBatchProgress(false);
        }
    }

    showBatchProgress(show) {
        const progressDiv = document.getElementById('batch-progress');
        if (progressDiv) {
            progressDiv.style.display = show ? 'block' : 'none';
        }
    }

    async showCacheStats() {
        try {
            if (!this.ttsServerAvailable) {
                this.showMessage('TTS server is not available', 'error');
                return;
            }

            const stats = await this.ttsClient.getCacheStats();
            const display = document.getElementById('cache-stats-display');
            
            if (stats && display) {
                display.innerHTML = `
                    <div style="color: var(--lt-green); font-weight: 600; margin-bottom: 10px;">
                        📊 Cache Statistics
                    </div>
                    <div><strong>Total Files:</strong> ${stats.totalFiles}</div>
                    <div><strong>Total Size:</strong> ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB</div>
                    <div><strong>Cache Directory:</strong> ${stats.cacheDir}</div>
                `;
                display.style.display = 'block';
            }
        } catch (error) {
            console.error('Error getting cache stats:', error);
            this.showMessage('Error getting cache statistics', 'error');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VocabularyApp();
});

// Global functions for HTML onclick handlers
function selectQuizAnswer(selected, correct) {
    app.selectQuizAnswer(selected, correct);
}

function changePage(page) {
    app.changePage(page);
}