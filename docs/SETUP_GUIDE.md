# 🚀 Lithuanian Vocabulary Builder - Setup & Usage Guide

Welcome to your integrated Lithuanian vocabulary learning system with smart TTS caching!

## 🎯 What You Have

### **Two Powerful Applications:**
1. **Vocabulary Builder** (`index.html`) - Flashcards, quizzes, and topic-based learning
2. **Conjugation Trainer** (`conjugation.html`) - Verb conjugation practice with gamification

### **Smart TTS System:**
- **Local TTS Server** - High-quality Lithuanian pronunciation with caching
- **Browser Fallback** - Works without server for basic functionality
- **Smart Caching** - Never regenerates the same audio twice
- **Cost Efficient** - Uses your Google Cloud credits optimally

---

## 🚀 Quick Start Guide

### **Step 1: Start the TTS Server** (Recommended)

```bash
# Open terminal/command prompt
cd texttospeech
node tts-server.js
```

You should see:
```
🎯 Lithuanian TTS Server running on http://localhost:3001
📁 Serving audio files from: ./audio_cache
🔗 API Endpoints:
   GET  /tts/generate?text=labas
   POST /tts/batch
   GET  /tts/cache/stats
   GET  /health
```

### **Step 2: Start the Web Application**

```bash
# Open another terminal in the main directory
cd C:\HX\LTU\VocablaryBuilder
python -m http.server 8080
```

### **Step 3: Open Your Applications**

- **Vocabulary Builder**: http://localhost:8080/
- **Conjugation Trainer**: http://localhost:8080/conjugation.html
- **TTS Integration Test**: http://localhost:8080/tts-integration-test.html

---

## 📋 Prerequisites & Setup

### **Required Software:**
- ✅ **Node.js** (v16+) - Already installed
- ✅ **Python** (v3.6+) - For serving web files
- ✅ **Google Cloud Account** - For TTS API (setup guide provided)

### **Required Files:**
- ✅ `texttospeech/cloud-key.json` - Your Google Cloud service account key
- ✅ `texttospeech/node_modules/` - Dependencies installed
- ✅ All application files in main directory

---

## 🔧 Detailed Setup Instructions

### **1. Google Cloud Text-to-Speech Setup**

If you haven't set up Google Cloud TTS yet:

1. **Follow the Setup Guide**: Open `GOOGLE_CLOUD_TTS_SETUP.md` for step-by-step instructions
2. **Or use Quick Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create project → Enable Text-to-Speech API
   - Set up billing (1M chars/month free)
   - Create API Key → Download service account JSON
   - Save as `texttospeech/cloud-key.json`

### **2. Install Dependencies** (If needed)

```bash
cd texttospeech
npm install @google-cloud/text-to-speech express cors
```

### **3. Test TTS Server**

```bash
cd texttospeech
node get_sound.js  # Test basic functionality
node tts-server.js # Start the server
```

---

## 🎮 How to Use

### **Vocabulary Builder Features:**
- 📚 **Browse by Topics** - Greetings, Shopping, Restaurant, Travel, etc.
- 🔄 **Spaced Repetition** - Smart review system for better retention
- 🎯 **Practice Modes** - Flashcards, quizzes, and custom practice
- 🔊 **Audio Pronunciation** - Click any word to hear correct pronunciation
- ➕ **Add New Words** - Expand your vocabulary with custom phrases

### **Conjugation Trainer Features:**
- 🎯 **Verb Practice** - Practice Lithuanian verb conjugations
- 📈 **Progressive Learning** - Start simple, unlock advanced tenses
- 🎨 **Lithuanian Theme** - Beautiful flag colors (yellow, green, red)
- 🔄 **Dual Modes** - Learning mode (show answers) vs Practice mode (test yourself)
- 🏆 **Gamification** - XP points, levels, and achievement tracking
- 🔊 **Native Pronunciation** - Hear how conjugations sound naturally

### **Smart TTS Features:**
- 🎵 **Instant Playback** - Previously generated audio plays immediately
- 💾 **Smart Caching** - Audio files stored locally for reuse
- 📊 **Usage Stats** - Track cache size and generated files
- 🔄 **Fallback Support** - Works even if server is offline

---

## 💡 Usage Tips

### **For Best Audio Quality:**
1. **Start TTS Server First** - Always run `node tts-server.js` before using apps
2. **Use Headphones** - Audio is optimized for headphone listening
3. **Stable Internet** - Required for generating new audio (cached audio works offline)

### **For Learning Efficiency:**
1. **Start with Vocabulary Builder** - Learn basic words and phrases first
2. **Practice Regularly** - Use spaced repetition for best retention
3. **Use Conjugation Trainer** - Once comfortable with vocabulary, practice verb forms
4. **Enable Audio** - Pronunciation is crucial for Lithuanian learning

### **For Cost Management:**
- 🆓 **Free Tier**: 1,000,000 characters/month (plenty for intensive learning!)
- 💰 **Paid Usage**: Only $4.00 per 1M additional characters
- 📊 **Monitor Usage**: Check Google Cloud Console occasionally
- 🎵 **Use Caching**: Let the system cache audio to minimize API calls

---

## 🔍 Troubleshooting

### **TTS Server Issues:**

**Problem: "TTS Server not available"**
```bash
# Solution: Make sure server is running
cd texttospeech
node tts-server.js
```

**Problem: "API key not valid"**
```bash
# Solution: Check your Google Cloud setup
# 1. Verify cloud-key.json exists and is valid
# 2. Ensure Text-to-Speech API is enabled
# 3. Check billing is set up
```

**Problem: Audio doesn't play**
```bash
# Solution: Check browser settings
# 1. Allow audio for localhost sites
# 2. Ensure system audio is working
# 3. Try refreshing the page
```

### **Web Application Issues:**

**Problem: Pages don't load**
```bash
# Solution: Make sure web server is running
python -m http.server 8080
# Then visit http://localhost:8080
```

**Problem: "Module not found" errors**
```bash
# Solution: Ensure all files are in correct locations
# Check that lithuanian-tts-client.js exists in main directory
```

### **Performance Issues:**

**Problem: Slow audio generation**
- Check internet connection stability
- Consider pre-generating common vocabulary with batch processing

**Problem: High Google Cloud usage**
- Enable caching (should be automatic)
- Monitor usage in Google Cloud Console
- Consider generating vocabulary in batches during low-usage periods

---

## 📁 File Structure

```
C:\HX\LTU\VocablaryBuilder\
├── index.html                     # Main vocabulary builder app
├── conjugation.html                # Conjugation trainer app
├── tts-integration-test.html       # TTS system test page
├── lithuanian-tts-client.js        # TTS client integration
├── app.js                          # Main vocabulary app logic
├── conjugation-app.js              # Conjugation trainer logic
├── vocabulary-data.js              # Vocabulary data management
├── srs-system.js                   # Spaced repetition system
├── styles.css                      # Main app styles
├── conjugation-styles.css          # Conjugation trainer styles
├── topics/                         # JSON vocabulary files
│   ├── config.json
│   ├── greetings.json
│   ├── shopping.json
│   └── ...
├── verbs/
│   └── verbs.json                  # Lithuanian verb conjugations
├── texttospeech/
│   ├── tts-server.js               # TTS server
│   ├── get_sound.js                # TTS generation functions
│   ├── cloud-key.json              # Your Google Cloud credentials
│   ├── package.json                # Node.js dependencies
│   └── audio_cache/                # Generated audio files
│       ├── cache_index.json        # Cache metadata
│       ├── labasrytas.mp3          # Cached audio files
│       └── ...
└── Documentation/
    ├── GOOGLE_CLOUD_TTS_SETUP.md  # Detailed Google Cloud setup
    └── GOOGLE_TTS_TROUBLESHOOTING.md # Troubleshooting guide
```

---

## 🎉 You're All Set!

Your Lithuanian vocabulary learning system is now fully integrated with smart TTS caching. Here's what to do next:

1. **🚀 Start Learning**: Open the vocabulary builder and explore different topics
2. **🎯 Practice Conjugations**: Try the conjugation trainer for verb practice  
3. **🔊 Test Audio**: Click pronunciation buttons to hear native-like Lithuanian
4. **📊 Monitor Progress**: Check your learning stats and cache efficiency

### **Happy Learning! Sėkmės mokantis lietuvių kalbos! 🇱🇹**

---

## 🆘 Need Help?

- **Setup Issues**: Check `GOOGLE_CLOUD_TTS_SETUP.md`
- **Technical Problems**: See `GOOGLE_TTS_TROUBLESHOOTING.md`  
- **TTS Server**: Test with `tts-integration-test.html`
- **Audio Issues**: Check browser console (F12) for error messages

**Remember**: The system works with or without the TTS server, but the server provides much better Lithuanian pronunciation!