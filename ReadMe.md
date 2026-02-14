# 🌙 Nocturne v3.2.0

**24x7 Personal Monitoring Assistant**

A focused monitoring dashboard for tracking aurora conditions and breaking news - all from free APIs with no keys required!

![Version](https://img.shields.io/badge/version-3.2.0-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)
![Tests](https://img.shields.io/badge/tests-45%20passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📸 Module Overview

| Module | Description |
|--------|-------------|
| **Aurora** | Binary GO/NO GO decision based on real space physics data + current weather |
| **News** | Multi-source RSS aggregation with built-in reader panel |

---

## 🤖 For AI Agents

> **⚠️ IMPORTANT**: Before making any changes to this codebase, please read **[QUICKREF.md](QUICKREF.md)** first. It contains complete technical specifications, API documentation, and architecture details.

---

## 🚀 Features

### 🌌 Aurora Tracker
- **Binary Decision**: GO or NO GO based on actual space physics
- **Location-Aware**: Calculates if aurora can reach YOUR latitude
- **Real-time Data**: DSCOVR/ACE satellite solar wind data
- **NOAA OVATION Model**: Official aurora forecast (30-90 min prediction)
- **Local Sky Check**: Cloud coverage at your GPS location
- **Current Weather**: Today's conditions right on the aurora page
- **Smart Viewing Tips**: Weather-based recommendations for aurora viewing
- **7 Space Weather Metrics**: Bz, Speed, Pressure, Density, Bt, Clock Angle, Duration

### 📰 Breaking News
- **Multi-source aggregation**: BBC, NPR, TechCrunch, CNBC, Bloomberg, etc.
- **Built-in Reader**: Click any headline to read in a clean, dark, ad-free panel
- **Category filtering**: Technology, Business, Science, etc.
- **Time-based sorting** with relative timestamps
- **Breaking news highlights**

---

## 🛠️ Technical Stack

### Free Data Sources (No API Keys Required!)
| Source | Data Provided |
|--------|---------------|
| NOAA DSCOVR/ACE | Real-time solar wind data |
| NOAA OVATION | Aurora probability forecast |
| Open-Meteo | Weather and cloud coverage |
| RSS Feeds | News from major outlets |

### Tech Stack
- **Backend**: Node.js 18+ with native HTTP (no Express)
- **Frontend**: Vanilla JavaScript ES Modules
- **Styling**: CSS3 with CSS Variables (dark/light themes)
- **Charts**: Custom SVG-based (no dependencies)
- **PWA**: Service Worker for offline support
- **Testing**: Node.js built-in test runner (45 tests)

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone <repo-url>
cd nocturne

# Install dependencies (just dotenv!)
npm install

# Start the server
npm start

# Run tests
npm test
```

Visit **http://localhost:8000**

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Aurora |
| `2` | News |
| `R` | Refresh current view |

---

## 📱 Mobile Support

- **Touch-optimized** tabs with 48px+ tap targets
- **Responsive design** - single column on mobile
- **PWA installable** - add to home screen
- **Offline support** via Service Worker

### Install as PWA

1. Open in Chrome/Edge on mobile
2. Tap the menu → "Add to Home Screen"
3. Enjoy native-like experience!

---

## 🔧 Configuration (Optional)

Create a `.env` file for optional features:

```env
# Server
PORT=8000

# Email Alerts (Optional - requires Gmail App Password)
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
EMAIL_RECIPIENTS=you@email.com,friend@email.com
EMAIL_COOLDOWN=60

# Alert Location (for aurora notifications)
ALERT_LATITUDE=47.6
ALERT_LONGITUDE=-122.3
ALERT_LOCATION_NAME=Seattle, WA

# Module Toggles
AURORA_ENABLED=true
NEWS_ENABLED=true
```

---

## 📊 Project Structure

```
nocturne/
├── server.js              # Main server
├── package.json
├── QUICKREF.md            # Technical reference (READ FIRST!)
├── ReadMe.md              # This file
│
├── src/
│   ├── index.html         # Main SPA entry
│   ├── css/
│   │   ├── styles.css     # Base styles
│   │   ├── nocturne.css   # Module styles
│   │   └── charts.css     # Chart styles
│   ├── js/
│   │   ├── nocturne.js        # Main controller
│   │   ├── aurora.js          # Aurora decision logic
│   │   └── charts.js          # SVG chart library
│   └── modules/
│       ├── aurora/
│       └── news/          # Includes built-in reader
│
├── public/
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
│
└── tests/
    └── server.test.js     # 45 comprehensive tests
```

---

## 🚀 Deploy to Azure

The deploy script uses **Basic (B1) tier** for 24x7 Always On support:

```bash
# Quick deploy script included!
./quick-deploy.sh
```

Or manually:
```bash
# Create resource group
az group create --name nocturne-rg --location centralus

# Create Basic tier plan (supports Always On)
az appservice plan create --name nocturne-plan --resource-group nocturne-rg --sku B1 --is-linux

# Create and deploy
az webapp up --name nocturne --resource-group nocturne-rg --plan nocturne-plan --runtime "NODE|22-lts"

# Enable Always On
az webapp config set --name nocturne --resource-group nocturne-rg --always-on true
```

> **Note**: Basic tier (~$13/month) is required for 24x7 uptime. Free tier apps sleep after 20 minutes of inactivity.

---

## 🧪 Testing

```bash
# Run all 45 tests
npm test

# Test coverage by category:
# - Static Files: 10 tests
# - Aurora APIs: 12 tests
# - Weather APIs: 11 tests
# - News APIs: 2 tests
# - Status: 3 tests
# - Security: 7 tests
```

---

## 📋 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/solar-wind` | Real-time solar wind data |
| `GET /api/clouds` | Cloud coverage & forecast |
| `GET /api/ovation` | Aurora probability model |
| `GET /api/aurora/status` | GO/NO GO decision |
| `GET /api/weather/forecast` | Weather forecast |
| `GET /api/news/headlines` | News headlines |
| `GET /api/news/read` | Article content reader |
| `GET /api/status` | Server health |

---

## 📄 License

MIT License - Do what you want with it!

---

## 🙏 Credits

Data provided by:
- [NOAA Space Weather Prediction Center](https://www.swpc.noaa.gov/)
- [Open-Meteo](https://open-meteo.com/)
- Various RSS feeds (BBC, NPR, TechCrunch, CNBC, Bloomberg, Ars Technica, Hacker News, NASA)

---

**Built with ❤️ as a 24x7 monitoring companion**
