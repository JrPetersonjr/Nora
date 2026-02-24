# Nora Student Helper – Features & Build Instructions

## Overview
Nora Student Helper is a browser-based, all-in-one study companion for students. It provides tools for note-taking, grammar checking, flashcards, class/assignment management, project tracking, calendar visualization, study videos, focus timer, and more. The app is a Progressive Web App (PWA) and works offline (except for features requiring external APIs).

---

## Features

### 1. Rich Text Editor
- **Purpose:** Take and organize study notes with rich formatting.
- **Key Details:**
  - Uses CKEditor 5 for editing.
  - Auto-saves every 30 seconds to localStorage.
  - Restores content on reload.
  - Exports notes as plain text.

### 2. Grammar Checker
- **Purpose:** Check writing for grammar, spelling, and style issues.
- **Key Details:**
  - Integrates with LanguageTool API (no API key required).
  - Validates and sanitizes input.
  - Displays suggestions and highlights issues.

### 3. Flashcards
- **Purpose:** Create, manage, and study flashcard sets.
- **Key Details:**
  - Multiple sets supported, each with cards (front/back).
  - Tracks mastery and study progress.
  - Gamified study modal with instant feedback.
  - Data stored in localStorage.

### 4. Class & Assignment Management
- **Purpose:** Track classes, assignments, and due dates.
- **Key Details:**
  - Add/edit/delete classes and assignments.
  - Assignments can have due dates and completion status.
  - Progress visualization per class.

### 5. Assignment Calendar
- **Purpose:** Visualize all deadlines in a monthly calendar.
- **Key Details:**
  - Aggregates assignments and projects with due dates.
  - Clickable days show event details.
  - Color-coded for clarity.

### 6. Project Tracker
- **Purpose:** Track major projects with deadlines and completion status.
- **Key Details:**
  - Add/edit/remove projects.
  - Mark projects as complete/incomplete.
  - Integrated with calendar view.

### 7. Study Videos
- **Purpose:** Search and watch educational videos.
- **Key Details:**
  - Uses YouTube Data API v3 (API key required, set in Settings).
  - Search, preview, and play videos in-app.

### 8. Focus Timer (Pomodoro)
- **Purpose:** Help students focus using Pomodoro technique.
- **Key Details:**
  - 25 min focus, 5 min break (customizable).
  - Audio notifications.
  - Tracks completed sessions.

### 9. Notifications & Error Handling
- **Purpose:** User-friendly notifications and robust error handling.
- **Key Details:**
  - Centralized error handler for uncaught errors and promise rejections.
  - In-app notifications for actions, errors, and info.

### 10. Data Storage & Privacy
- **Purpose:** Store all user data locally for privacy and offline access.
- **Key Details:**
  - Uses localStorage (with in-memory fallback).
  - Export/import data via Settings.
  - No data sent to external servers (except APIs).

### 11. Progressive Web App (PWA)
- **Purpose:** Installable as a desktop/mobile app, works offline.
- **Key Details:**
  - Service Worker caches all essential files.
  - Offline access for all features except grammar check and videos.

---

## Build & Deployment Steps

### 1. Local Development
- **Clone or download** the repository.
- **Start a local server:**
  - Python 3: `python -m http.server 8000`
  - Node.js: `npx serve`
- **Open browser:** Go to `http://localhost:8000`

### 2. Deploy to Web
- Upload all files to any static hosting service (GitHub Pages, Netlify, Vercel, etc.).

### 3. PWA Installation
- Open the app in Chrome/Edge.
- Click the "Install" button in the address bar to add as a desktop/mobile app.

### 4. YouTube API Setup (Optional)
- For Study Videos, get a YouTube Data API v3 key from Google Cloud Console.
- Paste the API key in Settings.

---

## File Structure (Key Files)
- `index.html` – Main HTML file
- `manifest.json` – PWA manifest
- `sw.js` – Service Worker
- `js/app.js` – Main app controller
- `js/modules/` – Feature modules (editor, grammar, flashcards, classes, extras)
- `js/utils/` – Utilities (storage, validators, error handler)
- `css/styles.css` – Main styles

---

## Extending the App
- Add new features in `js/modules/extras.js` or a new module.
- Add UI in `index.html` and styles in `css/styles.css`.

---

## Troubleshooting
- See README.md for common issues and solutions.

---

**This document describes all implemented features and build steps for the Nora Student Helper project.**
