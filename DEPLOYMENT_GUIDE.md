# Deployment & Setup Guide

## 📋 Quick Start

### Step 1: Download Files
All refactored files are organized in the output folder:
```
├── index.html              (Main HTML file)
├── manifest.json           (PWA configuration)
├── sw.js                   (Service worker)
├── js/
│   ├── app.js
│   ├── utils/
│   │   ├── errorHandler.js
│   │   ├── validators.js
│   │   └── storage.js
│   └── modules/
│       ├── editor.js
│       ├── grammar.js
│       ├── flashcards.js
│       └── classes.js
├── README.md               (Full documentation)
├── IMPROVEMENTS_SUMMARY.md (What was fixed)
└── BEFORE_AFTER_COMPARISON.md (Code examples)
```

### Step 2: Upload to Web Server
```bash
# Option A: Via FTP
1. Connect to your FTP server
2. Create directory: /var/www/student-helper/
3. Upload all files maintaining directory structure
4. Ensure proper permissions (644 for files, 755 for directories)

# Option B: Via Terminal
scp -r ./* user@server.com:/var/www/student-helper/

# Option C: Via Git
git clone [your-repo] /var/www/student-helper
```

### Step 3: Verify Installation
```bash
# Check files are in place
ls -la /var/www/student-helper/
# Should show: index.html manifest.json sw.js js/

# Check permissions
chmod -R 644 /var/www/student-helper/*
chmod -R 755 /var/www/student-helper/js
```

### Step 4: Configure Web Server

#### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [QSA,L]
</IfModule>

# Add security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/javascript
</IfModule>

# Cache control
<FilesMatch "\.(html|xml|txt|json|js|css|woff2)$">
  Header set Cache-Control "public, max-age=3600"
</FilesMatch>

<FilesMatch "\.(jpg|jpeg|png|gif|ico|svg)$">
  Header set Cache-Control "public, max-age=31536000"
</FilesMatch>
```

#### Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    root /var/www/student-helper;
    index index.html;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.ckeditor.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com";

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript;
    gzip_vary on;

    # Cache Control
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(html|xml|txt|json)$ {
        expires 1h;
        add_header Cache-Control "public";
    }

    # Routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 5: Enable HTTPS (Recommended)
```bash
# Using Let's Encrypt with Certbot
certbot certonly --webroot -w /var/www/student-helper -d yourdomain.com
certbot install --nginx

# Or use cPanel/Plesk for one-click SSL
```

### Step 6: Test Installation

#### Browser Testing
1. Open browser and navigate to `https://yourdomain.com`
2. Verify all sections load:
   - Dashboard page
   - Editor with content saving
   - Grammar checker
   - Flashcards
   - Classes
3. Test data persistence:
   - Add content in editor
   - Refresh page
   - Content should still be there

#### DevTools Testing
```javascript
// Open DevTools > Console and run:

// Check storage
storage.keys()

// Check service worker
navigator.serviceWorker.getRegistrations()

// Check manifest
fetch('manifest.json').then(r => r.json()).then(console.log)

// Test error handling
throw new Error('Test error')
```

#### API Testing
```javascript
// Test grammar API
fetch('https://api.languagetool.org/v2/check', {
  method: 'POST',
  body: new URLSearchParams({ text: 'I have a mistke', language: 'en-US' })
}).then(r => r.json()).then(console.log)
```

### Step 7: Monitor & Maintain

#### Monitor Errors
```javascript
// Check console for errors
// Set up error tracking (optional):

// Option A: Sentry
import * as Sentry from "@sentry/browser";
Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production"
});

// Option B: Bugsnag
window.Bugsnag.start()
```

#### Monitor Performance
```javascript
// Add performance monitoring
window.addEventListener('load', () => {
  const perfData = performance.timing;
  console.log('Load time:', perfData.loadEventEnd - perfData.navigationStart);
});
```

#### Monitor Users
```javascript
// Optional: Add analytics
// Google Analytics, Mixpanel, etc.
```

---

## 🔐 Security Checklist

- [ ] **HTTPS Enabled**: Use SSL/TLS certificate
- [ ] **Security Headers Set**:
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-Frame-Options: SAMEORIGIN
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Content-Security-Policy configured
  - [ ] Referrer-Policy set
- [ ] **CORS Configured**: If using external APIs
- [ ] **Input Validation**: DOMPurify included
- [ ] **Error Messages**: No sensitive data exposed
- [ ] **Service Worker**: Only HTTPS
- [ ] **Dependencies**: Up to date (CKEditor, DOMPurify, etc.)
- [ ] **API Keys**: Not hardcoded in code
- [ ] **Rate Limiting**: Configured if needed
- [ ] **Backups**: Automated backup system
- [ ] **Monitoring**: Error tracking enabled

---

## 📊 Performance Checklist

- [ ] **Compression**: Gzip enabled on server
- [ ] **Caching**: Cache headers configured
- [ ] **Service Worker**: Caching strategy active
- [ ] **Images**: Optimized (if any)
- [ ] **CSS**: Minified
- [ ] **JavaScript**: Combined & minified (optional)
- [ ] **Lazy Loading**: Enabled for heavy resources
- [ ] **Database**: Optimized queries (if applicable)
- [ ] **CDN**: Using CDN for external libraries
- [ ] **Lighthouse**: Score > 80

### Lighthouse Testing
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Test your site
lighthouse https://yourdomain.com --view

# Expected scores:
# Performance: 85+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

---

## 🧪 Pre-Launch Testing

### Manual Testing
- [ ] Test all features work
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Test offline functionality
- [ ] Test data persistence
- [ ] Test error handling
- [ ] Test all buttons/links
- [ ] Test form validation
- [ ] Test responsive design
- [ ] Test keyboard navigation

### Browser Compatibility
```javascript
// Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers
- Older browsers (if needed)
```

### Mobile Testing
```bash
# Using Chrome DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test various screen sizes
4. Test touch interactions
5. Test landscape/portrait

# Physical testing
- iPhone/iPad
- Android phones
- Tablets
```

---

## 📱 PWA Installation

### Enable PWA Features
The manifest.json is already configured for PWA. To install:

**Desktop (Chrome):**
1. Navigate to application
2. Click install button (or right-click > Install app)
3. App appears as standalone window

**Mobile:**
1. Add to home screen (varies by browser)
2. Works offline with cached files
3. Respects device orientation

### Test PWA Offline
```javascript
// Simulate offline in DevTools
1. DevTools > Network tab
2. Check "Offline" checkbox
3. App should still work
4. Data persists across offline sessions
```

---

## 🚨 Troubleshooting

### Issue: Service Worker Not Registering
```javascript
// Solution 1: Check HTTPS
// Service workers require HTTPS (except localhost)

// Solution 2: Clear cache
// DevTools > Application > Cache Storage > Delete all

// Solution 3: Check browser console
// Look for errors in console.log
```

### Issue: Data Not Persisting
```javascript
// Solution 1: Check storage
storage.get('student-helper-editor-content')

// Solution 2: Check quotas
if (navigator.storage) {
  navigator.storage.estimate().then(estimate => {
    console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
  });
}

// Solution 3: Clear storage
storage.clear()
```

### Issue: Grammar Checker Timing Out
```javascript
// Solution 1: Check API availability
fetch('https://api.languagetool.org/v2/languages')

// Solution 2: Increase timeout
// In grammar.js, change:
this.REQUEST_TIMEOUT = 15000; // Was 10000
```

### Issue: Mobile Installation Not Working
```javascript
// Solution 1: Verify manifest.json
// Must be valid JSON, all required fields

// Solution 2: Check manifest link
// index.html must have:
// <link rel="manifest" href="manifest.json">

// Solution 3: Icons must load
// Check manifest icons can be fetched
```

---

## 📈 Post-Launch Monitoring

### Daily Tasks
- [ ] Check error logs
- [ ] Verify service worker active
- [ ] Check API response times
- [ ] Monitor server resources

### Weekly Tasks
- [ ] Review analytics
- [ ] Check for broken links
- [ ] Test all features
- [ ] Review user feedback
- [ ] Update dependencies (if needed)

### Monthly Tasks
- [ ] Security audit
- [ ] Performance review
- [ ] Backup verification
- [ ] User growth metrics
- [ ] Plan improvements

### Monitoring Services
```javascript
// Free options:
1. UptimeRobot - Monitor availability
2. Sentry - Error tracking
3. Google Analytics - User behavior
4. Lighthouse CI - Performance tracking

// Paid options:
1. New Relic - Full monitoring
2. Datadog - Infrastructure
3. Bugsnag - Advanced error tracking
```

---

## 🔄 Deployment via CI/CD

### GitHub Actions Example
```yaml
name: Deploy Student Helper

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_KEY }}
        script: |
          cd /var/www/student-helper
          git pull origin main
          # Run any build steps if needed
          echo "Deployment complete!"
```

### GitLab CI Example
```yaml
deploy:
  stage: deploy
  script:
    - scp -r ./* user@server.com:/var/www/student-helper/
  only:
    - main
```

---

## 📞 Support & Documentation

### Resources
- README.md - Full feature documentation
- IMPROVEMENTS_SUMMARY.md - What was fixed
- BEFORE_AFTER_COMPARISON.md - Code examples
- Browser DevTools - Debugging tools
- API Documentation - LanguageTool, CKEditor, DOMPurify

### Getting Help
1. Check console for error messages
2. Review README.md documentation
3. Check browser DevTools
4. Test in different browser
5. Clear cache and reload
6. Check API availability

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All files downloaded and organized
- [ ] Security headers configured
- [ ] HTTPS/SSL enabled
- [ ] Service worker tested
- [ ] Offline functionality verified
- [ ] Data persistence tested
- [ ] All features working
- [ ] Lighthouse audit passed

### Deployment
- [ ] Files uploaded to server
- [ ] File permissions correct (644/755)
- [ ] Web server configured
- [ ] DNS/domain pointing correct
- [ ] SSL certificate active
- [ ] Service worker registered
- [ ] Cache cleared

### Post-Deployment
- [ ] Site loads correctly
- [ ] All features work
- [ ] Service worker active
- [ ] Error tracking working
- [ ] Analytics configured
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Team notified

---

## 🎉 You're Ready!

Your Student Helper application is now:
- ✅ Deployed and live
- ✅ Secure with HTTPS
- ✅ Optimized for performance
- ✅ Protected against errors
- ✅ Monitored for issues
- ✅ Ready for users

**Congratulations on launching a production-ready application!**

---

*For questions or issues, refer to the included documentation or check the browser console for error messages.*
