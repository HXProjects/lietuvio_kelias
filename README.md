# Lithuanian Vocabulary Builder

A comprehensive web application for learning Lithuanian vocabulary and verb conjugations with intelligent text-to-speech support and spaced repetition learning.

## 🚀 Quick Start

### **Option 1: Using npm (Recommended)**
```bash
# Install dependencies
npm install

# Start both servers (TTS + Main)
npm run dev

# Or start just the main server
npm start

# Or start just the TTS server
npm run tts
```

### **Option 2: Using batch script**
```bash
# Run the startup script
scripts\start.bat
```

### **Option 3: Manual startup**
```bash
# Terminal 1: Start TTS server (optional but recommended)
node texttospeech/tts-server.js

# Terminal 2: Start main server
node server/server.js
```

**Access the Application:**
- **Vocabulary Builder:** http://localhost:8080/index.html
- **Conjugation Trainer:** http://localhost:8080/conjugation.html

### 1. Vocabulary Builder with Context
- **Add New Words**: Add Lithuanian words with English translations, parts of speech, example sentences, and difficulty levels
- **Rich Context**: Each word includes example sentences in both Lithuanian and English
- **Word Management**: View, edit, and delete vocabulary words
- **Audio Pronunciation**: Text-to-speech support for Lithuanian words

### 2. Interactive Flashcards
- **Flip Cards**: Click to reveal translations and example sentences
- **Navigation**: Move between cards with previous/next buttons
- **Shuffle Function**: Randomize card order for varied practice
- **Progress Tracking**: See your position in the deck

### 3. Spaced Repetition System (SRS)
- **Intelligent Scheduling**: Words appear for review based on your performance
- **10-Level Mastery**: Progress from beginner (Level 1) to mastered (Level 10)
- **Performance Tracking**: Track correct answers, review counts, and retention rates
- **Personalized Sessions**: Practice sessions focus on words due for review

### 4. Interactive Quizzes
- **Multiple Choice**: Test your knowledge with randomized options
- **Immediate Feedback**: See correct/incorrect answers instantly
- **Performance Analytics**: Track quiz scores and review mistakes
- **Adaptive Learning**: Quiz performance affects SRS scheduling

### 5. Progress Dashboard
- **Statistics Overview**: Total words, mastered words, study time, and streak days
- **Visual Progress**: See your learning journey with comprehensive stats
- **Study Sessions**: Track your daily practice sessions

## How to Use

### Getting Started
1. Open `index.html` in your web browser
2. The app comes pre-loaded with 15 sample Lithuanian words
3. Navigate between tabs to explore different features

### Adding New Words
1. Click the "Add New Word" button in the Vocabulary Builder tab
2. Fill in:
   - Lithuanian word
   - English translation
   - Part of speech
   - Example sentence (optional but recommended)
   - Sentence translation (if example provided)
   - Difficulty level
3. Click "Add Word" to save

### Practicing with Flashcards
1. Go to the Flashcards tab
2. Click "Flip Card" to see the translation and example
3. Use Previous/Next to navigate between cards
4. Rate your knowledge: Difficult (red), Medium (yellow), or Easy (green)
5. Your rating affects when the word appears again (SRS)

### Taking Quizzes
1. Go to the Quiz tab
2. Click "Start Quiz" to begin a 10-question multiple choice quiz
3. Select your answer from the four options
4. See immediate feedback and final results
5. Review incorrect answers to improve

### Tracking Progress
1. Visit the Progress tab to see your statistics
2. Monitor your vocabulary growth and learning consistency
3. Maintain study streaks for better retention

## Technical Features

### Spaced Repetition Algorithm
- **Adaptive Intervals**: Review intervals increase with successful recalls
- **Difficulty Adjustment**: Failed reviews reset or reduce the interval
- **10 Mastery Levels**: Progress from 1-day intervals to 512-day intervals
- **Retention Optimization**: Algorithm designed for long-term memory retention

### Data Persistence
- **Local Storage**: All vocabulary and progress data saved in browser
- **Session Tracking**: Study sessions recorded for analytics
- **Import/Export**: Data can be backed up and restored

### Responsive Design
- **Mobile Friendly**: Works on phones, tablets, and desktops
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Accessibility**: Keyboard navigation and screen reader support

## Sample Vocabulary Included

The app comes with 15 essential Lithuanian words:
- Basic greetings: labas (hello), ačiū (thank you)
- Common nouns: šuo (dog), katė (cat), namas (house)
- Colors: mėlynas (blue)
- Actions: valgyti (to eat), gerti (to drink), kalbėti (to speak)
- And more!

## Browser Requirements

- Modern web browser with JavaScript enabled
- Local storage support
- Speech Synthesis API for pronunciation (optional)

## Getting Started Quick Tips

1. **Start Small**: Begin with the pre-loaded words to understand the system
2. **Daily Practice**: Aim for 10-15 minutes daily for best results
3. **Use Examples**: Always add example sentences - they greatly improve retention
4. **Be Honest**: Rate your knowledge accurately for optimal SRS scheduling
5. **Stay Consistent**: Regular practice is more effective than long, infrequent sessions

## Future Enhancements

Potential future features:
- Audio recordings by native speakers
- Image associations for vocabulary
- Grammar exercises
- Social features and leaderboards
- Export to Anki or other SRS systems
- Offline support with service workers

## License

This project is open source and available for educational use.

---

**Sėkmės mokantis lietuvių kalbos!** (Good luck learning Lithuanian!)