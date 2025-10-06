# Topics System Documentation

## Structure

The Lithuanian Vocabulary Builder uses a modular topic-based system where vocabulary is organized into separate JSON files for easy management and scalability.

### Folder Structure
```
topics/
├── config.json          # Topic configuration and metadata
├── greetings.json       # Greetings & Politeness phrases
├── shopping.json        # Shopping related phrases  
├── restaurant.json      # Restaurant & Food phrases
├── travel.json          # Travel & Directions phrases
├── work.json           # Work & Business phrases
├── health.json         # Health & Emergency phrases
├── social.json         # Social & Family phrases
├── weather.json        # Weather & Time phrases
└── technology.json     # Technology phrases
```

## JSON File Format

Each topic file follows this structure:

```json
{
  "topic": "topic_id",
  "displayName": "Human Readable Name",
  "icon": "fas fa-icon-name",
  "description": "Brief description of the topic",
  "phrases": [
    {
      "lithuanian": "Lithuanian phrase",
      "english": "English translation", 
      "partOfSpeech": "phrase|noun|verb|adjective",
      "exampleSentence": "Example usage in Lithuanian",
      "sentenceTranslation": "Example translation in English",
      "difficulty": "beginner|intermediate|advanced"
    }
  ]
}
```

## How It Works

1. **Dynamic Loading**: The `VocabularyData` class automatically loads all topic files from the `/topics` folder
2. **Automatic Tagging**: Each phrase gets tagged with its topic name for filtering
3. **Fallback System**: If JSON files fail to load, a minimal fallback dataset is used
4. **Async Initialization**: The app waits for all topic files to load before initializing

## Adding New Topics

### 1. Create Topic File
Create a new JSON file in the `/topics` folder following the format above.

### 2. Update Topic List
Add the topic ID to the topics array in `vocabulary-data.js`:
```javascript
const topics = ['greetings', 'shopping', 'restaurant', 'travel', 'work', 'health', 'social', 'weather', 'technology', 'your_new_topic'];
```

### 3. Update UI (Optional)
Add corresponding sidebar button in `index.html`:
```html
<button class="topic-btn" data-topic="your_new_topic">
    <i class="fas fa-your-icon"></i>
    Your Topic Name
</button>
```

### 4. Update Configuration
Add topic metadata to `topics/config.json`:
```json
{
  "id": "your_new_topic", 
  "displayName": "Your Topic Name",
  "icon": "fas fa-your-icon",
  "description": "Topic description",
  "color": "#color-code"
}
```

## Benefits of This System

- **🔧 Modular**: Easy to add, remove, or modify topics
- **📊 Scalable**: Can handle unlimited topics and phrases
- **🌐 Maintainable**: Each topic is self-contained
- **🔄 Async**: Non-blocking loading with fallback support
- **📱 Dynamic**: Topics are loaded and filtered dynamically
- **🎯 Organized**: Clean separation of concerns

## Current Topics (80+ phrases total)

1. **Greetings & Politeness** (10 phrases) - Social courtesies
2. **Shopping** (12 phrases) - Prices, sizes, payments  
3. **Restaurant & Food** (10 phrases) - Dining and ordering
4. **Travel & Directions** (10 phrases) - Transportation and navigation
5. **Work & Business** (8 phrases) - Professional communication
6. **Health & Emergency** (9 phrases) - Medical situations
7. **Social & Family** (9 phrases) - Personal relationships
8. **Weather & Time** (9 phrases) - Weather and scheduling
9. **Technology** (9 phrases) - Digital devices and internet

## Error Handling

- Network failures gracefully fall back to minimal data
- Missing files are logged but don't break the application
- Individual topic failures don't affect other topics
- Console warnings help with debugging during development

This modular system makes the vocabulary builder highly maintainable and allows for easy content expansion without touching the core application code.