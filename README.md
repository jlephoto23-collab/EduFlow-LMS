# EduFlow LMS

Mobile-first **Learning Management System** for training providers.

Learners apply, get approved, complete NQF pilot modules and assessments, and receive results — with Gmail-linked inbox messages.

---

## Live demo

**https://jlephoto23-collab.github.io/EduFlow-LMS/**

| Role | Email | Password |
|------|--------|----------|
| **Administrator** | `admin@eduflow.test` | `admin123` |
| **Learner** | `learner1@gmail.com` | `learner123` |

Hard-refresh after updates: `Ctrl+F5`.

---

## Start here for the client meeting

| Document | Purpose |
|----------|---------|
| **[PITCH.md](PITCH.md)** | 12-minute walkthrough script + checklist |
| **[BUILD.md](BUILD.md)** | Local run, PWA install, Android APK (Capacitor) |
| This README | Features, Firebase, modes |

---

## Features

- Administrator & learner roles
- Course catalog + **apply → approve / reject**
- NQF pilot programmes with **SAQA IDs**, unit standards, learning outcomes
- Learner guides, modules, quizzes, summative assignments
- **Rubric marking**, **feedback**, **resubmit after fail**, **bulk grade**
- Progress reports + demo certificate
- Inbox notices (Gmail-linked)
- Live tab-sync (two windows update together)
- PWA-ready + Capacitor path for Android APK
- Firebase-ready for real multi-user cloud

---

## Run on your computer

```bash
git clone https://github.com/jlephoto23-collab/EduFlow-LMS.git
cd EduFlow-LMS
npm start
```

Open **http://localhost:3000**

Full build / APK steps: **[BUILD.md](BUILD.md)**

---

## Firebase (production multi-user)

| File | Purpose |
|------|---------|
| `js/firebase-config.js` | Paste your Firebase web config |
| `js/firebase.js` | Auth + Firestore helpers |
| `js/store.js` | Demo mode (localStorage + BroadcastChannel) |

- **Config empty** → demo mode (current live site)
- **`projectId` set** → cloud mode; badge can show **Live cloud**

1. [Firebase Console](https://console.firebase.google.com) → create project  
2. Enable **Email/Password** auth  
3. Create **Firestore** database  
4. Paste config into `js/firebase-config.js`  
5. Add authorized domain: `jlephoto23-collab.github.io`  

---

## Modes

| Mode | How | Multi-device | Best for |
|------|-----|-------------|----------|
| Tab-sync (default) | localStorage + BroadcastChannel | No | Client pitch |
| Firebase | Auth + Firestore | Yes | Real pilot / paid |

---

## Pitch one-liner

> “The product is live on the web today with full sample data and real-time UI updates. Production Phase 1 connects the same app to Firebase so every learner and trainer shares one secure cloud database.”

---

## Licence

Private / unlicensed demo for client evaluation unless otherwise agreed.
