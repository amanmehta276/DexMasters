# GateHub Frontend

A clean, fast, mobile-responsive frontend for the GateHub Engineering Resource Platform. Built with vanilla HTML, Tailwind CSS, and JavaScript — no frameworks, no build step.

## 🌐 Live URL

```
https://projectalps.netlify.app
```

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Structure |
| Tailwind CSS (CDN) | Styling |
| Vanilla JavaScript | Logic & API calls |
| Lucide Icons | Icon library |
| Google Fonts (Outfit) | Typography |
| Service Worker | PWA / offline caching |

## 📁 File Structure

```
frontend/
│
├── index.html          # Main SPA shell — all views live here
├── script.js           # All JS logic — state, API calls, routing, UI
├── style.css           # Custom CSS — branch themes, animations, scrollbar
├── manifest.json       # PWA manifest
├── service-worker.js   # Caches core assets for offline use
└── favicon.ico         # App icon
```

## 🖥️ Views / Pages

The app is a Single Page Application (SPA) — all views are sections inside `index.html`, toggled via the `router` object in `script.js`.

| View ID | Route | Description |
|---|---|---|
| `view-home` | `home` | Subject grid with branch filters |
| `view-files` | `files` | Files list for a selected subject |
| `view-offline` | `offline` | Offline vault (downloaded files) |
| `view-auth` | `auth` | Login / Register for student & admin |

## ⚙️ How It Works

### State Management
All app state is stored in a single `state` object:

```js
let state = {
    user:             null,       // Logged-in user object
    token:            null,       // JWT token
    vault:            [],         // Offline saved files (localStorage)
    currentView:      'home',     // Active view
    currentBranch:    'All',      // Active branch filter
    authMode:         'student',  // 'student' or 'admin'
    isLogin:          true,       // Login vs Register toggle
    selectedFile:     null,       // File selected for upload
    currentSubjectId: null,       // Currently open subject
    assetCountCache:  {},         // { subjectId: count } cache
    subjects:         [],         // All fetched subjects
};
```

### Routing
```js
router.navigate('home')
router.navigate('files', { id: 'em_1' })
router.navigate('offline')
router.navigate('auth')
```

### API Calls
All API functions are at the top of `script.js`:

| Function | Method | Endpoint |
|---|---|---|
| `apiLogin` | POST | `/auth/login` |
| `apiRegister` | POST | `/auth/register` |
| `apiFetchSubjects` | GET | `/subjects` |
| `apiCreateSubject` | POST | `/subjects` |
| `apiEditSubject` | PATCH | `/subjects/:id` |
| `apiDeleteSubject` | DELETE | `/subjects/:id` |
| `apiFetchFiles` | GET | `/files/:subjectId` |
| `apiUploadFile` | POST | `/files/upload` |
| `apiDeleteFile` | DELETE | `/files/:fileId` |

### Auth Flow
1. User opens `/auth` view and logs in via the form
2. JWT token and user object are stored in `localStorage`
3. On every page load, state is restored from `localStorage`
4. Admin-only UI elements (edit, delete, upload buttons) are shown/hidden based on `state.user.role`

### Admin Features (visible only when logged in as admin)
- **Create Subject** — opens `modal-create-subject`
- **Edit Subject** — pencil icon on each card, opens `modal-edit-subject` pre-filled
- **Delete Subject** — X icon on each card
- **Upload File / Add Link** — inside subject view, opens `modal-upload-file`
- **Delete File** — trash icon on each file row

## 🎨 Branch Themes

Each subject card gets a color theme based on its branch, defined in `style.css`:

```css
.branch-elec { --b-clr: #f59e0b; --b-bg: #fffbeb; }  /* Electrical — amber  */
.branch-extc { --b-clr: #10b981; --b-bg: #ecfdf5; }  /* Electronics — green */
.branch-cs   { --b-clr: #3b82f6; --b-bg: #eff6ff; }  /* CS & IT — blue      */
.branch-mech { --b-clr: #ef4444; --b-bg: #fef2f2; }  /* Mechanical — red    */
.branch-civ  { --b-clr: #8b5cf6; --b-bg: #f5f3ff; }  /* Civil — purple      */
```

## 📦 Modals

| Modal ID | Trigger | Purpose |
|---|---|---|
| `modal-create-subject` | Admin panel button | Create a new subject hub |
| `modal-edit-subject` | Pencil icon on card | Edit subject name, branch, description |
| `modal-upload-file` | "Add New Asset" button | Upload PDF or add external link |

## 📲 PWA Support

GateHub is installable as a Progressive Web App:
- `manifest.json` defines app name, icon, theme color
- `service-worker.js` caches `index.html`, `script.js`, `style.css` for offline use
- `<meta name="theme-color">` sets browser chrome color on mobile

## 🚀 Running Locally

No build step needed — just open with a local server:

```bash
# Using VS Code Live Server extension (recommended)
# Right-click index.html → Open with Live Server

# Or using Python
python -m http.server 5500

# Or using Node
npx serve .
```

Make sure `API_BASE` in `script.js` points to your local backend:

```js
const API_BASE = 'http://localhost:5000/api'; // for local dev
// const API_BASE = 'https://gatehub-backend.onrender.com/api'; // for production
```

## 🌍 Deployment

Hosted on **Netlify** (free tier).

- Connected to `amanmehta276/gatehub-frontend` GitHub repo
- Auto-deploys on every push to `main`
- No build command needed — static files served directly

## 🔗 Related

- **Backend Repo**: [gatehub-backend](https://github.com/amanmehta276/gatehub-backend)
- **Live Backend**: https://gatehub-backend.onrender.com