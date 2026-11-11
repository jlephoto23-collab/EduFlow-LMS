# EduFlow LMS

Learning Management System for training providers.

## 🟢 Live demo

**https://jlephoto23-collab.github.io/EduFlow-LMS/**

Share this link with buyers, trainers, and learners.

| Role | Email | Password |
|------|--------|----------|
| Trainer | `trainer@eduflow.test` | `trainer123` |
| Learner | `learner1@eduflow.test` | `learner123` |

---

## Features

- Trainer & learner roles
- Course catalog + enrolment **request → approve/reject**
- Lessons, quizzes, written assignments
- Submissions + trainer grading
- Progress reports + completion certificate
- **Live tab-sync** (two browser windows update in real time)
- **Firebase-ready** for real multi-device cloud mode

---

## Firebase integration (real multi-user live)

### Files

| File | Purpose |
|------|---------|
| `js/firebase-config.js` | Paste your Firebase web config here |
| `js/firebase.js` | Auth + Firestore helpers, seed, security rules example |
| `js/store.js` | localStorage + BroadcastChannel (demo mode) |
| `js/app.js` | UI and flows |

### When is Firebase used?

- **Config empty** → localStorage + live tab-sync (current demo)
- **`projectId` set** → cloud mode (`js/firebase.js`); badge shows **Live cloud**

### Step-by-step setup

1. Open [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. Project settings → **Add app** → **Web** → register app name (e.g. EduFlow).
3. Copy the `firebaseConfig` object.
4. Open `js/firebase-config.js` and paste values (uncomment all fields).
5. **Authentication** → Sign-in method → enable **Email/Password**.
6. **Firestore Database** → Create database → start in **test mode** for pilot.
7. Push the updated config → hard-refresh the site.
8. Create users in Authentication + a `users/{uid}` doc with `role: "trainer"` or `"learner"`.
9. Add authorized domain: `jlephoto23-collab.github.io`.

### Firestore collections

`users` · `courses` · `enrolments` · `progress` · `assignments` · `submissions` · `attempts`

Security rules example: see bottom of `js/firebase.js`.

---

## Modes

| Mode | How | Multi-device | Best for |
|------|-----|-------------|----------|
| Tab-sync (default) | localStorage + BroadcastChannel | No | Pitch demo |
| Firebase | Auth + Firestore | Yes | Real students / paid pilot |

---

## Pitch wording

> “The product is live on the web today with full sample data and real-time UI updates. Production Phase 1 connects the same app to Firebase so every learner and trainer shares one secure cloud database.”
