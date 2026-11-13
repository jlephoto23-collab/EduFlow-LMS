# EduFlow LMS — Client pitch guide

**Live demo:** https://jlephoto23-collab.github.io/EduFlow-LMS/

Use this for a **10–15 minute** walkthrough with a training provider.

---

## Demo accounts

| Role | Email | Password |
|------|--------|----------|
| **Administrator** | `admin@eduflow.test` | `admin123` |
| **Learner** | `learner1@gmail.com` | `learner123` |

Tip: open **two browser windows** (or phone + laptop) to show live tab-sync.

---

## Suggested script (about 12 minutes)

### 1. Opening (1 min)

> “EduFlow is a mobile-first LMS for training providers. Learners apply, get approved, complete modules and assessments, and receive results — including on their Gmail. Today’s demo is live on the web with sample NQF Level 4 programmes.”

Open the **live demo** link. Point out the dark, app-like UI and **Install** / Add to Home Screen if on mobile.

### 2. Administrator (5 min)

1. Sign in as **admin@eduflow.test** / **admin123**.
2. **Dashboard** — programmes, learners, pending access, to grade (tiles open the right screens).
3. **Programmes** — open one NQF course; show **SAQA ID**, unit standards, learning outcomes.
4. **Approvals** — approve a pending application (or note the sample pending request).
5. **Grade** — open a submission (or have a learner submit first):
   - **Rubric** (Content / Structure / Application)
   - **Feedback** to the learner
   - **Save result** or **Save all marks** (bulk)
6. **Reports** — progress table, **Bulk grade**, copy summary.
7. **More → Provider settings** — set *their* provider name and contact email for the meeting.

### 3. Learner (4 min)

1. Log out → sign in as **learner1@gmail.com** / **learner123**.
2. **My learning** — progress on enrolled programmes.
3. **Courses** — apply for a programme (Gmail-linked).
4. Open a course → **learner guide / module** → mark complete.
5. **Quiz** — complete; show auto score and pass/fail.
6. **Assignment** — submit 20+ characters.
7. After admin grades: **Results** (mark + feedback) and **Inbox** (notification).
8. If mark is below pass mark → show **Resubmit for marking**.

### 4. Close (2 min)

> “What you saw runs today as a web app and PWA. Phase 1 for production is Firebase Auth + Firestore so every trainer and learner shares one secure cloud database. We can brand it with your logo, lock down roles, and package an Android install via Capacitor.”

Hand them:
- Live URL  
- This repo (or a ZIP)  
- Next steps: branding → Firebase → pilot cohort  

---

## Value points to stress

- End-to-end flow: **apply → approve → learn → assess → grade → results**
- **NQF / SAQA-aligned** pilot content (register references + original pilot wording)
- **Gmail-linked** learner communications (inbox + mailto)
- **Rubrics, feedback, resubmit, bulk grade**
- Works on **phone browser**; installable as **PWA**; Android APK path documented in `BUILD.md`

---

## Before the meeting checklist

- [ ] Live demo opens after hard-refresh (`Ctrl+F5`)
- [ ] Admin and learner logins work
- [ ] Provider settings set to the client’s name/email
- [ ] One assignment is ready to grade (or submit live)
- [ ] Second window ready to show live sync
- [ ] Phone ready for “Add to Home Screen” if Wi‑Fi allows
