# EduFlow LMS

Learning Management System for training providers.

**Live demo:** https://jlephoto23-collab.github.io/EduFlow-LMS/

## Demo logins (local / tab-sync mode)

| Role | Email | Password |
|------|--------|----------|
| Trainer | trainer@eduflow.test | trainer123 |
| Learner | learner1@eduflow.test | learner123 |

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
2. Project settings → **Add app** → **Web** (`</>`) → register app name (e.g. EduFlow).
3. Copy the `firebaseConfig` object.
4. Open `js/firebase-config.js` and paste values (uncomment all fields):

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

5. **Authentication** → Sign-in method → enable **Email/Password**.
6. **Firestore Database** → Create database → start in **test mode** for pilot.
7. Push the updated `firebase-config.js` to GitHub → hard-refresh the site.
8. Create users:
   - **Option A:** Authentication → Add user (email/password), then add a document in `users/{uid}` with `{ name, email, role: "trainer" | "learner" }`.
   - **Option B:** Use **New learner? Create account** in the app (creates Auth user + `users` profile as learner). Promote one user to trainer in Firestore (`role: "trainer"`).
9. Optional: in browser console after login as trainer, call seed from the integration module (or add a “Seed cloud sample” button later).

### Firestore collections

| Collection | Main fields |
|------------|-------------|
| `users` | name, email, role |
| `courses` | title, description, category, trainerId, lessons[] |
| `enrolments` | courseId, learnerId, status (`pending`\|`approved`), enrolledAt |
| `progress` | learnerId, courseId, completedLessonIds[], percent |
| `assignments` | courseId, lessonId, title, instructions, maxScore |
| `submissions` | assignmentId, courseId, learnerId, text, status, score |
| `attempts` | learnerId, courseId, lessonId, score, passed, at |

### Security rules (pilot → production)

Example rules are documented at the bottom of `js/firebase.js`.  
**Test mode is fine for a private pilot only.** Before real students:

- Require `request.auth != null`
- Restrict course writes to trainers
- Restrict submission updates to owner or trainer

### Hosting

GitHub Pages is enough for the frontend. Firebase only holds Auth + data.  
Optional: Firebase Hosting instead of GitHub Pages.

### Authorized domains

Authentication → Settings → **Authorized domains** must include:

- `localhost` (local testing)
- `jlephoto23-collab.github.io`

---

## Modes compared

| Mode | How | Multi-device | Best for |
|------|-----|-------------|----------|
| Tab-sync (default) | localStorage + BroadcastChannel | No (same browser profile) | Pitch demo |
| Firebase | Auth + Firestore | Yes | Real students / paid pilot |

---

## Pitch wording

> “The product is live on the web today with full sample data and real-time UI updates. Production Phase 1 connects the same app to Firebase so every learner and trainer shares one secure cloud database.”
