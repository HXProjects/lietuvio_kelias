/**
 * Base Page Class - Common functionality for all pages
 * Provides shared initialization, audio management, and UI interactions
 */
class BasePage {
    constructor() {
        this.audioManager = null;
        this.uiManager = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the page with common functionality
     */
    async init() {
        try {
            // Initialize UI Manager
            this.uiManager = new UIManager();
            window.uiManager = this.uiManager; // Make globally available for modals

            // Initialize Audio Manager
            this.audioManager = new AudioManager();
            await this.audioManager.init();
            window.audioManager = this.audioManager; // Make globally available

            // Call page-specific initialization
            await this.initializePage();

            this.isInitialized = true;
            console.log(`✅ ${this.constructor.name} initialized successfully`);

        } catch (error) {
            console.error(`❌ ${this.constructor.name} initialization failed:`, error);
            this.uiManager?.showBottomPopup('Page initialization failed', 'error');
        }
    }

    /**
     * Page-specific initialization (to be overridden by subclasses)
     */
    async initializePage() {
        // Override in subclasses
    }

    /**
     * Pronounce text with error handling
     * @param {string} text - Text to pronounce
     * @param {string} language - Language ('lithuanian' or 'english')
     * @param {HTMLElement} button - Button element for visual feedback
     * @returns {Promise<boolean>} Success status
     */
    async pronounceText(text, language = 'lithuanian', button = null) {
        if (!text || !text.trim()) {
            console.warn('Empty text provided to pronounceText');
            return false;
        }

        // Check if managers are initialized
        if (!this.audioManager) {
            console.error('AudioManager not initialized');
            return false;
        }

        if (!this.uiManager) {
            console.error('UIManager not initialized');
            return false;
        }

        try {
            // Set button to loading state
            this.uiManager.setButtonState(button, 'loading');

            // Attempt pronunciation
            await this.audioManager.speak(text, language);
            
            // Set button to playing state briefly
            this.uiManager.setButtonState(button, 'playing');
            
            return true;

        } catch (error) {
            console.warn('Pronunciation failed:', error);
            
            // Show error popup
            this.uiManager.showBottomPopup(`🔊 ${error.message}`, 'error');
            
            return false;

        } finally {
            // Restore button state after delay
            setTimeout(() => {
                if (this.uiManager && button) {
                    this.uiManager.setButtonState(button, 'normal');
                }
            }, 1000);
        }
    }

    /**
     * Handle pronunciation button clicks
     * @param {Event} event - Click event
     * @param {string} text - Text to pronounce
     * @param {string} language - Language
     * @param {HTMLElement} button - Button element
     */
    handlePronunciationClick(event, text, language = 'lithuanian', button = null) {
        event.preventDefault();
        this.pronounceText(text, language, button);
    }

    /**
     * Setup common event listeners
     */
    setupCommonEventListeners() {
        // Handle pronunciation buttons with data attributes
        document.addEventListener('click', (event) => {
            const button = event.target.closest('[data-pronounce]');
            if (button) {
                const text = button.dataset.pronounce;
                const language = button.dataset.language || 'lithuanian';
                // Pass the actual button element, not event.currentTarget
                this.handlePronunciationClick(event, text, language, button);
            }
        });

        // Handle modal close buttons
        document.addEventListener('click', (event) => {
            if (event.target.matches('.close-modal') || event.target.closest('.close-modal')) {
                const modal = event.target.closest('.modal');
                if (modal) {
                    this.uiManager.closeModal(modal.id);
                }
            }
        });

        // Handle ESC key to close modals
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    this.uiManager.closeModal(activeModal.id);
                }
            }
        });
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.uiManager.showBottomPopup(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.uiManager.showBottomPopup(message, 'error');
    }

    /**
     * Show warning message
     * @param {string} message - Warning message
     */
    showWarning(message) {
        this.uiManager.showBottomPopup(message, 'warning');
    }

    /**
     * Show info message
     * @param {string} message - Info message
     */
    showInfo(message) {
        this.uiManager.showBottomPopup(message, 'info');
    }

    /**
     * Utility method to find button for specific text/action
     * @param {string} identifier - Identifier to search for
     * @returns {HTMLElement|null} Button element
     */
    findButton(identifier) {
        // Try various selectors to find the button
        const selectors = [
            `[data-pronounce="${identifier}"]`,
            `[onclick*="${identifier}"]`,
            `.pronunciation-btn[data-text="${identifier}"]`,
            `.play-btn[data-text="${identifier}"]`
        ];

        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) return button;
        }

        return null;
    }

    /**
     * Cleanup resources when page is unloaded
     */
    cleanup() {
        if (this.audioManager) {
            this.audioManager.stop();
        }
    }
}

// Export for ES6 modules or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BasePage;
} else {
    window.BasePage = BasePage;
}