/**
 * Application Core - Main application orchestrator
 * Handles global app state, routing, and shared resources
 */
class AppCore {
    constructor() {
        this.currentPage = null;
        this.isInitialized = false;
        this.config = {
            ttsServerUrl: 'http://localhost:3001',
            fallbackServerUrl: 'http://localhost:8080'
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing Lithuanian Language Learning App...');

            // Setup global error handling
            this.setupGlobalErrorHandling();

            // Initialize core services
            await this.initializeCoreServices();

            // Setup global navigation
            this.setupGlobalNavigation();

            // Auto-detect and initialize current page
            await this.initializeCurrentPage();

            this.isInitialized = true;
            console.log('✅ Application core initialized successfully');

        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.showGlobalError('Application failed to initialize. Please refresh the page.');
        }
    }

    /**
     * Initialize core services that are shared across pages
     */
    async initializeCoreServices() {
        // Ensure required global classes are available
        if (!window.AudioManager) {
            throw new Error('AudioManager not loaded');
        }
        if (!window.UIManager) {
            throw new Error('UIManager not loaded');
        }
        if (!window.LithuanianTTSClient) {
            console.warn('⚠️ LithuanianTTSClient not available - TTS features may be limited');
        }

        console.log('✅ Core services validated');
    }

    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showGlobalError('An unexpected error occurred. Please refresh the page.');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            // Don't show popup for every promise rejection to avoid spam
        });
    }

    /**
     * Setup global navigation between pages
     */
    setupGlobalNavigation() {
        // Add navigation event listeners
        document.addEventListener('click', (event) => {
            const navLink = event.target.closest('.nav-link');
            if (navLink && navLink.href) {
                // Let normal navigation happen
                console.log('Navigating to:', navLink.href);
            }
        });
    }

    /**
     * Auto-detect current page and initialize appropriate page class
     */
    async initializeCurrentPage() {
        const path = window.location.pathname;
        const page = this.detectPageType(path);

        console.log(`🎯 AppCore: Detected page type: ${page} (path: ${path})`);

        try {
            switch (page) {
                case 'vocabulary':
                    console.log('🎯 AppCore: Initializing VocabularyPage...');
                    if (window.VocabularyPage) {
                        console.log('🎯 AppCore: VocabularyPage class found, creating instance...');
                        this.currentPage = new window.VocabularyPage();
                        console.log('🎯 AppCore: VocabularyPage instance created, calling init...');
                        await this.currentPage.init();
                        console.log('🎯 AppCore: VocabularyPage initialized successfully');
                    } else {
                        console.warn('🎯 AppCore: VocabularyPage class not found, using legacy initialization');
                        return; // Let legacy code handle it
                    }
                    break;

                case 'conjugation':
                    console.log('🎯 AppCore: Initializing ConjugationPage...');
                    if (window.ConjugationPage) {
                        console.log('🎯 AppCore: ConjugationPage class found, creating instance...');
                        this.currentPage = new window.ConjugationPage();
                        console.log('🎯 AppCore: ConjugationPage instance created, calling init...');
                        await this.currentPage.init();
                        console.log('🎯 AppCore: ConjugationPage initialized successfully');
                    } else {
                        console.warn('🎯 AppCore: ConjugationPage class not found, using legacy initialization');
                        return; // Let legacy code handle it
                    }
                    break;

                default:
                    console.warn(`🎯 AppCore: Unknown page type: ${page}`);
                    return;
            }

            console.log('🎯 AppCore: Page initialization completed successfully');

        } catch (error) {
            console.error(`🎯 AppCore: Failed to initialize ${page} page:`, error);
            this.showGlobalError(`Failed to load the ${page} page. Please refresh.`);
        }
    }

    /**
     * Detect page type from URL path
     * @param {string} path - URL path
     * @returns {string} Page type
     */
    detectPageType(path) {
        const filename = path.split('/').pop() || 'index.html';
        
        if (filename.includes('conjugation')) {
            return 'conjugation';
        } else if (filename.includes('index') || path === '/') {
            return 'vocabulary';
        } else {
            return 'unknown';
        }
    }

    /**
     * Show global error message
     * @param {string} message - Error message
     */
    showGlobalError(message) {
        // Create simple error popup if UI manager not available
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 20000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 400px;
            text-align: center;
        `;
        popup.innerHTML = `
            <div style="margin-bottom: 15px;">⚠️ ${message}</div>
            <button onclick="location.reload()" style="background: white; color: #dc3545; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                Refresh Page
            </button>
        `;
        document.body.appendChild(popup);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 10000);
    }

    /**
     * Get current page instance
     * @returns {BasePage|null} Current page instance
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Cleanup when page unloads
     */
    cleanup() {
        if (this.currentPage && this.currentPage.cleanup) {
            this.currentPage.cleanup();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new AppCore();
    await window.app.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.cleanup();
    }
});

// Export for ES6 modules or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppCore;
} else {
    window.AppCore = AppCore;
}