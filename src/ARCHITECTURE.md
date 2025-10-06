# 🏗️ Refactored Architecture Documentation

## 📁 **New Folder Structure**

```
src/
├── core/                   # Core shared functionality
│   ├── AppCore.js         # Main app orchestrator & routing
│   ├── BasePage.js        # Base class for all pages
│   └── AudioManager.js    # Shared TTS & audio management
├── ui/                    # UI components & managers
│   └── UIManager.js       # Shared UI functionality (popups, modals)
├── pages/                 # Page-specific classes
│   ├── VocabularyPage.js  # Vocabulary page logic
│   └── ConjugationPage.js # Conjugation page logic
└── utils/                 # Utility functions
    └── helpers.js         # Common helper functions
```

## 🎯 **Architecture Benefits**

### **1. Separation of Concerns**
- **Core**: App-wide functionality
- **UI**: Visual components & interactions  
- **Pages**: Page-specific logic
- **Utils**: Helper functions

### **2. Code Reusability**
- **AudioManager**: Shared TTS logic across all pages
- **UIManager**: Consistent popups, modals, messages
- **BasePage**: Common page initialization & error handling

### **3. Easy Extensibility**
- Add new pages by extending `BasePage`
- Shared functionality automatically available
- Consistent UI patterns across pages

### **4. Better Maintainability**
- Single source of truth for common functionality
- Clear dependency hierarchy
- Standardized error handling

## 🔄 **Migration Strategy**

### **Phase 1: Core Infrastructure** ✅
- [x] Create folder structure
- [x] Implement AudioManager (shared TTS)
- [x] Implement UIManager (shared UI)
- [x] Implement BasePage (common functionality)
- [x] Implement AppCore (app orchestrator)

### **Phase 2: Page Refactoring** 🚧
- [ ] Create VocabularyPage class extending BasePage
- [ ] Create ConjugationPage class extending BasePage
- [ ] Update HTML pages to use new architecture
- [ ] Remove duplicate code from legacy files

### **Phase 3: Testing & Optimization** ⏭️
- [ ] Test all functionality works with new architecture
- [ ] Optimize loading and initialization
- [ ] Add error boundaries and better error handling

## 📖 **Usage Examples**

### **Adding a New Page**
```javascript
class NewPage extends BasePage {
    async initializePage() {
        // Page-specific initialization
        this.setupEventListeners();
        this.loadData();
    }
    
    setupEventListeners() {
        // Page-specific event handlers
        document.getElementById('my-button').onclick = () => {
            this.pronounceText('Labas rytas!'); // Inherited from BasePage
        };
    }
}
```

### **Using Shared Functionality**
```javascript
// Pronunciation with error handling
await this.pronounceText('Lithuanian text', 'lithuanian', buttonElement);

// Show user feedback
this.showSuccess('Operation completed!');
this.showError('Something went wrong');

// UI components
this.uiManager.showBottomPopup('Custom message', 'warning');
```

## 🎨 **HTML Integration**

### **Before (Duplicated)**
```html
<!-- Each page had its own initialization -->
<script src="app.js"></script>
<script src="conjugation-app.js"></script>
```

### **After (Shared)**
```html
<!-- Load shared core first -->
<script src="src/core/AudioManager.js"></script>
<script src="src/ui/UIManager.js"></script>
<script src="src/core/BasePage.js"></script>
<script src="src/core/AppCore.js"></script>

<!-- Page-specific only when needed -->
<script src="src/pages/VocabularyPage.js"></script>
```

## ⚡ **Performance Benefits**

1. **Reduced Code Duplication**: ~50% less JavaScript code
2. **Faster Loading**: Shared functionality cached across pages
3. **Better Error Handling**: Centralized error management
4. **Consistent UX**: Uniform behavior across all pages

## 🔧 **Next Steps**

1. **Test the core infrastructure** - Verify AudioManager & UIManager work
2. **Refactor vocabulary page** - Create VocabularyPage class
3. **Refactor conjugation page** - Create ConjugationPage class  
4. **Update HTML pages** - Use new script loading order
5. **Remove legacy code** - Clean up duplicated functionality