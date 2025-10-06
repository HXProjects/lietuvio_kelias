# Temporary/Legacy Files

This folder contains legacy files that have been replaced by the new architecture.

## 📁 **Legacy Application Files**

### **Main App Files (Replaced)**
- `app.js` - Legacy vocabulary page logic (replaced by `src/pages/VocabularyPage.js`)
- `conjugation-app.js` - Legacy conjugation page logic (replaced by `src/pages/ConjugationPage.js`)

### **Unused TTS Providers**
- `cloud-tts-providers.js` - Complex TTS provider system (replaced by simpler `AudioManager`)
- `enhanced-audio-manager.js` - Over-engineered audio manager (replaced by `src/core/AudioManager.js`)

## 🧪 **Test & Debug Files**

### **Test Pages**
- `test.html` - Basic testing page
- `test-loading.html` - Loading test page  
- `test-tts-fallback.html` - TTS fallback testing
- `tts-integration-test.html` - TTS integration tests
- `cache-test.html` - Cache testing utilities

### **Debug Pages**
- `debug.html` - General debugging page
- `debug-conjugation.html` - Conjugation debugging tools

## 🔄 **Migration Status**

**✅ Replaced by New Architecture:**
- App logic → `src/pages/` classes extending `BasePage`
- Audio management → `src/core/AudioManager.js` 
- UI components → `src/ui/UIManager.js`
- App orchestration → `src/core/AppCore.js`

**🗂️ Still in Use:**
- `vocabulary-data.js` - Data management (will be refactored later)
- `conjugation-data.js` - Data management (will be refactored later)
- `lithuanian-tts-client.js` - Core TTS client
- `server.js` - Backend server

## 🚮 **Can be Deleted?**

These files can potentially be deleted once the new architecture is fully tested and stable:
- All test/debug HTML files (unless needed for development)
- Legacy app.js files (functionality moved to new architecture)
- Unused TTS provider files

## 📝 **Notes**

- Keep these files during the transition period
- Test thoroughly before permanent deletion
- Some test files might be useful for future debugging