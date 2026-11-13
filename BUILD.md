# EduFlow LMS — Build & run guide

Static web app (HTML / CSS / JS). No heavy compile step for the web demo.

---

## 1. Run locally (for development & offline demo)

### Option A — npm (recommended)

```bash
git clone https://github.com/jlephoto23-collab/EduFlow-LMS.git
cd EduFlow-LMS
npm start
```

Open **http://localhost:3000**

### Option B — Python

```bash
cd EduFlow-LMS
python3 -m http.server 3000
```

Open **http://localhost:3000**

### Option C — VS Code

Install “Live Server” → right-click `index.html` → **Open with Live Server**.

> Do **not** open `index.html` as a `file://` URL — ES modules need an HTTP server.

---

## 2. Live website (already online)

**https://jlephoto23-collab.github.io/EduFlow-LMS/**

GitHub Pages serves the `main` branch root. After you push changes, wait 1–2 minutes and hard-refresh (`Ctrl+F5`).

---

## 3. Install as PWA (phone / desktop)

1. Open the live URL (or localhost) in **Chrome** or **Edge**.
2. Menu → **Install app** / **Add to Home screen**.
3. EduFlow opens full-screen like a native app.

`manifest.json` and theme colours are already set.

---

## 4. Build Android APK (Capacitor)

### Prerequisites

- Node.js 18+
- Android Studio (with Android SDK)
- Java 17 (Android Studio usually provides this)

### Steps

```bash
cd EduFlow-LMS
npm install   # optional; scripts use npx

# Add Android platform (first time only)
npx cap add android

# Copy web assets into the native project
npx cap sync

# Open in Android Studio
npx cap open android
```

In **Android Studio**:

1. Wait for Gradle sync to finish.
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. Install the APK on a device or emulator (**Run ▶**).

`capacitor.config.json` uses:

- **appId:** `com.eduflow.lms`
- **appName:** EduFlow LMS  
- **webDir:** `.` (project root)

### Notes

- For production, prefer a release-signed APK/AAB in Play Console.
- Demo data uses **localStorage** on the device until Firebase is enabled.
- To point the app at the live site instead of bundled files, you can set a Capacitor server URL (optional advanced setup).

---

## 5. Firebase (production multi-user)

See **README.md**. Summary:

1. Create a Firebase project → enable **Email/Password** auth.
2. Create **Firestore** database.
3. Paste config into `js/firebase-config.js`.
4. Add authorized domain for GitHub Pages.
5. Hard-refresh — badge can show **Live cloud** when configured.

Until then, the app runs in **demo mode** (localStorage + tab sync).

---

## 6. Project structure

```
EduFlow-LMS/
  index.html          # Shell + login + app frame
  manifest.json       # PWA
  package.json        # npm scripts
  capacitor.config.json
  css/styles.css
  icons/icon.svg
  js/
    app.js            # Loader (assembles app chunks)
    c0.js … c17.js    # App logic chunks
    store.js          # Data + seed + live sync
    firebase.js       # Cloud helpers
    firebase-config.js
  PITCH.md            # Client presentation script
  BUILD.md            # This file
  README.md
```

---

## 7. Demo credentials

| Role | Email | Password |
|------|--------|----------|
| Admin | admin@eduflow.test | admin123 |
| Learner | learner1@gmail.com | learner123 |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page / module errors | Use `npm start`, not `file://` |
| Old UI after deploy | Hard-refresh `Ctrl+F5` |
| Login fails | Use exact demo emails above; or **More → Reset demo data** after login as admin |
| Capacitor sync fails | Install Android Studio SDK; run `npx cap sync` again |
| APK has no data | Normal — first launch seeds localStorage on device |
