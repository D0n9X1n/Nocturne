# QUICKREF.md - Aurora Tracker v1.0

> **For AI Agents**: Complete technical specifications for the Aurora Tracker application.

---

## System Overview

**Purpose**: Real-time aurora visibility tracker with binary GO/NO GO decision.

**Core Decision**: **GO** or **NO GO** (no middle ground!) based on:
1. **Space Weather** - Is aurora actually happening? (Bz, speed, pressure)
2. **Sky Conditions** - Can you see it? (cloud coverage by layer)

**Key Insight**: We use **Bz field** and real-time satellite data instead of Kp index because:
- Kp is a 3-hour average, delayed by hours
- Bz and pressure are real-time from DSCOVR/ACE satellites
- Physics-based decision vs lagging indicator

**Architecture**: Node.js server proxying NOAA + Open-Meteo APIs → Responsive HTML/CSS/JS frontend

---

## File Structure

```
aurora-tracker/
├── server.js                    # Backend: API proxy, data processing, email alerts
├── src/
│   ├── index.html               # Frontend: Responsive 2-column layout
│   ├── js/aurora-tracker.js     # Client: Decision logic, rendering
│   └── css/styles.css           # Styling: Mobile-first, desktop 2-column
├── package.json                 # Dependencies
├── quick-deploy.sh              # Azure deployment script
├── QUICKREF.md                  # This file (AI reference)
└── ReadMe.md                    # Human-readable documentation
```

---

## Data Sources

### NOAA Space Weather APIs

| API | URL | Data |
|-----|-----|------|
| Plasma | `services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json` | Speed, Density, Temperature |
| Magnetometer | `services.swpc.noaa.gov/products/solar-wind/mag-7-day.json` | Bx, By, Bz, Bt |
| Scales | `services.swpc.noaa.gov/products/noaa-scales.json` | G-Scale (storm level) |

### Derived Calculations

| Metric | Formula | Purpose |
|--------|---------|---------|
| **Dynamic Pressure** | `P = 1.67e-6 × density × speed²` (nPa) | Magnetosphere compression |
| **Clock Angle** | `θ = atan2(By, Bz)` (degrees) | IMF direction, 180° = best |
| **Bz Duration** | Count of southward readings in last 30 min | Sustained vs spike |

### Cloud Data

- **Source**: Open-Meteo API (`api.open-meteo.com/v1/forecast`)
- **Layers**: Low (0-2km), Mid (2-6km), High (6km+)
- **Trend**: 6-hour forecast direction (clearing/increasing/stable)

---

## API Endpoints

### GET /api/solar-wind

Returns processed space weather data with all derived metrics.

```typescript
{
  time: string;           // ISO timestamp
  // Raw measurements
  speed: number;          // km/s (normal: 400, storm: 600+)
  density: number;        // p/cm³ (normal: 5, storm: 15+)
  temperature: number;    // K
  bz: number;             // nT (negative = southward = aurora!)
  bt: number;             // nT (total field)
  bx: number;             // nT (sunward component)
  by: number;             // nT (east-west component)
  // Derived values
  pressure: number;       // nPa (dynamic pressure)
  clockAngle: number;     // degrees (180 = pure south)
  bzSouthDuration: number;// minutes in last 30 min
  auroraPower: number;    // GW estimate
  // Scores (% of G4 baseline)
  scores: {
    bz: number;
    speed: number;
    density: number;
    bt: number;
    pressure: number;
    temperature: number;
  };
  similarity: number;     // 0-99% match to G4 storm
  // NOAA official
  gScale: number;         // 0-5
  gText: string;          // "none" | "minor" | etc.
  // Reference
  baseline: {             // G4 storm values for comparison
    speed: 750, density: 25, bz: 30, bt: 40, pressure: 15, ...
  }
}
```

### GET /api/clouds?lat={lat}&lon={lon}

Returns cloud coverage with forecast trend.

```typescript
{
  total: number;     // 0-100%
  low: number;       // 0-100% (blocks aurora)
  mid: number;       // 0-100% (reduces clarity)
  high: number;      // 0-100% (minor effect)
  visibility: number;// meters
  trend: string;     // "clearing" | "increasing" | "stable"
  forecast: number[];// Next 6 hours low cloud %
  time: string;      // ISO timestamp
}
```

---

## Decision Logic

### Binary GO / NO GO Rules

```javascript
// ABSOLUTE NO GO CONDITIONS (physics says no aurora)
if (bz >= 0)           → NO GO  // Northward IMF, magnetosphere closed
if (bz > -3 && pressure < 3) → NO GO  // Too weak for aurora
if (lowClouds > 50%)   → NO GO  // Can't see through low clouds
if (skyClarity < 35%)  → NO GO  // Too cloudy overall

// GO CONDITIONS (stack positive factors)
goScore = 0
if (bz < -15)    goScore += 40  // Extreme southward
if (bz < -8)     goScore += 30  // Strong southward
if (bz < -3)     goScore += 15  // Good southward
if (bzDuration >= 15) goScore += 10  // Sustained
if (speed > 600) goScore += 15  // CME speeds
if (speed > 450) goScore += 8   // Enhanced
if (pressure > 3) goScore += 8  // High pressure
if (goodClockAngle) goScore += 5  // 120°-240°
if (sky >= 60)   goScore += 10  // Clear sky
if (sky >= 40)   goScore += 5   // Partly clear

// DECISION
if (goScore >= 50 && sky >= 60) → GO (high confidence)
if (goScore >= 35 && sky >= 40) → GO (good conditions)
if (goScore >= 25 && sky >= 50) → GO (borderline but worth trying)
else → NO GO
```

### Why No MAYBE?

- User needs actionable decision
- MAYBE leads to paralysis
- Either conditions justify going out, or they don't
- Borderline cases get GO because aurora viewing opportunities are rare

---

## G4 Storm Baseline (May 10-11, 2024)

Reference values from the strongest geomagnetic storm in 20+ years:

| Metric | Peak Value | Typical Quiet |
|--------|------------|---------------|
| Bz | -30 nT | -2 to +2 nT |
| Speed | 750 km/s | 400 km/s |
| Density | 25 p/cm³ | 5 p/cm³ |
| Bt | 40 nT | 5 nT |
| Pressure | 15 nPa | 2 nPa |
| Temperature | 500,000 K | 100,000 K |

**Similarity Score Weights**:
- Bz: 40% (most critical)
- Speed: 20%
- Density: 15%
- Bt: 10%
- Pressure: 10%
- Temperature: 5%

---

## Sky Score Calculation

```javascript
// Weight by impact on visibility
const weighted = low * 1.0 +    // Low clouds = total block
                 mid * 0.7 +    // Mid clouds = partial
                 high * 0.3;    // High clouds = minor
const skyScore = 100 - weighted;
```

---

## Email Alerts

Triggered when GO conditions detected:
- Similarity ≥ 40% AND
- Bz < -5 nT AND
- Cooldown period elapsed (default 60 min)

**Configuration** (environment variables):
```
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-specific-password
FROM_EMAIL=your-email@gmail.com
EMAIL_RECIPIENTS=user1@email.com,user2@email.com
EMAIL_COOLDOWN=60
```

---

## Frontend Structure

### Desktop Layout (768px+)

```
┌─────────────────────────────────────────────┐
│ Header                                       │
├───────────────┬─────────────────────────────┤
│ Left Column   │ Right Column                 │
│ (sticky)      │                              │
│               │                              │
│ ┌───────────┐ │ ┌─────────────────────────┐ │
│ │ GO / NO GO│ │ │ Storm Scale (G0-G5)     │ │
│ └───────────┘ │ └─────────────────────────┘ │
│               │                              │
│ G4 Similarity │ Space Weather Metrics       │
│               │ ┌─────┬─────┬─────┐        │
│ Aurora | Sky  │ │ Bz  │Speed│Press│        │
│ factors       │ ├─────┼─────┼─────┤        │
│               │ │Dens │ Bt  │Newel│        │
│ Recommendation│ ├─────┼─────┼─────┤        │
│               │ │Clock│Durat│Epsil│        │
│ Cloud Cover   │ └─────┴─────┴─────┘        │
│               │                              │
│               │ Viewing Info                 │
└───────────────┴─────────────────────────────┘
```

### Mobile Layout (<768px)

Single column, same components stacked vertically.

---

## Development

### Run Locally

```bash
npm install
node server.js
# Open http://localhost:8000
```

### Key Files to Modify

| Change | File(s) |
|--------|---------|
| Decision thresholds | `src/js/aurora-tracker.js` → `getDecision()` |
| Add new metric | `server.js` + `index.html` + `aurora-tracker.js` |
| Styling | `src/css/styles.css` |
| API endpoints | `server.js` |
| Email alerts | `server.js` → `checkAndSendAlerts()` |

---

## Caching

| Cache | TTL | Purpose |
|-------|-----|---------|
| Solar wind | 2 min | Reduce NOAA API load |
| Cloud data | 15 min | Weather changes slowly |

---

## Error Handling

- API failures return mock/cached data
- Cloud API failure defaults to clear sky (fail toward GO)
- Network errors show NO GO with retry button
- All errors logged to console

---

## Testing

```bash
# Check server
curl http://localhost:8000/api/solar-wind | jq

# Check clouds
curl "http://localhost:8000/api/clouds?lat=47.6&lon=-122.3" | jq

# Verify page loads
open http://localhost:8000
```
