// Vocabulary Data Management with Topic-based JSON Loading
class VocabularyData {
    constructor() {
        this.words = this.loadWords();
        this.dataInitialized = false;
    }

    // Load words from localStorage or initialize empty array
    loadWords() {
        const saved = localStorage.getItem('vocabularyWords');
        return saved ? JSON.parse(saved) : [];
    }

    // Save words to localStorage
    saveWords() {
        localStorage.setItem('vocabularyWords', JSON.stringify(this.words));
    }

    // Add a new word
    addWord(wordData) {
        const word = {
            id: this.generateId(),
            lithuanian: wordData.lithuanian,
            english: wordData.english,
            partOfSpeech: wordData.partOfSpeech,
            exampleSentence: wordData.exampleSentence,
            sentenceTranslation: wordData.sentenceTranslation,
            difficulty: wordData.difficulty,
            dateAdded: new Date().toISOString(),
            srsData: {
                level: 1,
                nextReview: new Date().toISOString(),
                totalReviews: 0,
                correctAnswers: 0,
                lastReviewed: null
            },
            tags: wordData.tags || []
        };
        
        this.words.push(word);
        this.saveWords();
        return word;
    }

    // Generate unique ID
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get all words
    getAllWords() {
        return this.words;
    }

    // Get words by difficulty
    getWordsByDifficulty(difficulty) {
        return this.words.filter(word => word.difficulty === difficulty);
    }

    // Get words due for review
    getWordsForReview() {
        const now = new Date();
        return this.words.filter(word => new Date(word.srsData.nextReview) <= now);
    }

    // Update word SRS data
    updateWordSRS(wordId, correct) {
        const word = this.words.find(w => w.id === wordId);
        if (!word) return false;

        word.srsData.totalReviews++;
        word.srsData.lastReviewed = new Date().toISOString();

        if (correct) {
            word.srsData.correctAnswers++;
            word.srsData.level = Math.min(word.srsData.level + 1, 10);
        } else {
            word.srsData.level = Math.max(word.srsData.level - 1, 1);
        }

        // Calculate next review date based on SRS algorithm
        const intervals = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]; // days
        const daysUntilNext = intervals[word.srsData.level - 1] || 512;
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + daysUntilNext);
        word.srsData.nextReview = nextReview.toISOString();

        this.saveWords();
        return true;
    }

    // Delete a word
    deleteWord(wordId) {
        const index = this.words.findIndex(w => w.id === wordId);
        if (index !== -1) {
            this.words.splice(index, 1);
            this.saveWords();
            return true;
        }
        return false;
    }

    // Search words
    searchWords(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.words.filter(word => 
            word.lithuanian.toLowerCase().includes(lowercaseQuery) ||
            word.english.toLowerCase().includes(lowercaseQuery) ||
            word.exampleSentence.toLowerCase().includes(lowercaseQuery)
        );
    }

    // Get random words for practice
    getRandomWords(count = 10) {
        const shuffled = [...this.words].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // Initialize with sample data loaded from topic JSON files
    async initializeSampleData() {
        if (this.dataInitialized) return;
        
        if (this.words.length === 0) {
            try {
                console.log('Loading vocabulary data from JSON files...');
                const sampleWords = await this.loadAllTopicData();
                sampleWords.forEach(wordData => this.addWord(wordData));
                console.log(`✅ Initialized with ${sampleWords.length} phrases`);
            } catch (error) {
                console.error('Error loading topic data:', error);
                // Fallback to minimal data
                this.loadFallbackData();
            }
        }
        
        this.dataInitialized = true;
    }

    // Load all topic data from JSON files
    async loadAllTopicData() {
        let topics;
        
        // Try to load topics from config file, fall back to hardcoded list
        try {
            const config = await this.loadTopicFile('config');
            topics = config.topics.map(topic => topic.id);
        } catch (error) {
            console.warn('Failed to load topics config, using default list:', error);
            topics = ['greetings', 'shopping', 'restaurant', 'travel', 'work', 'health', 'social', 'weather', 'technology', 'fears', 'everyday'];
        }

        const allPhrases = [];

        for (const topic of topics) {
            try {
                const topicData = await this.loadTopicFile(topic);
                if (topicData && topicData.phrases) {
                    // Add topic tag to each phrase
                    const phrasesWithTags = topicData.phrases.map(phrase => ({
                        ...phrase,
                        tags: [topic]
                    }));
                    allPhrases.push(...phrasesWithTags);
                    console.log(`✓ Loaded ${topicData.phrases.length} phrases from ${topic} (${topicData.displayName}). Total so far: ${allPhrases.length}`);
                    
                    // Debug: Log first phrase from each topic
                    if (topicData.phrases.length > 0) {
                        console.log(`  📝 First phrase: "${topicData.phrases[0].lithuanian}" with tags:`, [topic]);
                    }
                }
            } catch (error) {
                console.warn(`Failed to load topic ${topic}:`, error);
            }
        }

        console.log(`🎯 Total loaded: ${allPhrases.length} phrases across ${topics.length} topics`);
        return allPhrases;
    }

    // Load a specific topic JSON file
    async loadTopicFile(topicName) {
        try {
            const response = await fetch(`/topics/${topicName}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading ${topicName}.json:`, error);
            return null;
        }
    }

    // Get available topics from config file
    async getAvailableTopics() {
        try {
            const config = await this.loadTopicFile('config');
            const topicInfo = [];

            console.log(`🔍 Loading ${config.topics.length} topics from config...`);

            for (const topicConfig of config.topics) {
                try {
                    console.log(`📂 Loading topic: ${topicConfig.id}`);
                    const topicData = await this.loadTopicFile(topicConfig.id);
                    if (topicData && topicData.phrases) {
                        topicInfo.push({
                            id: topicConfig.id,
                            name: topicConfig.displayName,
                            icon: topicConfig.icon,
                            description: topicConfig.description,
                            color: topicConfig.color,
                            phraseCount: topicData.phrases.length
                        });
                        console.log(`✅ Loaded ${topicConfig.id}: ${topicData.phrases.length} phrases`);
                    } else {
                        console.warn(`⚠️ Topic ${topicConfig.id} has no phrases or failed to load`);
                    }
                } catch (error) {
                    console.warn(`❌ Failed to load topic data for ${topicConfig.id}:`, error);
                }
            }

            console.log(`🎯 Successfully loaded ${topicInfo.length} topics total`);
            return topicInfo;
        } catch (error) {
            console.error('Failed to load topics config:', error);
            return [];
        }
    }

    // Fallback data in case JSON files fail to load
    loadFallbackData() {
        const fallbackWords = [
            {
                lithuanian: "Labas rytas!",
                english: "Good morning!",
                partOfSpeech: "phrase",
                exampleSentence: "Labas rytas! Kaip jūs šiandien?",
                sentenceTranslation: "Good morning! How are you today?",
                difficulty: "beginner",
                tags: ["greetings"]
            },
            {
                lithuanian: "Kiek tai kainuoja?",
                english: "How much does this cost?",
                partOfSpeech: "phrase",
                exampleSentence: "Atsiprašau, kiek tai kainuoja?",
                sentenceTranslation: "Excuse me, how much does this cost?",
                difficulty: "intermediate",
                tags: ["shopping"]
            },
            {
                lithuanian: "Ar galėčiau pamatyti meniu?",
                english: "Could I see the menu?",
                partOfSpeech: "phrase",
                exampleSentence: "Ar galėčiau pamatyti meniu? Ar turite vegetarišką variantą?",
                sentenceTranslation: "Could I see the menu? Do you have a vegetarian option?",
                difficulty: "intermediate",
                tags: ["restaurant"]
            }
        ];
        
        fallbackWords.forEach(wordData => this.addWord(wordData));
    }

    // Get statistics
    getStatistics() {
        const total = this.words.length;
        const mastered = this.words.filter(w => w.srsData.level >= 8).length;
        const dueForReview = this.getWordsForReview().length;
        
        return {
            totalWords: total,
            masteredWords: mastered,
            dueForReview: dueForReview,
            averageLevel: total > 0 ? (this.words.reduce((sum, w) => sum + w.srsData.level, 0) / total).toFixed(1) : 0
        };
    }
}

// Export for use in other files
window.VocabularyData = VocabularyData;