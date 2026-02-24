# How to Test and Debug the Student Helper App

## Quick Start
1. Open http://localhost:8000 in your browser
2. The **Dashboard** should appear automatically
3. Click **"Notes"** button in the sidebar
4. The **Notes Editor** section should show

## If Something Doesn't Work

### Check the Browser Console
1. **On Windows:** Press `F12` or `Ctrl+Shift+I`
2. **On Mac:** Press `Cmd+Option+I`
3. Click on the **Console** tab
4. You should see messages like:
   ```
   [App] Initialization starting...
   [App] - EditorModule created
   [App] StudentHelper initialized
   [App] Application ready!
   ```

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Dashboard shows but clicking "Notes" does nothing | Browser cache | Press `Ctrl+Shift+R` (hard refresh) |
| Console shows "ClassicEditor not loaded" | CKEditor CDN didn't load | Check network tab in browser tools |
| Editor shows but appears blank | CKEditor initialization failed | Check for errors in console |
| Nothing appears at all | Page didn't load | Refresh page, check server is running |

### If You See Red Error Messages
1. Read the error message carefully
2. Copy it from the console
3. Check if it mentions a specific file or function

### Network Issues
If you see 404 errors for files:
- `icon-192.png` ✓ OK to ignore (icon file)
- `favicon.ico` ✓ OK to ignore (browser default request)
- `sw.js` ✓ OK to ignore (service worker)

## Working Features

Once the app loads, you can:
- ✅ Type in the Notes editor
- ✅ Notes auto-save every 3 seconds
- ✅ Click through sections (Dashboard, Notes, Grammar, Flashcards, Classes, Calendar, etc.)
- ✅ Create and study flashcards
- ✅ Add classes and assignments
- ✅ View calendar with events
- ✅ Use the focus timer
- ✅ View and create projects

## Server is Running?
Make sure the server is still running in your terminal:
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

If you don't see this, run:
```powershell
cd "h:\AIRLOCK\STUDENT HELPER"
python -m http.server 8000
```

## Report Issues
If the console shows errors, please share:
1. The exact error message
2. Steps to reproduce (what button you clicked)
3. Screenshot of the console output

---
**Last Updated:** February 2, 2026
