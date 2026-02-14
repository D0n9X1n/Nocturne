# QUICKREF.md - Nocturne v3.2.0

> **⚠️ FOR AI AGENTS**: Read this file FIRST before making any changes to this codebase. This contains the complete technical specifications for the Nocturne 24x7 monitoring service.

---

## 🎯 System Overview

**Project Name**: Nocturne  
**Purpose**: 24x7 personal monitoring assistant for aurora and news  
**Version**: 3.2.0  
**Node.js**: 18+ (ES Modules)  
**Deployment**: Azure App Service (Basic B1 for Always On)

### Core Modules

| Module | Description | Data Source |
|--------|-------------|-------------|
| Aurora | Real-time aurora visibility + current weather | NOAA DSCOVR/ACE, Open-Meteo |
| News | Breaking news from RSS feeds + built-in reader | BBC, NPR, CNBC, etc. |

> **Note**: Weather data is integrated into the Aurora page for viewing conditions. No separate Weather tab.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  src/index.html → Tabbed SPA (vanilla JS ES Modules)        │
│  src/modules/*  → Individual module JS files                │
│  src/css/*      → Modular stylesheets                       │
└─────────────────────────────────────────────────────────────┘
                              ↑ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                     server.js (Node.js)                      │
│  - API proxy with caching                                    │
│  - Article content extraction (reader)                       │
│  - Static file serving                                       │
│  - Email alerts (optional)                                   │
│  - Daily summary emails (optional)                           │
└─────────────────────────────────────────────────────────────┘
                              ↑ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    External APIs (FREE)                      │
│  NOAA, Open-Meteo, RSS Feeds                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
nocturne/
├── server.js                    # Backend: all API routes
├── package.json                 # Dependencies (minimal: dotenv only)
├── .env                         # Optional config (email, alerts)
├── .eslintrc.json               # ESLint config (2-space indent)
├── quick-deploy.sh              # Azure deployment script
├── QUICKREF.md                  # This file - AI reference
├── ReadMe.md                    # Human documentation
│
├── src/
│   ├── index.html               # Main SPA entry point
│   ├── css/
│   │   ├── styles.css           # Base/reset styles
│   │   ├── nocturne.css         # Module styles
│   │   └── charts.css           # Chart component styles
│   ├── js/
│   │   ├── nocturne.js          # Main controller & router
│   │   ├── aurora.js            # Aurora decision logic
│   │   └── charts.js            # SVG chart library
│   └── modules/
│       ├── aurora/aurora.js     # Includes current weather display
│       └── news/news.js         # Includes built-in article reader
│
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── favicon.svg              # App favicon
│   └── sw.js                    # Service worker
│
└── tests/
    └── server.test.js           # 45 tests (Node.js test runner)
```

---

## 🔌 API Endpoints

### Aurora APIs

| Endpoint | Description | Cache |
|----------|-------------|-------|
| `GET /api/solar-wind` | Real-time solar wind data | 2 min |
| `GET /api/clouds?lat=&lon=` | Cloud coverage & forecast | 15 min |
| `GET /api/ovation?lat=&lon=` | NOAA aurora probability | 10 min |
| `GET /api/aurora/status` | Combined aurora GO/NO GO status | 2 min |

### News APIs

| Endpoint | Description | Cache |
|----------|-------------|-------|
| `GET /api/news/headlines` | Aggregated RSS news | 5 min |
| `GET /api/news/breaking` | Recent breaking articles | 5 min |
| `GET /api/news/read?url=` | Extract article content for reader | 30 min |

### Other APIs

| Endpoint | Description | Cache |
|----------|-------------|-------|
| `GET /api/weather/forecast?lat=&lon=` | Full weather forecast | 15 min |
| `GET /api/status` | Server health & module status | None |

---

## 📰 News Reader

The news module includes a **built-in article reader** that extracts content server-side:

- Click any headline → opens a dark, clean reading overlay
- Server fetches the article HTML and extracts: title, author, date, hero image, paragraphs
- Filters out ads, navigation, scripts, and junk content
- Shows estimated read time based on word count
- Fallback link to original article if extraction fails
- Close with ✕ button, Escape key, or clicking outside the panel

### Reader API (`/api/news/read?url=...`)

Returns:
```json
{
  "title": "Article Title",
  "author": "Author Name",
  "publishedAt": "2024-01-15T...",
  "image": "https://...",
  "paragraphs": ["First paragraph...", "Second paragraph..."],
  "sourceUrl": "https://original-url",
  "wordCount": 842
}
```

---

## 🌌 Aurora Module Decision Logic

### Binary GO / NO GO (No MAYBE!)

The aurora module uses **real-time physics-based** decision making:

1. **Darkness Check**: Sun must be below -6° (civil twilight)
2. **Bz Field**: Must be southward (negative) - this opens the magnetosphere
3. **Latitude Reach**: Calculate if aurora can reach user's latitude
4. **Sky Clarity**: Low clouds < 50% blocking

### Integrated Current Weather

The Aurora page displays **current weather conditions** to help with viewing decisions:

- **Temperature & Feels Like**: Know what to wear when going outside
- **Weather Description**: Current conditions (clear, cloudy, rain, snow)
- **Humidity & Wind**: Environmental factors for comfort
- **Visibility**: Crucial for aurora viewing
- **Viewing Tip**: Smart tip based on current conditions (bundling up, rain warning, etc.)

### Why Bz Over Kp?

- **Kp** is a 3-hour lagging average
- **Bz** is real-time from DSCOVR satellite at L1 point
- Bz southward = magnetosphere opens = aurora possible
- Bz northward = magnetosphere closed = no aurora (regardless of Kp)

### G4 Storm Baseline (May 10-11, 2024)

Reference values from the strongest storm in 20+ years:
```javascript
{ speed: 750, density: 25, bz: -30, bt: 40, pressure: 15 }
```

---

## 🎨 Frontend Structure

### CSS Architecture

- **styles.css**: Base reset, variables, typography
- **nocturne.css**: All module-specific styles + reader overlay
- **charts.css**: SVG chart styling

### CSS Variables

```css
:root {
  --bg-primary: #0a0a0f;
  --bg-card: #12121a;
  --text: #ffffff;
  --text-dim: #8b8ba3;
  --accent: #6366f1;
  --go: #22c55e;
  --no-go: #ef4444;
}
```

### Mobile-First Design

- Tabs show icons only on mobile (< 640px)
- Touch-friendly: 48px min tap targets
- Horizontal scroll for tabs with scroll-snap
- All touch events use `touch-action: manipulation`

---

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server
PORT=8000

# Email Alerts (Optional)
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=app-specific-password
EMAIL_RECIPIENTS=user1@email.com,user2@email.com
EMAIL_COOLDOWN=60

# Alert Location
ALERT_LATITUDE=47.6
ALERT_LONGITUDE=-122.3
ALERT_LOCATION_NAME=Seattle, WA

# Module Toggles
AURORA_ENABLED=true
NEWS_ENABLED=true
```

---

## 🧪 Testing

Run all 45 tests:
```bash
npm test
```

Test structure:
- **Static Files** (10 tests): HTML, CSS, JS, PWA assets
- **Aurora APIs** (12 tests): Solar wind, clouds, ovation
- **Weather APIs** (11 tests): Forecast, conditions
- **News APIs** (2 tests): Headlines, articles
- **Status** (3 tests): Health checks
- **Security** (7 tests): Error handling, validation

---

## 🚀 Deployment

### Azure App Service

```bash
# Use the quick-deploy script
./quick-deploy.sh

# Or manual deployment
az webapp up --name nocturne --resource-group nocturne-rg --plan nocturne-plan --runtime "NODE|22-lts"
az webapp config set --name nocturne --resource-group nocturne-rg --always-on true
```

> **Important**: Use Basic tier (B1) or higher for Always On. Free tier sleeps after 20 min.

---

## 📋 Version Maintenance

When releasing a new version, update ALL these files:

| File | Location |
|------|----------|
| `package.json` | `"version": "x.x.x"` (source of truth) |
| `QUICKREF.md` | Title line |
| `server.js` | Startup console log |
| `src/js/aurora.js` | Header comment |
| `src/css/styles.css` | Header comment |

---

## ⚠️ Common Pitfalls

1. **ESLint**: Uses 2-space indentation. Run `npx eslint --fix` before committing.
2. **ES Modules**: All files use `import/export`. No `require()`.
3. **CORS**: Server adds `Access-Control-Allow-Origin: *` to all API responses.
4. **Caching**: External API calls are cached. Check cache TTL before debugging.

---

## 🔗 External Resources

- [NOAA Space Weather](https://www.swpc.noaa.gov/)
- [Open-Meteo API](https://open-meteo.com/)
