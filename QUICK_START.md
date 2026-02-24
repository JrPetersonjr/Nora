# 🚀 Quick Start Guide - Nora Student Helper

Welcome to Nora! This guide will get you up and running in minutes.

## ⚡ Fastest Way to Start

### Option 1: Open Directly (Chrome/Edge)
1. Double-click `index.html`
2. Your browser will open the app
3. Start using Nora immediately!

**Note:** Some features (like the service worker) work best when served over HTTP.

### Option 2: Use a Local Server (Recommended)

**With Python (easiest):**
```bash
# Navigate to the folder in terminal/command prompt
cd path/to/student-helper

# Start server
python -m http.server 8000

# Open browser to: http://localhost:8000
```

**With Node.js:**
```bash
# Install serve globally (one time)
npm install -g serve

# Run from folder
serve

# Open the URL shown in terminal
```

**With VS Code:**
- Install "Live Server" extension
- Right-click `index.html`
- Click "Open with Live Server"

## 📋 First Steps

### 1. Create Your First Note
- Click **Notes** in the sidebar
- Start typing (auto-saves every 30 seconds)
- Use the rich text editor for formatting

### 2. Add a Class
- Click **Classes** in sidebar
- Enter class name and instructor
- Click "Add Class"
- Add assignments to track deadlines

### 3. Create Flashcards
- Click **Flashcards**
- Create a new set
- Add cards with questions and answers
- Study when ready!

### 4. Set Up Calendar
- Add classes and assignments (they auto-appear in calendar)
- Go to **Calendar** to see all deadlines
- Click dates to view events

## ⚙️ Optional Setup

### YouTube Videos (Optional)
To search for study videos:

1. Get a free API key:
   - Go to https://console.developers.google.com/
   - Create a project
   - Enable "YouTube Data API v3"
   - Create credentials (API key)

2. In Nora:
   - Click **Settings**
   - Paste your API key
   - Click "Save Settings"

3. Now you can search videos in the **Study Videos** section!

## 💡 Pro Tips

1. **Focus Timer**
   - Use 25-minute sessions (Pomodoro technique)
   - Customize durations in the timer

2. **Export Data**
   - Go to Settings → Export All Data
   - Save backups regularly
   - Import if you switch devices

3. **Grammar Check**
   - Write in Notes or paste text
   - Go to Grammar Check
   - Get instant feedback

4. **Study Music**
   - Select a playlist
   - Play in background while working

## 🎯 Common Tasks

### Add an Assignment
1. Go to **Classes**
2. Find your class
3. Click "Add Assignment"
4. Set name and due date

### Study Flashcards
1. Go to **Flashcards**
2. Click "Study Set" on any set
3. Click cards to flip
4. Track your progress

### Check Your Progress
- **Dashboard** shows all your stats
- See notes created, classes, flashcards
- View recent activity

## 🔧 Troubleshooting

### Editor Not Loading
- Refresh the page (Ctrl+R or Cmd+R)
- Check internet connection (needs CKEditor CDN)
- Try clearing browser cache

### Data Not Saving
- Check if cookies/localStorage is enabled
- Try a different browser
- Make sure you're not in incognito mode

### Videos Not Working
- Verify API key in Settings
- Check the key has YouTube API enabled
- Ensure you haven't exceeded daily quota

## 📱 Install as App

### On Desktop (Chrome/Edge)
1. Look for install icon in address bar
2. Click to install
3. Opens like a native app!

### On Mobile
1. Open in Chrome/Safari
2. Tap menu → "Add to Home Screen"
3. Access from home screen

## 🎨 Customize

### Change Focus Timer
- Default: 25 min focus, 5 min break
- Adjust in the Focus Timer section
- Changes apply immediately

### Dark Mode
- Coming soon!
- For now, use browser dark mode extensions

## ❓ Need Help?

1. Check the main **README.md** for detailed docs
2. See **FIXES_AND_IMPROVEMENTS.md** for technical details
3. Check browser console (F12) for errors

## 🎓 Study Tips

### With Nora:
1. **Morning**: Review calendar, plan day
2. **Classes**: Take notes during lectures
3. **Study**: Use flashcards, focus timer
4. **Assignments**: Track in classes, check calendar
5. **Evening**: Review notes, check grammar

### Best Practices:
- Review flashcards daily
- Use focus timer for deep work
- Take regular breaks
- Export data weekly
- Keep assignments updated

## 🌟 You're Ready!

You now know everything to get started with Nora. Happy studying! 🎓

---

**Quick Access:**
- Dashboard: Overview of everything
- Notes: Your main workspace
- Classes: Track coursework
- Flashcards: Study and memorize
- Calendar: See all deadlines

**Support:**
Open an issue if you find bugs or need features!
