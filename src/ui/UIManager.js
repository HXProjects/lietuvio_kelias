/**
 * UI Components Manager - Shared UI functionality
 * Handles messages, popups, and common UI interactions
 */
class UIManager {
    constructor() {
        this.popupAnimationsAdded = false;
    }

    /**
     * Show a bottom popup message
     * @param {string} text - Message text
     * @param {string} type - Message type ('error', 'warning', 'success', 'info')
     * @param {number} duration - Duration in milliseconds
     */
    showBottomPopup(text, type = 'info', duration = 4000) {
        // Ensure animations are loaded
        this.ensurePopupAnimations();

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
            background: ${this.getPopupColor(type)};
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

    /**
     * Show a traditional top message (fallback)
     * @param {string} text - Message text
     * @param {string} type - Message type
     * @param {number} duration - Duration in milliseconds
     */
    showMessage(text, type = 'info', duration = 3000) {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        // Insert at the top of the main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(message, mainContent.firstChild);
        } else {
            // Fallback: add to body
            document.body.appendChild(message);
        }
        
        // Remove after duration
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, duration);
    }

    /**
     * Get popup background color based on type
     * @param {string} type - Popup type
     * @returns {string} CSS color
     */
    getPopupColor(type) {
        const colors = {
            'error': '#dc3545',
            'warning': '#ffc107',
            'success': '#28a745',
            'info': '#17a2b8'
        };
        return colors[type] || colors.info;
    }

    /**
     * Ensure popup animations are loaded
     */
    ensurePopupAnimations() {
        if (this.popupAnimationsAdded) return;

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
        this.popupAnimationsAdded = true;
    }

    /**
     * Add visual feedback to a button
     * @param {HTMLElement} button - Button element
     * @param {string} state - State ('loading', 'playing', 'normal')
     */
    setButtonState(button, state) {
        if (!button) return;

        button.classList.remove('playing', 'loading');

        switch (state) {
            case 'loading':
                button.classList.add('loading');
                if (button.classList.contains('example-pronunciation-btn') || 
                    button.classList.contains('pronunciation-btn') || 
                    button.classList.contains('play-btn')) {
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                } else {
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                }
                break;
            case 'playing':
                button.classList.add('playing');
                if (button.classList.contains('example-pronunciation-btn') || 
                    button.classList.contains('pronunciation-btn') || 
                    button.classList.contains('play-btn')) {
                    button.innerHTML = '<i class="fas fa-volume-up"></i>';
                } else {
                    button.innerHTML = '<i class="fas fa-volume-up"></i> Playing...';
                }
                break;
            case 'normal':
            default:
                if (button.classList.contains('example-pronunciation-btn') || 
                    button.classList.contains('pronunciation-btn') || 
                    button.classList.contains('play-btn')) {
                    button.innerHTML = '<i class="fas fa-volume-up"></i>';
                } else {
                    button.innerHTML = '<i class="fas fa-volume-up"></i> 🔊 Pronounce';
                }
                break;
        }
    }

    /**
     * Show loading indicator
     * @param {string} containerId - Container element ID
     * @param {boolean} show - Show or hide
     */
    showLoadingIndicator(containerId, show) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (show) {
            container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        } else {
            // Remove loading content (calling code should populate with actual content)
            const spinner = container.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    /**
     * Create and show a modal
     * @param {string} id - Modal ID
     * @param {string} title - Modal title
     * @param {string} content - Modal content HTML
     */
    showModal(id, title, content) {
        // Remove existing modal if present
        const existingModal = document.getElementById(id);
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-modal" onclick="window.uiManager.closeModal('${id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(id);
            }
        });
    }

    /**
     * Close a modal
     * @param {string} id - Modal ID
     */
    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }
}

// Export for ES6 modules or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else {
    window.UIManager = UIManager;
}