// Lithuanian Verb Conjugation Data - JSON only, no hardcoded verbs
class ConjugationData {
    constructor() {
        this.verbs = [];
        this.currentTense = 'present';
        this.currentVerb = null;
        this.topics = [];
        this.currentTopic = null;
        this.isLoading = true;
        
        this.loadTopics().then(() => {
            this.isLoading = false;
        }).catch(error => {
            console.error('Failed to load topics:', error);
            this.isLoading = false;
        });
    }
    
    async loadTopics() {
        try {
            const response = await fetch('/verbs/config.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.topics = data.topics;
            console.log(`✅ Loaded ${this.topics.length} verb topics`);
        } catch (error) {
            console.error('Error loading topics:', error);
            this.topics = [];
            throw error;
        }
    }
    
    async loadTopicVerbs(topicId) {
        try {
            const response = await fetch(`/verbs/${topicId}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.verbs = data.verbs;
            this.currentTopic = this.topics.find(t => t.id === topicId);
            this.currentVerb = null;
            console.log(`✅ Loaded ${this.verbs.length} verbs for topic: ${topicId}`);
            return true;
        } catch (error) {
            console.error(`Error loading verbs for topic ${topicId}:`, error);
            this.verbs = [];
            this.currentTopic = null;
            throw error;
        }
    }

    getRandomVerb() {
        if (this.verbs.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.verbs.length);
        this.currentVerb = this.verbs[randomIndex];
        return this.currentVerb;
    }

    getCurrentConjugations() {
        if (!this.currentVerb) return null;
        return this.currentVerb.conjugations[this.currentTense];
    }

    getPronouns() {
        return ["aš", "tu", "jis/ji", "mes", "jūs", "jie/jos"];
    }

    getTenses() {
        return [
            { id: 'present', name: 'Present' },
            { id: 'past', name: 'Past' },
            { id: 'future', name: 'Future' }
        ];
    }

    setTense(tense) {
        this.currentTense = tense;
    }

    checkAnswer(pronoun, answer) {
        if (!this.currentVerb) return false;
        const conjugations = this.getCurrentConjugations();
        if (!conjugations?.[pronoun]) return false;
        return answer.toLowerCase().trim() === conjugations[pronoun].form.toLowerCase();
    }

    getCorrectAnswer(pronoun) {
        const conjugations = this.getCurrentConjugations();
        return conjugations?.[pronoun] || null;
    }
    
    getTopics() {
        return this.topics;
    }
    
    getCurrentTopic() {
        return this.currentTopic;
    }
    
    async switchToTopic(topicId) {
        return await this.loadTopicVerbs(topicId);
    }
    
    // Get all verbs from current topic
    getVerbs() {
        return this.verbs;
    }
    
    // Set specific verb as current verb
    setCurrentVerb(verb) {
        this.currentVerb = verb;
        return this.currentVerb;
    }
    
    // Find verb by infinitive
    findVerbByInfinitive(infinitive) {
        return this.verbs.find(verb => verb.infinitive === infinitive);
    }
}

window.ConjugationData = ConjugationData;