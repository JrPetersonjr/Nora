# Nora - Student Helper 📚

A comprehensive, all-in-one study companion web application designed to help students manage their academic life efficiently.

## Features ✨

### Core Features
- **📝 Rich Text Editor** - Take and organize study notes with auto-save
- **✓ Grammar Checker** - Check your writing using LanguageTool API
- **🎴 Flashcards** - Create and study flashcard sets with progress tracking
- **📚 Class Management** - Track classes, assignments, and due dates
- **📅 Assignment Calendar** - Visualize all deadlines in one place

### Study Tools
- **⏱️ Focus Timer** - Pomodoro technique timer for better concentration
- **🎵 Study Music** - Curated playlists for studying
- **🎥 Study Videos** - Search and watch educational content (requires YouTube API)
- **🧮 Calculator** - Quick calculations for homework
- **📖 Citation Generator** - Generate APA and MLA citations

### Project Management
- **📋 Projects** - Track major projects with deadlines
- **⚙️ Settings** - Customize your experience and manage data

## Installation 🚀

### Option 1: Local Development

1. **Clone or download** this repository

2. **Start a local server:**
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Or using Python 2
   python -m SimpleHTTPServer 8000

   # Or using Node.js
   npx serve
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:8000
   ```

### Option 2: Deploy to Web

You can deploy this app to any static hosting service:

- **GitHub Pages**
- **Netlify**
- **Vercel**
- **Cloudflare Pages**

Simply upload all files to your chosen service.

## Setup & Configuration ⚙️

### YouTube API (Optional)
To use the Study Videos feature:

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project
3. Enable the **YouTube Data API v3**
4. Create an API key
5. In Nora, go to **Settings** and paste your API key

### PWA Installation
Nora works as a Progressive Web App (PWA):

1. Open the app in Chrome/Edge
2. Look for the "Install" button in the address bar
3. Click to install as a desktop/mobile app

## File Structure 📁

```
nora-student-helper/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker for offline support
├── css/
│   └── styles.css          # All application styles
└── js/
    ├── app.js              # Main application controller
    ├── utils/
    │   ├── storage.js      # LocalStorage management
    │   ├── validators.js   # Input validation
    │   └── errorHandler.js # Error handling & notifications
    └── modules/
        ├── editor.js       # Rich text editor
        ├── grammar.js      # Grammar checking
        ├── flashcards.js   # Flashcard system
        ├── classes.js      # Class management
        └── extras.js       # Additional features
```

## Features in Detail 📖

### Notes Editor
- Auto-save every 30 seconds
- Export notes as plain text
- Rich formatting options
- Persistent storage

### Grammar Checker
- Powered by LanguageTool API
- Identifies grammar, spelling, and style issues
- Provides suggestions for improvements
- No API key required

### Flashcards
- Create multiple sets
- Track mastery progress
- Randomized study sessions
- Visual progress indicators

### Classes & Assignments
- Add classes with instructors
- Track assignments per class
- Mark assignments complete
- Progress visualization

### Calendar View
- See all assignments and projects
- Monthly calendar view
- Click dates to see events
- Color-coded entries

### Focus Timer
- Pomodoro technique (25 min focus, 5 min break)
- Customizable durations
- Audio notifications
- Pause and reset options

## Browser Support 🌐

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

**Note:** For the best experience, use a modern browser with ES6+ support.

## Data Storage 💾

All your data is stored locally in your browser using LocalStorage:

- **Offline Access** - Works without internet (except grammar check and videos)
- **Privacy** - No data sent to external servers (except APIs)
- **Export/Import** - Back up your data anytime from Settings

### Data Backup
1. Go to **Settings**
2. Click **Export All Data**
3. Save the JSON file securely

### Clear Data
If needed, you can clear all data from Settings (cannot be undone!).

## Technologies Used 🛠️

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Editor:** CKEditor 5
- **Sanitization:** DOMPurify
- **APIs:** 
  - LanguageTool (grammar checking)
  - YouTube Data API v3 (video search)

## Development 👩‍💻

### Prerequisites
- Basic web server (Python, Node.js, or any HTTP server)
- Modern web browser

### Key Files to Modify
- `js/modules/extras.js` - Add new features
- `css/styles.css` - Customize styling
- `index.html` - Modify layout

### Adding New Features
1. Create a new section in `index.html`
2. Add navigation link
3. Implement functionality in `js/modules/extras.js` or create a new module
4. Add styles in `css/styles.css`

## Troubleshooting 🔧

### Editor not loading
- Check browser console for errors
- Ensure CKEditor CDN is accessible
- Clear browser cache

### Videos not working
- Verify YouTube API key in Settings
- Check API key permissions
- Ensure API is enabled in Google Cloud Console

### Data not saving
- Check browser localStorage is enabled
- Try a different browser
- Look for quota exceeded errors in console

### Service Worker issues
- Clear browser cache and hard reload (Ctrl+Shift+R)
- Unregister service workers in DevTools
- Check sw.js file is accessible

## Contributing 🤝

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## License 📄

This project is open source and available under the MIT License.

## Credits 👏

- Icons: System emoji
- Fonts: Geist & JetBrains Mono (Google Fonts)
- Editor: CKEditor
- Grammar: LanguageTool API

## Support 💬

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Ensure all files are properly uploaded

---

**Made with ❤️ for students**

Happy studying! 🎓
